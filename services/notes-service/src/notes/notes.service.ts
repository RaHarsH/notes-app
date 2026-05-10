import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);
  private readonly natsClient: ClientProxy;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.natsClient = ClientProxyFactory.create({
      transport: Transport.NATS,
      options: { servers: [config.get('NATS_URL', 'nats://localhost:4222')] },
    } as any);
  }

  async create(data: { title: string; content?: string; ownerId: string }) {
    const note = await this.prisma.note.create({
      data: {
        title: data.title,
        content: data.content || '{}',
        ownerId: data.ownerId,
        collaborators: {
          create: { userId: data.ownerId, permission: 'OWNER' },
        },
      },
      include: { collaborators: true },
    });

    this.natsClient.emit('note.created', {
      noteId: note.id, ownerId: note.ownerId, title: note.title, timestamp: new Date().toISOString(),
    });

    this.logger.log(`Note created: ${note.id}`);
    return note;
  }

  async findAll(data: { userId: string; page: number; limit: number }) {
    const skip = (data.page - 1) * data.limit;
    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where: {
          collaborators: { some: { userId: data.userId } },
          isArchived: false,
        },
        include: { collaborators: true },
        skip,
        take: +data.limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.note.count({
        where: { collaborators: { some: { userId: data.userId } }, isArchived: false },
      }),
    ]);
    return { notes, total, page: data.page, limit: data.limit };
  }

  async findOne(data: { noteId: string; userId: string }) {
    const note = await this.prisma.note.findUnique({
      where: { id: data.noteId },
      include: { collaborators: true },
    });
    if (!note) throw new NotFoundException('Note not found');

    const hasAccess = note.collaborators.some((c) => c.userId === data.userId) || note.isPublic;
    if (!hasAccess) throw new ForbiddenException('Access denied');

    return note;
  }

  async update(data: { noteId: string; userId: string; title?: string; content?: string; isPublic?: boolean }) {
    await this.validateEditor(data.noteId, data.userId);

    const note = await this.prisma.note.update({
      where: { id: data.noteId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
    });

    this.natsClient.emit('note.updated', {
      noteId: note.id, authorId: data.userId,
      content: note.content, timestamp: new Date().toISOString(),
    });

    return note;
  }

  async delete(data: { noteId: string; userId: string }) {
    await this.validateOwner(data.noteId, data.userId);
    await this.prisma.note.update({ where: { id: data.noteId }, data: { isArchived: true } });
    return { success: true };
  }

  async share(data: { noteId: string; ownerId: string; sharedWithUserId: string; permission: 'EDITOR' | 'VIEWER' }) {
    await this.validateOwner(data.noteId, data.ownerId);

    const collaborator = await this.prisma.noteCollaborator.upsert({
      where: { noteId_userId: { noteId: data.noteId, userId: data.sharedWithUserId } },
      create: { noteId: data.noteId, userId: data.sharedWithUserId, permission: data.permission },
      update: { permission: data.permission },
    });

    this.natsClient.emit('note.shared', {
      noteId: data.noteId, ownerId: data.ownerId,
      sharedWithUserId: data.sharedWithUserId, permission: data.permission,
    });

    return collaborator;
  }

  async getCollaborators(data: { noteId: string; userId: string }) {
    await this.findOne(data);
    return this.prisma.noteCollaborator.findMany({ where: { noteId: data.noteId } });
  }

  private async validateOwner(noteId: string, userId: string) {
    const collab = await this.prisma.noteCollaborator.findUnique({
      where: { noteId_userId: { noteId, userId } },
    });
    if (!collab || collab.permission !== 'OWNER') throw new ForbiddenException('Only owner can perform this action');
  }

  private async validateEditor(noteId: string, userId: string) {
    const collab = await this.prisma.noteCollaborator.findUnique({
      where: { noteId_userId: { noteId, userId } },
    });
    if (!collab || collab.permission === 'VIEWER') throw new ForbiddenException('Edit access required');
  }
}
