import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload, ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { firstValueFrom } from 'rxjs';

@Controller()
export class NotificationController {
  private natsClient: ClientProxy;
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationService: NotificationService,
    private configService: ConfigService,
  ) {
    this.natsClient = ClientProxyFactory.create({
      transport: Transport.NATS,
      options: { servers: [this.configService.get('NATS_URL', 'nats://localhost:4222')] },
    } as any);
  }

  @MessagePattern('notifications.list')
  list(@Payload() data: any) {
    return this.notificationService.list(data);
  }

  @MessagePattern('notifications.unreadCount')
  unreadCount(@Payload() data: any) {
    return this.notificationService.unreadCount(data);
  }

  @MessagePattern('notifications.markRead')
  markRead(@Payload() data: any) {
    return this.notificationService.markRead(data);
  }

  @MessagePattern('notifications.markAllRead')
  markAllRead(@Payload() data: any) {
    return this.notificationService.markAllRead(data);
  }

  // ── Event Consumers ──────────────────────────────────────────
  @EventPattern('note.shared')
  handleNoteShared(@Payload() data: any) {
    return this.notificationService.create({
      userId: data.sharedWithUserId,
      type: 'NOTE_SHARED',
      payload: { noteId: data.noteId, sharedBy: data.ownerId, permission: data.permission, sourceUserId: data.ownerId },
    });
  }

  @EventPattern('comment.mentioned')
  handleMention(@Payload() data: any) {
    return this.notificationService.create({
      userId: data.userId,
      type: 'MENTION',
      payload: { noteId: data.noteId, commentId: data.commentId, sourceUserId: data.sourceUserId || data.authorId },
    });
  }

  @EventPattern('comment.added')
  async handleCommentAdded(@Payload() data: any) {
    try {
      const collaborators = await firstValueFrom(
        this.natsClient.send('notes.collaborators', { noteId: data.noteId, userId: data.authorId })
      ) as { userId: string }[];

      if (collaborators && Array.isArray(collaborators)) {
        for (const collab of collaborators) {
          if (collab.userId !== data.authorId) {
            await this.notificationService.create({
              userId: collab.userId,
              type: 'COMMENT_ADDED',
              payload: { noteId: data.noteId, threadId: data.threadId, commentId: data.commentId, sourceUserId: data.authorId },
            });
          }
        }
      }
    } catch (e) {
      this.logger.error('Failed to fan out comment notifications', e);
    }
  }

  @EventPattern('comment.resolved')
  async handleCommentResolved(@Payload() data: any) {
    try {
      const collaborators = await firstValueFrom(
        this.natsClient.send('notes.collaborators', { noteId: data.noteId, userId: data.resolvedById })
      ) as { userId: string }[];

      if (collaborators && Array.isArray(collaborators)) {
        for (const collab of collaborators) {
          if (collab.userId !== data.resolvedById) {
            await this.notificationService.create({
              userId: collab.userId,
              type: 'COMMENT_RESOLVED',
              payload: { threadId: data.threadId, noteId: data.noteId, sourceUserId: data.resolvedById },
            });
          }
        }
      }
    } catch (e) {
      this.logger.error('Failed to fan out comment resolved notifications', e);
    }
  }
}
