import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HistoryController } from './history.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'HISTORY_SERVICE',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: { servers: [config.get('NATS_URL', 'nats://localhost:4222')] },
        }),
      },
    ]),
  ],
  controllers: [HistoryController],
})
export class HistoryModule {}
