import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [ConfigModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
