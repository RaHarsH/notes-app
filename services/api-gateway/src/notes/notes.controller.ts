import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus, Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ShareNoteDto } from './dto/share-note.dto';

@ApiTags('Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(@Inject('NOTES_SERVICE') private readonly notesClient: ClientProxy) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new note' })
  create(@Body() dto: CreateNoteDto, @CurrentUser() user: any) {
    return firstValueFrom(this.notesClient.send('notes.create', { ...dto, ownerId: user.userId }));
  }

  @Get()
  @ApiOperation({ summary: 'List all notes for current user' })
  findAll(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return firstValueFrom(this.notesClient.send('notes.list', { userId: user.userId, page, limit }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a note by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(this.notesClient.send('notes.findOne', { noteId: id, userId: user.userId }));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update note metadata' })
  update(@Param('id') id: string, @Body() dto: UpdateNoteDto, @CurrentUser() user: any) {
    return firstValueFrom(this.notesClient.send('notes.update', { noteId: id, ...dto, userId: user.userId }));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a note' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(this.notesClient.send('notes.delete', { noteId: id, userId: user.userId }));
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share a note with another user' })
  share(@Param('id') id: string, @Body() dto: ShareNoteDto, @CurrentUser() user: any) {
    return firstValueFrom(this.notesClient.send('notes.share', { noteId: id, ownerId: user.userId, ...dto }));
  }

  @Get(':id/collaborators')
  @ApiOperation({ summary: 'List collaborators for a note' })
  collaborators(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(this.notesClient.send('notes.collaborators', { noteId: id, userId: user.userId }));
  }
}
