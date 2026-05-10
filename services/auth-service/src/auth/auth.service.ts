import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly natsClient: ClientProxy;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.natsClient = ClientProxyFactory.create({
      transport: Transport.NATS,
      options: { servers: [config.get('NATS_URL', 'nats://localhost:4222')] },
    } as any);
  }

  // ── Signup ─────────────────────────────────────────────────────
  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshSession(user.id, tokens.refreshToken);

    // Emit event so user-service creates the profile
    this.natsClient.emit('user.registered', {
      userId: user.id, email: user.email,
      displayName: dto.displayName || user.email.split('@')[0],
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`New user registered: ${user.email}`);
    return { user, ...tokens };
  }

  // ── Login ──────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshSession(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email },
      ...tokens,
    };
  }

  // ── Refresh ────────────────────────────────────────────────────
  async refreshTokens(dto: RefreshTokenDto) {
    const session = await this.prisma.authSession.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.authSession.delete({ where: { id: session.id } });
    const tokens = await this.generateTokens(session.userId, session.user.email);
    await this.saveRefreshSession(session.userId, tokens.refreshToken);

    return tokens;
  }

  // ── Logout ─────────────────────────────────────────────────────
  async logout(refreshToken: string) {
    await this.prisma.authSession.deleteMany({ where: { refreshToken } });
    return { success: true };
  }

  // ── Validate JWT (called by API Gateway) ───────────────────────
  async validateToken(token: string) {
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });
      return { valid: true, userId: payload.sub, email: payload.email };
    } catch {
      return { valid: false };
    }
  }

  // ── Helpers ────────────────────────────────────────────────────
  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      ),
      this.jwt.signAsync(
        { sub: userId, email },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async saveRefreshSession(userId: string, refreshToken: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.authSession.create({
      data: { userId, refreshToken, expiresAt },
    });
  }
}
