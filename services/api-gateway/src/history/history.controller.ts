import { Controller, Get, Post, Param, Body, UseGuards, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes/:noteId/history')
export class HistoryController {
  constructor(@Inject('HISTORY_SERVICE') private readonly historyClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'Get note revision history' })
  findAll(@Param('noteId') noteId: string, @Query('page') page = 1) {
    return firstValueFrom(this.historyClient.send('history.list', { noteId, page }));
  }

  @Get(':version')
  @ApiOperation({ summary: 'Get a specific version' })
  findVersion(@Param('noteId') noteId: string, @Param('version') version: string) {
    return firstValueFrom(this.historyClient.send('history.getVersion', { noteId, version: +version }));
  }

  @Post(':version/restore')
  @ApiOperation({ summary: 'Restore note to a specific version' })
  restore(@Param('noteId') noteId: string, @Param('version') version: string, @CurrentUser() user: any) {
    return firstValueFrom(
      this.historyClient.send('history.restore', { noteId, version: +version, userId: user.userId }),
    );
  }
}
