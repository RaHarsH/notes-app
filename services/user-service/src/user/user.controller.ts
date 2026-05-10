import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('users.getProfile')
  getProfile(@Payload() data: any) {
    return this.userService.getProfile(data);
  }

  @MessagePattern('users.findOne')
  findOne(@Payload() data: any) {
    return this.userService.findOne(data);
  }

  @MessagePattern('users.updateProfile')
  update(@Payload() data: any) {
    return this.userService.updateProfile(data);
  }

  @MessagePattern('users.search')
  search(@Payload() data: any) {
    return this.userService.search(data);
  }

  // Consumes user.registered event from auth-service
  @EventPattern('user.registered')
  handleUserRegistered(@Payload() data: any) {
    return this.userService.createProfile(data);
  }
}
