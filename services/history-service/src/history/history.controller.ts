import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { HistoryService } from './history.service';

@Controller()
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // Consumes note.updated event to auto-save revisions
  @EventPattern('note.updated')
  handleNoteUpdated(@Payload() data: any) {
    return this.historyService.saveRevision({
      noteId: data.noteId,
      authorId: data.authorId,
      content: data.content,
    });
  }

  @MessagePattern('history.list')
  list(@Payload() data: any) {
    return this.historyService.list(data);
  }

  @MessagePattern('history.getVersion')
  getVersion(@Payload() data: any) {
    return this.historyService.getVersion(data);
  }

  @MessagePattern('history.restore')
  restore(@Payload() data: any) {
    return this.historyService.restore(data);
  }

  @MessagePattern('history.save')
  save(@Payload() data: any) {
    return this.historyService.saveRevision(data);
  }
}
