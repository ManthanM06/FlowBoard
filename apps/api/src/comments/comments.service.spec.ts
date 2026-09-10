import { Test, TestingModule } from '@nestjs/testing'
import { CommentsService } from './comments.service'
import { PrismaService } from '../prisma/prisma.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { WorkspaceRole } from '@flowboard/shared-types'
import { ForbiddenException, NotFoundException } from '@nestjs/common'

describe('CommentsService', () => {
  let service: CommentsService

  const mockPrisma = {
    workspaceMember: {
      findUnique: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  }

  const mockRealtime = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RealtimeGateway, useValue: mockRealtime },
      ],
    }).compile()

    service = module.get<CommentsService>(CommentsService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createComment', () => {
    it('should create comment and notify other assignees', async () => {
      const now = new Date()

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        title: 'Task Alpha',
        column: {
          boardId: 'board-1',
          board: { workspaceId: 'ws-1' },
        },
        assignees: [{ userId: 'usr-2' }],
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      mockPrisma.comment.create.mockResolvedValueOnce({
        id: 'comm-1',
        taskId: 'task-1',
        userId: 'usr-1',
        body: 'Great progress!',
        createdAt: now,
        user: {
          id: 'usr-1',
          name: 'Alice',
          email: 'alice@flowboard.dev',
          avatarUrl: null,
        },
      })

      const res = await service.createComment('task-1', 'usr-1', {
        body: 'Great progress!',
      })

      expect(res.id).toBe('comm-1')
      expect(res.body).toBe('Great progress!')
      expect(mockRealtime.server.to).toHaveBeenCalledWith('board:board-1')
      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: 'usr-2',
            type: 'COMMENT_ADDED',
            payload: {
              taskId: 'task-1',
              taskTitle: 'Task Alpha',
              commenterName: 'Alice',
              commentId: 'comm-1',
            },
          },
        ],
      })
    })

    it('should throw ForbiddenException if user is not in workspace', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        column: {
          board: { workspaceId: 'ws-1' },
        },
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.createComment('task-1', 'outsider', { body: 'Hello' })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('deleteComment', () => {
    it('should allow author to delete their own comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValueOnce({
        id: 'comm-1',
        userId: 'usr-1',
        task: {
          column: {
            board: { workspaceId: 'ws-1' },
          },
        },
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      const res = await service.deleteComment('comm-1', 'usr-1')
      expect(res).toEqual({ success: true })
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
      })
    })

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrisma.comment.findUnique.mockResolvedValueOnce(null)

      await expect(service.deleteComment('non-existent', 'usr-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })
})
