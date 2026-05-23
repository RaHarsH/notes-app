import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CollaborationGateway } from './collaboration.gateway';

@Controller()
export class CollaborationController {
  private readonly logger = new Logger(CollaborationController.name);

  constructor(private readonly gateway: CollaborationGateway) {}

  @EventPattern('note.shared')
  handleNoteShared(@Payload() data: any) {
    this.logger.log(`Note ${data.noteId} shared with ${data.sharedWithUserId}. Emitting via WebSocket.`);
    // Notify the user who received the share
    this.gateway.server.to(`user:${data.sharedWithUserId}`).emit('notification', {
      type: 'NOTE_SHARED',
      noteId: data.noteId,
      ownerId: data.ownerId,
      permission: data.permission,
      message: 'A new note has been shared with you.',
    });
  }

  @EventPattern('comment.added')
  handleCommentAdded(@Payload() data: any) {
    this.logger.log(`Comment added to note ${data.noteId}. Emitting via WebSocket.`);
    this.gateway.server.to(`note:${data.noteId}`).emit('comment-updated', {
      action: 'added',
      noteId: data.noteId,
      threadId: data.threadId,
      commentId: data.commentId,
      authorId: data.authorId,
    });
  }

  @EventPattern('comment.resolved')
  handleCommentResolved(@Payload() data: any) {
    this.gateway.server.to(`note:${data.noteId}`).emit('comment-updated', {
      action: 'resolved',
      noteId: data.noteId,
      threadId: data.threadId,
      resolvedById: data.resolvedById,
    });
  }

  @EventPattern('comment.updated')
  handleCommentUpdated(@Payload() data: any) {
    this.gateway.server.to(`note:${data.noteId}`).emit('comment-updated', {
      action: 'updated',
      noteId: data.noteId,
      threadId: data.threadId,
      content: data.content,
      updatedById: data.updatedById,
    });
  }

  @EventPattern('comment.deleted')
  handleCommentDeleted(@Payload() data: any) {
    this.gateway.server.to(`note:${data.noteId}`).emit('comment-updated', {
      action: 'deleted',
      noteId: data.noteId,
      threadId: data.threadId,
      deletedById: data.deletedById,
    });
  }
}
