import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
