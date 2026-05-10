import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);
  private readonly natsClient: ClientProxy;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.natsClient = ClientProxyFactory.create({
      transport: Transport.NATS,
      options: { servers: [config.get('NATS_URL', 'nats://localhost:4222')] },
    } as any);
  }

  async createThread(data: { noteId: string; anchorId: string; authorId: string; content: string; mentions?: string[] }) {
    const thread = await this.prisma.commentThread.create({
      data: {
        noteId: data.noteId,
        anchorId: data.anchorId,
        comments: {
          create: { authorId: data.authorId, content: data.content, mentions: data.mentions || [] },
        },
      },
      include: { comments: true },
    });

    // Emit comment added event
    this.natsClient.emit('comment.added', {
      commentId: thread.comments[0].id,
      threadId: thread.id,
      noteId: data.noteId,
      authorId: data.authorId,
      content: data.content,
      mentions: data.mentions || [],
      timestamp: new Date().toISOString(),
    });

    if (data.mentions?.length) {
      data.mentions.forEach((userId) => {
        this.natsClient.emit('comment.mentioned', { userId, noteId: data.noteId, commentId: thread.comments[0].id });
      });
    }

    return thread;
  }

  async getThreads(data: { noteId: string }) {
    return this.prisma.commentThread.findMany({
      where: { noteId: data.noteId },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(data: { threadId: string; authorId: string; content: string; mentions?: string[] }) {
    const comment = await this.prisma.comment.create({
      data: {
        threadId: data.threadId,
        authorId: data.authorId,
        content: data.content,
        mentions: data.mentions || [],
      },
    });

    const thread = await this.prisma.commentThread.findUnique({ where: { id: data.threadId } });

    this.natsClient.emit('comment.added', {
      commentId: comment.id, threadId: data.threadId,
      noteId: thread?.noteId, authorId: data.authorId,
      content: data.content, mentions: data.mentions || [],
      timestamp: new Date().toISOString(),
    });

    return comment;
  }

  async resolve(data: { threadId: string; userId: string }) {
    const thread = await this.prisma.commentThread.update({
      where: { id: data.threadId },
      data: { status: 'RESOLVED' },
    });

    this.natsClient.emit('comment.resolved', { threadId: data.threadId, noteId: thread.noteId, resolvedById: data.userId });
    return thread;
  }
}
