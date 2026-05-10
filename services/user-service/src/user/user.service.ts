import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createProfile(data: { userId: string; email: string; displayName: string }) {
    const profile = await this.prisma.userProfile.upsert({
      where: { id: data.userId },
      create: { id: data.userId, email: data.email, displayName: data.displayName },
      update: {},
    });
    this.logger.log(`Profile created/found: ${data.userId}`);
    return profile;
  }

  async getProfile(data: { userId: string }) {
    const profile = await this.prisma.userProfile.findUnique({ where: { id: data.userId } });
    if (!profile) throw new NotFoundException('User profile not found');
    return profile;
  }

  async findOne(data: { userId: string }) {
    return this.getProfile(data);
  }

  async updateProfile(data: { userId: string; displayName?: string; bio?: string; avatarUrl?: string }) {
    return this.prisma.userProfile.update({
      where: { id: data.userId },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });
  }

  async search(data: { query: string }) {
    return this.prisma.userProfile.findMany({
      where: {
        OR: [
          { displayName: { contains: data.query, mode: 'insensitive' } },
          { email: { contains: data.query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: 20,
      select: { id: true, displayName: true, email: true, avatarUrl: true },
    });
  }
}
