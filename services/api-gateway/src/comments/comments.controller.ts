import { Controller, Get, Post, Patch, Param, Body, UseGuards, Inject, Delete } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class CreateCommentDto {
  @ApiProperty() @IsString() threadId: string;
  @ApiProperty() @IsString() content: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() mentions?: string[];
}

class CreateThreadDto {
  @ApiProperty() @IsString() noteId: string;
  @ApiProperty() @IsString() anchorId: string;
  @ApiProperty() @IsString() content: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() mentions?: string[];
}

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(@Inject('COMMENT_SERVICE') private readonly commentClient: ClientProxy) {}

  @Post('threads')
  @ApiOperation({ summary: 'Start a new comment thread' })
  createThread(@Body() dto: CreateThreadDto, @CurrentUser() user: any) {
    return firstValueFrom(this.commentClient.send('comments.createThread', { ...dto, authorId: user.userId }));
  }

  @Get('threads/:noteId')
  @ApiOperation({ summary: 'Get all comment threads for a note' })
  getThreads(@Param('noteId') noteId: string) {
    return firstValueFrom(this.commentClient.send('comments.getThreads', { noteId }));
  }

  @Post()
  @ApiOperation({ summary: 'Add a comment to a thread' })
  addComment(@Body() dto: CreateCommentDto, @CurrentUser() user: any) {
    return firstValueFrom(this.commentClient.send('comments.add', { ...dto, authorId: user.userId }));
  }

  @Patch('threads/:threadId/resolve')
  @ApiOperation({ summary: 'Resolve a comment thread' })
  resolve(@Param('threadId') threadId: string, @CurrentUser() user: any) {
    return firstValueFrom(this.commentClient.send('comments.resolve', { threadId, userId: user.userId }));
  }

  @Patch('threads/:threadId')
  @ApiOperation({ summary: 'Update a comment thread' })
  update(@Param('threadId') threadId: string, @Body() dto: { content: string }, @CurrentUser() user: any) {
    return firstValueFrom(this.commentClient.send('comments.update', { threadId, content: dto.content, userId: user.userId }));
  }

  @Delete('threads/:threadId')
  @ApiOperation({ summary: 'Delete a comment thread' })
  delete(@Param('threadId') threadId: string, @CurrentUser() user: any) {
    return firstValueFrom(this.commentClient.send('comments.delete', { threadId, userId: user.userId }));
  }
}
