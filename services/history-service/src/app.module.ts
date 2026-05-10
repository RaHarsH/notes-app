import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HistoryModule } from './history/history.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HistoryModule,
  ],
})
export class AppModule {}
