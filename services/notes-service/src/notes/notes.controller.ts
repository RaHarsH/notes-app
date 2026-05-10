import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { NotesService } from './notes.service';

@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @MessagePattern('notes.create')
  create(@Payload() data: any) {
    return this.notesService.create(data);
  }

  @MessagePattern('notes.list')
  findAll(@Payload() data: any) {
    return this.notesService.findAll(data);
  }

  @MessagePattern('notes.findOne')
  findOne(@Payload() data: any) {
    return this.notesService.findOne(data);
  }

  @MessagePattern('notes.update')
  update(@Payload() data: any) {
    return this.notesService.update(data);
  }

  @MessagePattern('notes.delete')
  delete(@Payload() data: any) {
    return this.notesService.delete(data);
  }

  @MessagePattern('notes.share')
  share(@Payload() data: any) {
    return this.notesService.share(data);
  }

  @MessagePattern('notes.collaborators')
  collaborators(@Payload() data: any) {
    return this.notesService.getCollaborators(data);
  }
}
