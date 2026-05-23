import { Controller, Get, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(@Inject('USER_SERVICE') private readonly userClient: ClientProxy) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@CurrentUser() user: any) {
    return firstValueFrom(this.userClient.send('users.getProfile', { userId: user.userId }));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name or email' })
  search(@Query('query') query: string) {
    return firstValueFrom(this.userClient.send('users.search', { query: query || '' }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return firstValueFrom(this.userClient.send('users.findOne', { userId: id }));
  }
}
