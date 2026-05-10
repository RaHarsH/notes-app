import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveRevision(data: { noteId: string; authorId: string; content: string }) {
    // Get next version number
    const lastRevision = await this.prisma.noteRevision.findFirst({
      where: { noteId: data.noteId },
      orderBy: { version: 'desc' },
    });
    const version = (lastRevision?.version ?? 0) + 1;

    const revision = await this.prisma.noteRevision.create({
      data: { noteId: data.noteId, authorId: data.authorId, content: data.content, version },
    });

    this.logger.log(`Saved revision v${version} for note ${data.noteId}`);
    return revision;
  }

  async list(data: { noteId: string; page: number }) {
    const limit = 20;
    const skip = (data.page - 1) * limit;

    const [revisions, total] = await Promise.all([
      this.prisma.noteRevision.findMany({
        where: { noteId: data.noteId },
        orderBy: { version: 'desc' },
        skip,
        take: limit,
        select: { id: true, version: true, authorId: true, changeSummary: true, createdAt: true },
      }),
      this.prisma.noteRevision.count({ where: { noteId: data.noteId } }),
    ]);

    return { revisions, total };
  }

  async getVersion(data: { noteId: string; version: number }) {
    return this.prisma.noteRevision.findUnique({
      where: { noteId_version: { noteId: data.noteId, version: data.version } },
    });
  }

  async restore(data: { noteId: string; version: number; userId: string }) {
    const revision = await this.getVersion(data);
    if (!revision) return { error: 'Revision not found' };
    // Returns content — gateway sends back to notes-service to apply
    return { content: revision.content, version: revision.version, noteId: data.noteId };
  }
}
