import { Controller, Get, Patch, Param, UseGuards, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(@Inject('NOTIFICATION_SERVICE') private readonly notifClient: ClientProxy) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  findAll(@CurrentUser() user: any, @Query('unread') unread?: boolean) {
    return firstValueFrom(this.notifClient.send('notifications.list', { userId: user.userId, unread }));
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  unreadCount(@CurrentUser() user: any) {
    return firstValueFrom(this.notifClient.send('notifications.unreadCount', { userId: user.userId }));
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return firstValueFrom(this.notifClient.send('notifications.markRead', { id, userId: user.userId }));
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: any) {
    return firstValueFrom(this.notifClient.send('notifications.markAllRead', { userId: user.userId }));
  }
}
