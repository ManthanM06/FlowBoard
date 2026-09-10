import { Test, TestingModule } from '@nestjs/testing'
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { WorkspacesService } from './workspaces.service'
import { PrismaService } from '../prisma/prisma.service'
import { WorkspaceRole } from '@flowboard/shared-types'

describe('WorkspacesService', () => {
  let service: WorkspacesService

  const mockPrisma = {
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrisma)),
    workspace: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<WorkspacesService>(WorkspacesService)
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('should create workspace and assign creator as ADMIN member', async () => {
      mockPrisma.workspace.create.mockResolvedValueOnce({
        id: 'ws-1',
        name: 'Design Team',
        ownerId: 'usr-1',
        inviteCode: 'inv-code-123',
        createdAt: new Date(),
      })

      mockPrisma.workspaceMember.create.mockResolvedValueOnce({
        id: 'wm-1',
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.ADMIN,
        joinedAt: new Date(),
        user: { id: 'usr-1', email: 'u1@flowboard.dev', name: 'User One', avatarUrl: null },
      })

      const result = await service.create('usr-1', { name: 'Design Team' })
      expect(result.id).toBe('ws-1')
      expect(result.role).toBe(WorkspaceRole.ADMIN)
      expect(result.members).toHaveLength(1)
      expect(result.members[0].role).toBe(WorkspaceRole.ADMIN)
    })
  })

  describe('joinByInviteCode', () => {
    it('should throw NotFoundException when invite code is invalid', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.joinByInviteCode('usr-2', 'non-existent-code')
      ).rejects.toThrow(NotFoundException)
    })

    it('should enroll user as MEMBER when invite code is valid', async () => {
      mockPrisma.workspace.findUnique
        .mockResolvedValueOnce({
          id: 'ws-1',
          name: 'Core Team',
          ownerId: 'usr-1',
          inviteCode: 'valid-code',
          createdAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'ws-1',
          name: 'Core Team',
          ownerId: 'usr-1',
          inviteCode: 'valid-code',
          createdAt: new Date(),
          members: [
            {
              id: 'wm-1',
              userId: 'usr-1',
              workspaceId: 'ws-1',
              role: WorkspaceRole.ADMIN,
              joinedAt: new Date(),
              user: { id: 'usr-1', email: 'u1@flowboard.dev', name: 'User 1' },
            },
            {
              id: 'wm-2',
              userId: 'usr-2',
              workspaceId: 'ws-1',
              role: WorkspaceRole.MEMBER,
              joinedAt: new Date(),
              user: { id: 'usr-2', email: 'u2@flowboard.dev', name: 'User 2' },
            },
          ],
        })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null)
      mockPrisma.workspaceMember.create.mockResolvedValueOnce({})

      const result = await service.joinByInviteCode('usr-2', 'valid-code')
      expect(result.id).toBe('ws-1')
      expect(result.role).toBe(WorkspaceRole.MEMBER)
    })
  })

  describe('delete', () => {
    it('should throw ForbiddenException if requester is not the workspace owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValueOnce({
        id: 'ws-1',
        ownerId: 'usr-1',
      })

      await expect(service.delete('ws-1', 'usr-2')).rejects.toThrow(
        ForbiddenException
      )
    })

    it('should successfully delete workspace when requester is the owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValueOnce({
        id: 'ws-1',
        ownerId: 'usr-1',
      })
      mockPrisma.workspace.delete.mockResolvedValueOnce({})

      const res = await service.delete('ws-1', 'usr-1')
      expect(res.success).toBe(true)
      expect(mockPrisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
      })
    })
  })

  describe('updateMemberRole', () => {
    it('should throw BadRequestException if attempting to demote the owner', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValueOnce({
        id: 'ws-1',
        ownerId: 'usr-1',
      })

      await expect(
        service.updateMemberRole('ws-1', 'usr-1', WorkspaceRole.MEMBER)
      ).rejects.toThrow(BadRequestException)
    })
  })
})
