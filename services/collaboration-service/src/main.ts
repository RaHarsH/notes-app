import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('CollaborationService');
  const port = process.env.COLLAB_SERVICE_PORT || 3004;

  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*' });

  await app.listen(port);
  logger.log(`Collaboration Service (WebSocket) running on port ${port}`);
}

bootstrap();
