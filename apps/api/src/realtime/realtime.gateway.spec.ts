import { Test, TestingModule } from '@nestjs/testing'
import { RealtimeGateway } from './realtime.gateway'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { SocketEvent, TaskPriority } from '@flowboard/shared-types'

import { Server, Socket } from 'socket.io'
import { TaskSummary } from '@flowboard/shared-types'

describe('RealtimeGateway', () => {
  let gateway: RealtimeGateway

  const mockJwt = {
    verifyAsync: jest.fn(),
  }

  const mockConfig = {
    get: jest.fn().mockReturnValue('test-secret'),
  }

  const mockPrisma = {
    board: {
      findUnique: jest.fn(),
    },
  }

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    gateway = module.get<RealtimeGateway>(RealtimeGateway)
    gateway.server = mockServer as unknown as Server
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(gateway).toBeDefined()
  })

  describe('handleConnection', () => {
    it('should authenticate client if valid JWT token is provided', async () => {
      const mockSocket = {
        id: 'sock-1',
        handshake: {
          auth: { token: 'valid-token' },
        },
        data: {} as Record<string, unknown>,
        disconnect: jest.fn(),
      } as unknown as Socket

      mockJwt.verifyAsync.mockResolvedValueOnce({ sub: 'usr-1', email: 'alice@test.com' })

      await gateway.handleConnection(mockSocket)

      expect(mockSocket.disconnect).not.toHaveBeenCalled()
      expect(mockSocket.data.user).toEqual({ sub: 'usr-1', email: 'alice@test.com' })
    })

    it('should disconnect client if no token provided', async () => {
      const mockSocket = {
        id: 'sock-2',
        handshake: { auth: {} },
        disconnect: jest.fn(),
      } as unknown as Socket

      await gateway.handleConnection(mockSocket)

      expect(mockSocket.disconnect).toHaveBeenCalled()
    })
  })

  describe('handleJoinBoard', () => {
    it('should allow user with workspace membership to join board room', async () => {
      const mockSocket = {
        id: 'sock-1',
        data: { user: { sub: 'usr-1' } },
        join: jest.fn(),
      } as unknown as Socket

      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'board-1',
        workspace: {
          members: [{ id: 'mem-1' }],
        },
      })

      const res = await gateway.handleJoinBoard(mockSocket, { boardId: 'board-1' })

      expect(res).toEqual({ success: true, room: 'board:board-1' })
      expect(mockSocket.join).toHaveBeenCalledWith('board:board-1')
    })
  })

  describe('broadcasting events', () => {
    it('should emit task created to board room', () => {
      const task: TaskSummary = {
        id: 'task-1',
        columnId: 'col-1',
        title: 'Realtime Task',
        priority: TaskPriority.HIGH,
        order: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      gateway.emitTaskCreated('board-1', task)

      expect(mockServer.to).toHaveBeenCalledWith('board:board-1')
      expect(mockServer.emit).toHaveBeenCalledWith(SocketEvent.TASK_CREATED, task)
    })
  })
})
