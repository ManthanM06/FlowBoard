import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { BoardsService } from './boards.service'
import { PrismaService } from '../prisma/prisma.service'
import { WorkspaceRole } from '@flowboard/shared-types'

describe('BoardsService', () => {
  let service: BoardsService

  const mockPrisma = {
    $transaction: jest.fn().mockImplementation((cb) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma)
      }
      return Promise.all(cb)
    }),
    workspaceMember: {
      findUnique: jest.fn(),
    },
    board: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    column: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<BoardsService>(BoardsService)
    jest.clearAllMocks()
  })

  describe('createBoard', () => {
    it('should create board and seed default columns if user is ADMIN', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.ADMIN,
      })

      const now = new Date()
      mockPrisma.board.create.mockResolvedValueOnce({
        id: 'b-1',
        name: 'Sprint Board',
        workspaceId: 'ws-1',
        createdAt: now,
        updatedAt: now,
      })

      mockPrisma.column.create
        .mockResolvedValueOnce({
          id: 'c-1',
          boardId: 'b-1',
          name: 'To Do',
          order: 1000,
          createdAt: now,
          updatedAt: now,
        })
        .mockResolvedValueOnce({
          id: 'c-2',
          boardId: 'b-1',
          name: 'In Progress',
          order: 2000,
          createdAt: now,
          updatedAt: now,
        })
        .mockResolvedValueOnce({
          id: 'c-3',
          boardId: 'b-1',
          name: 'Done',
          order: 3000,
          createdAt: now,
          updatedAt: now,
        })

      const res = await service.createBoard('ws-1', 'usr-1', {
        name: 'Sprint Board',
      })

      expect(res.name).toBe('Sprint Board')
      expect(res.columns).toHaveLength(3)
      expect(res.columns[0].name).toBe('To Do')
      expect(res.columns[1].name).toBe('In Progress')
      expect(res.columns[2].name).toBe('Done')
    })

    it('should throw ForbiddenException if user is only MEMBER', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-2',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      await expect(
        service.createBoard('ws-1', 'usr-2', { name: 'Unauthorized Board' })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('findAllByWorkspace', () => {
    it('should return all boards for a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      const now = new Date()
      mockPrisma.board.findMany.mockResolvedValueOnce([
        {
          id: 'b-1',
          name: 'Board Alpha',
          workspaceId: 'ws-1',
          createdAt: now,
          updatedAt: now,
        },
      ])

      const res = await service.findAllByWorkspace('ws-1', 'usr-1')
      expect(res).toHaveLength(1)
      expect(res[0].name).toBe('Board Alpha')
    })

    it('should throw ForbiddenException if requester is not a member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null)

      await expect(service.findAllByWorkspace('ws-1', 'usr-out')).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('findById', () => {
    it('should return board details with sorted columns', async () => {
      const now = new Date()
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        name: 'Board Alpha',
        workspaceId: 'ws-1',
        createdAt: now,
        updatedAt: now,
        columns: [
          {
            id: 'c-1',
            boardId: 'b-1',
            name: 'To Do',
            order: 1000,
            createdAt: now,
            updatedAt: now,
          },
        ],
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      const res = await service.findById('b-1', 'usr-1')
      expect(res.id).toBe('b-1')
      expect(res.columns).toHaveLength(1)
    })

    it('should throw NotFoundException if board does not exist', async () => {
      mockPrisma.board.findUnique.mockResolvedValueOnce(null)

      await expect(service.findById('non-existent', 'usr-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('deleteBoard', () => {
    it('should allow ADMIN to delete board', async () => {
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        workspaceId: 'ws-1',
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.ADMIN,
      })

      mockPrisma.board.delete.mockResolvedValueOnce({ id: 'b-1' })

      const res = await service.deleteBoard('b-1', 'usr-1')
      expect(res).toEqual({ success: true })
      expect(mockPrisma.board.delete).toHaveBeenCalledWith({
        where: { id: 'b-1' },
      })
    })

    it('should reject MEMBER from deleting board', async () => {
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        workspaceId: 'ws-1',
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-2',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      await expect(service.deleteBoard('b-1', 'usr-2')).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('createColumn & deleteColumn', () => {
    it('should calculate next order when adding a column', async () => {
      const now = new Date()
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        workspaceId: 'ws-1',
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.ADMIN,
      })

      mockPrisma.column.findFirst.mockResolvedValueOnce({
        id: 'c-last',
        order: 3000,
      })

      mockPrisma.column.create.mockResolvedValueOnce({
        id: 'c-4',
        boardId: 'b-1',
        name: 'QA Testing',
        order: 4000,
        createdAt: now,
        updatedAt: now,
      })

      const res = await service.createColumn('b-1', 'usr-1', {
        name: 'QA Testing',
      })

      expect(res.name).toBe('QA Testing')
      expect(res.order).toBe(4000)
    })

    it('should allow ADMIN to delete a column', async () => {
      mockPrisma.column.findUnique.mockResolvedValueOnce({
        id: 'c-1',
        board: { workspaceId: 'ws-1' },
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.ADMIN,
      })

      mockPrisma.column.delete.mockResolvedValueOnce({ id: 'c-1' })

      const res = await service.deleteColumn('c-1', 'usr-1')
      expect(res).toEqual({ success: true })
    })
  })

  describe('reorderColumns', () => {
    it('should update column order sequence transactionally', async () => {
      const now = new Date()
      mockPrisma.board.findUnique.mockResolvedValueOnce({
        id: 'b-1',
        workspaceId: 'ws-1',
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.ADMIN,
      })

      mockPrisma.column.update.mockResolvedValue({})
      mockPrisma.column.findMany.mockResolvedValueOnce([
        {
          id: 'c-2',
          boardId: 'b-1',
          name: 'In Progress',
          order: 1000,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'c-1',
          boardId: 'b-1',
          name: 'To Do',
          order: 2000,
          createdAt: now,
          updatedAt: now,
        },
      ])

      const res = await service.reorderColumns('b-1', 'usr-1', ['c-2', 'c-1'])
      expect(res).toHaveLength(2)
      expect(res[0].id).toBe('c-2')
      expect(res[0].order).toBe(1000)
    })
  })
})
