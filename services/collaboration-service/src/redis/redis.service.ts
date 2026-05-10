import { Injectable, Inject, Logger } from '@nestjs/common';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: any) {}

  // ── Presence ──────────────────────────────────────────────────
  async addPresence(noteId: string, userId: string, data: object) {
    const key = `presence:${noteId}`;
    await this.redis.hset(key, userId, JSON.stringify(data));
    await this.redis.expire(key, 3600); // 1 hour TTL
  }

  async removePresence(noteId: string, userId: string) {
    await this.redis.hdel(`presence:${noteId}`, userId);
  }

  async getPresence(noteId: string): Promise<Record<string, any>> {
    const raw = await this.redis.hgetall(`presence:${noteId}`);
    if (!raw) return {};
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, JSON.parse(v as string)]),
    );
  }

  // ── Cursors ───────────────────────────────────────────────────
  async setCursor(noteId: string, userId: string, position: object) {
    const key = `cursor:${noteId}:${userId}`;
    await this.redis.setex(key, 30, JSON.stringify(position));
  }

  async getCursors(noteId: string, userIds: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const uid of userIds) {
      const raw = await this.redis.get(`cursor:${noteId}:${uid}`);
      if (raw) result[uid] = JSON.parse(raw);
    }
    return result;
  }

  // ── Document State ────────────────────────────────────────────
  async saveDocState(noteId: string, content: string) {
    await this.redis.setex(`doc:${noteId}`, 3600, content);
  }

  async getDocState(noteId: string): Promise<string | null> {
    return this.redis.get(`doc:${noteId}`);
  }
}
