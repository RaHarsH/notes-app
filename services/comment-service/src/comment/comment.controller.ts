import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CommentService } from './comment.service';

@Controller()
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @MessagePattern('comments.createThread')
  createThread(@Payload() data: any) {
    return this.commentService.createThread(data);
  }

  @MessagePattern('comments.getThreads')
  getThreads(@Payload() data: any) {
    return this.commentService.getThreads(data);
  }

  @MessagePattern('comments.add')
  add(@Payload() data: any) {
    return this.commentService.addComment(data);
  }

  @MessagePattern('comments.resolve')
  resolve(@Payload() data: any) {
    return this.commentService.resolve(data);
  }
}
