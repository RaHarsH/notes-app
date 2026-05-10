import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

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
      payload: { noteId: data.noteId, sharedBy: data.ownerId, permission: data.permission },
    });
  }

  @EventPattern('comment.mentioned')
  handleMention(@Payload() data: any) {
    return this.notificationService.create({
      userId: data.userId,
      type: 'MENTION',
      payload: { noteId: data.noteId, commentId: data.commentId },
    });
  }

  @EventPattern('comment.added')
  handleCommentAdded(@Payload() data: any) {
    // Notify note collaborators (simplified — in prod would query notes-service)
    return this.notificationService.create({
      userId: data.authorId,  // In prod: fan out to all collaborators
      type: 'COMMENT_ADDED',
      payload: { noteId: data.noteId, threadId: data.threadId, commentId: data.commentId },
    });
  }

  @EventPattern('comment.resolved')
  handleCommentResolved(@Payload() data: any) {
    return this.notificationService.create({
      userId: data.resolvedById,
      type: 'COMMENT_RESOLVED',
      payload: { threadId: data.threadId, noteId: data.noteId },
    });
  }
}
