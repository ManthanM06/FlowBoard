import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import {
  AuthResponse,
  AuthTokens,
  JwtPayload,
  UserSummary,
} from '@flowboard/shared-types'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (existingUser) {
      throw new ConflictException('Email is already registered')
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(dto.password, saltRounds)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    })

    const tokens = await this.generateTokens(user.id, user.email, user.name)
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken)

    return {
      user,
      tokens,
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const userSummary: UserSummary = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    }

    const tokens = await this.generateTokens(user.id, user.email, user.name)
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken)

    return {
      user: userSummary,
      tokens,
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'flowboard_dev_jwt_refresh_secret_key_change_in_production'

    let payload: JwtPayload
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access Denied')
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash
    )

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access Denied - Token Revoked')
    }

    const userSummary: UserSummary = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    }

    const tokens = await this.generateTokens(user.id, user.email, user.name)
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken)

    return {
      user: userSummary,
      tokens,
    }
  }

  async logout(userId: string): Promise<{ success: boolean; message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    })

    return {
      success: true,
      message: 'Successfully logged out',
    }
  }

  async getMe(userId: string): Promise<UserSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User profile not found')
    }

    return user
  }

  private async generateTokens(
    userId: string,
    email: string,
    name: string
  ): Promise<AuthTokens> {
    const jwtPayload: JwtPayload = {
      sub: userId,
      email,
      name,
    }

    const accessSecret =
      this.configService.get<string>('JWT_SECRET') ||
      'flowboard_dev_jwt_secret_key_change_in_production'
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'flowboard_dev_jwt_refresh_secret_key_change_in_production'

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: accessSecret,
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '15m',
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: refreshSecret,
        expiresIn:
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ])

    return {
      accessToken,
      refreshToken,
    }
  }

  private async updateRefreshTokenHash(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    })
  }
}
