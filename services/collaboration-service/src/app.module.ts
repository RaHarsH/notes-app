import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollaborationModule } from './collaboration/collaboration.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    CollaborationModule,
  ],
})
export class AppModule {}
