import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

describe('AuthService', () => {
  let service: AuthService

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  }

  const mockJwtService = {
    signAsync: jest.fn().mockImplementation((payload) => {
      return Promise.resolve(`mock_token_for_${payload.sub}`)
    }),
    verifyAsync: jest.fn(),
  }

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test_access_secret'
      if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret'
      if (key === 'JWT_EXPIRES_IN') return '15m'
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d'
      return null
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('should throw ConflictException if user email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: '1', email: 'test@example.com' })

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        })
      ).rejects.toThrow(ConflictException)
    })

    it('should hash password and create new user when email is unique', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'usr-1',
        email: 'new@example.com',
        name: 'New User',
        avatarUrl: null,
      })
      mockPrisma.user.update.mockResolvedValueOnce({})

      const result = await service.register({
        email: 'new@example.com',
        password: 'Password123',
        name: 'New User',
      })

      expect(result.user.email).toBe('new@example.com')
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
      expect(mockPrisma.user.create).toHaveBeenCalled()
    })
  })

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException if password does not match', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword123', 10)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'usr-1',
        email: 'user@example.com',
        passwordHash,
        name: 'User One',
      })

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'WrongPassword123',
        })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should return tokens and user profile on valid credentials', async () => {
      const password = 'CorrectPassword123'
      const passwordHash = await bcrypt.hash(password, 10)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'usr-1',
        email: 'user@example.com',
        passwordHash,
        name: 'User One',
        avatarUrl: null,
      })
      mockPrisma.user.update.mockResolvedValueOnce({})

      const result = await service.login({
        email: 'user@example.com',
        password,
      })

      expect(result.user.id).toBe('usr-1')
      expect(result.tokens.accessToken).toBeDefined()
      expect(result.tokens.refreshToken).toBeDefined()
    })
  })

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error('Invalid token'))

      await expect(service.refreshToken('invalid_token')).rejects.toThrow(
        UnauthorizedException
      )
    })

    it('should rotate tokens when refresh token is valid and matches DB hash', async () => {
      const rawToken = 'valid_raw_refresh_token'
      const hashed = await bcrypt.hash(rawToken, 10)

      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: 'usr-1',
        email: 'user@example.com',
        name: 'User One',
      })

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'usr-1',
        email: 'user@example.com',
        name: 'User One',
        refreshTokenHash: hashed,
      })
      mockPrisma.user.update.mockResolvedValueOnce({})

      const result = await service.refreshToken(rawToken)
      expect(result.user.id).toBe('usr-1')
      expect(result.tokens.accessToken).toBeDefined()
    })
  })

  describe('logout', () => {
    it('should nullify refreshTokenHash in database', async () => {
      mockPrisma.user.update.mockResolvedValueOnce({})

      const res = await service.logout('usr-1')
      expect(res.success).toBe(true)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'usr-1' },
        data: { refreshTokenHash: null },
      })
    })
  })
})
