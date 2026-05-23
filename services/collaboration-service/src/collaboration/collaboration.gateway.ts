import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
  activeNoteId?: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/collab',
})
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });

      client.userId = payload.sub;
      client.email = payload.email;
      
      // Join a personal room for direct notifications
      client.join(`user:${client.userId}`);

      this.logger.log(`Client connected: ${client.id} (user: ${client.userId}, email: ${client.email})`);
    } catch {
      this.logger.warn(`Unauthenticated connection rejected: ${client.id}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId && client.activeNoteId) {
      await this.redisService.removePresence(client.activeNoteId, client.userId);

      client.to(`note:${client.activeNoteId}`).emit('collaborator-left', {
        userId: client.userId,
        email: client.email,
        timestamp: new Date().toISOString(),
      });
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Join Note Room ────────────────────────────────────────────
  @SubscribeMessage('join-note')
  async handleJoinNote(
    @MessageBody() data: { noteId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomKey = `note:${data.noteId}`;
    client.join(roomKey);
    client.activeNoteId = data.noteId;

    const presenceData = {
      userId: client.userId,
      email: client.email,
      connectedAt: new Date().toISOString(),
      socketId: client.id,
    };

    await this.redisService.addPresence(data.noteId, client.userId, presenceData);

    // Get current document state from Redis cache
    const docState = await this.redisService.getDocState(data.noteId);

    // Get all current collaborators
    const presence = await this.redisService.getPresence(data.noteId);

    // Notify others
    client.to(roomKey).emit('collaborator-joined', presenceData);

    // Send current state to joining client
    return { success: true, docState, collaborators: Object.values(presence) };
  }

  // ── Leave Note Room ───────────────────────────────────────────
  @SubscribeMessage('leave-note')
  async handleLeaveNote(
    @MessageBody() data: { noteId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomKey = `note:${data.noteId}`;
    client.leave(roomKey);
    client.activeNoteId = undefined;

    await this.redisService.removePresence(data.noteId, client.userId);

    this.server.to(roomKey).emit('collaborator-left', {
      userId: client.userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // ── Document Update ───────────────────────────────────────────
  @SubscribeMessage('doc-update')
  async handleDocUpdate(
    @MessageBody() data: { noteId: string; content: string; version?: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Cache in Redis
    await this.redisService.saveDocState(data.noteId, data.content);

    // Broadcast to everyone else in the room
    client.to(`note:${data.noteId}`).emit('doc-synced', {
      content: data.content,
      authorId: client.userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // ── Cursor Update ─────────────────────────────────────────────
  @SubscribeMessage('cursor-update')
  async handleCursorUpdate(
    @MessageBody() data: { noteId: string; position: object },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    await this.redisService.setCursor(data.noteId, client.userId, data.position);

    client.to(`note:${data.noteId}`).emit('cursor-moved', {
      userId: client.userId,
      position: data.position,
    });
  }

  // ── Typing Indicators ─────────────────────────────────────────
  @SubscribeMessage('typing-start')
  handleTypingStart(
    @MessageBody() data: { noteId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.to(`note:${data.noteId}`).emit('typing', { userId: client.userId, isTyping: true });
  }

  @SubscribeMessage('typing-stop')
  handleTypingStop(
    @MessageBody() data: { noteId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.to(`note:${data.noteId}`).emit('typing', { userId: client.userId, isTyping: false });
  }
}
