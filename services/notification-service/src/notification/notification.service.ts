import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type NotificationType = 'NOTE_SHARED' | 'COMMENT_ADDED' | 'MENTION' | 'COMMENT_RESOLVED' | 'NOTE_UPDATED';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; type: NotificationType; payload: Record<string, unknown> }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });
    this.logger.log(`Notification created for user ${data.userId}: ${data.type}`);
    return notification;
  }

  async list(data: { userId: string; unread?: boolean }) {
    return this.prisma.notification.findMany({
      where: {
        userId: data.userId,
        ...(data.unread === true && { read: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async unreadCount(data: { userId: string }) {
    const count = await this.prisma.notification.count({
      where: { userId: data.userId, read: false },
    });
    return { count };
  }

  async markRead(data: { id: string; userId: string }) {
    return this.prisma.notification.updateMany({
      where: { id: data.id, userId: data.userId },
      data: { read: true },
    });
  }

  async markAllRead(data: { userId: string }) {
    return this.prisma.notification.updateMany({
      where: { userId: data.userId, read: false },
      data: { read: true },
    });
  }
}
