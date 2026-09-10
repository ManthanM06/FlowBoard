import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { PrismaService } from '../prisma/prisma.service'
import { TaskPriority, WorkspaceRole } from '@flowboard/shared-types'

describe('TasksService', () => {
  let service: TasksService

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
    column: {
      findUnique: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    taskAssignee: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<TasksService>(TasksService)
    jest.clearAllMocks()
  })

  describe('createTask', () => {
    it('should create a task with calculated order and assignees', async () => {
      const now = new Date()

      mockPrisma.column.findUnique.mockResolvedValueOnce({
        id: 'col-1',
        name: 'To Do',
        board: { workspaceId: 'ws-1' },
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      mockPrisma.task.findFirst.mockResolvedValueOnce({
        id: 'prev-task',
        order: 2000,
      })

      mockPrisma.task.create.mockResolvedValueOnce({
        id: 'task-1',
        columnId: 'col-1',
        title: 'New Feature',
        description: 'Details',
        priority: TaskPriority.HIGH,
        dueDate: now,
        order: 3000,
      })

      mockPrisma.taskAssignee.createMany.mockResolvedValueOnce({ count: 1 })

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        columnId: 'col-1',
        title: 'New Feature',
        description: 'Details',
        priority: TaskPriority.HIGH,
        dueDate: now,
        order: 3000,
        createdAt: now,
        updatedAt: now,
        assignees: [
          {
            user: {
              id: 'usr-1',
              email: 'alice@flowboard.dev',
              name: 'Alice',
              avatarUrl: null,
            },
          },
        ],
      })

      const res = await service.createTask('col-1', 'usr-1', {
        title: 'New Feature',
        description: 'Details',
        priority: TaskPriority.HIGH,
        dueDate: now.toISOString(),
        assigneeIds: ['usr-1'],
      })

      expect(res.id).toBe('task-1')
      expect(res.priority).toBe(TaskPriority.HIGH)
      expect(res.assignees).toHaveLength(1)
      expect(res.order).toBe(3000)
    })

    it('should throw ForbiddenException if user is not in the workspace', async () => {
      mockPrisma.column.findUnique.mockResolvedValueOnce({
        id: 'col-1',
        board: { workspaceId: 'ws-1' },
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.createTask('col-1', 'outsider', { title: 'Unauthorized' })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('findById', () => {
    it('should return task with mapped assignees', async () => {
      const now = new Date()

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        columnId: 'col-1',
        title: 'Task A',
        description: null,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
        order: 1000,
        createdAt: now,
        updatedAt: now,
        column: {
          board: { workspaceId: 'ws-1' },
        },
        assignees: [],
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      const res = await service.findById('task-1', 'usr-1')
      expect(res.id).toBe('task-1')
      expect(res.title).toBe('Task A')
    })

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce(null)

      await expect(service.findById('non-existent', 'usr-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('updateTask', () => {
    it('should update task details and sync assignees', async () => {
      const now = new Date()

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        columnId: 'col-1',
        column: { board: { workspaceId: 'ws-1' } },
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      mockPrisma.task.update.mockResolvedValueOnce({})
      mockPrisma.taskAssignee.deleteMany.mockResolvedValueOnce({ count: 0 })
      mockPrisma.taskAssignee.createMany.mockResolvedValueOnce({ count: 1 })

      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        columnId: 'col-1',
        title: 'Updated Title',
        description: 'New Desc',
        priority: TaskPriority.LOW,
        dueDate: null,
        order: 1000,
        createdAt: now,
        updatedAt: now,
        assignees: [
          {
            user: {
              id: 'usr-2',
              email: 'bob@flowboard.dev',
              name: 'Bob',
              avatarUrl: null,
            },
          },
        ],
      })

      const res = await service.updateTask('task-1', 'usr-1', {
        title: 'Updated Title',
        priority: TaskPriority.LOW,
        assigneeIds: ['usr-2'],
      })

      expect(res.title).toBe('Updated Title')
      expect(res.priority).toBe(TaskPriority.LOW)
      expect(res.assignees).toHaveLength(1)
      expect(res.assignees?.[0].name).toBe('Bob')
    })
  })

  describe('moveTask', () => {
    it('should move task to target column and calculate fractional order', async () => {
      const now = new Date()

      mockPrisma.task.findUnique
        .mockResolvedValueOnce({
          id: 'task-1',
          columnId: 'col-1',
          column: { board: { workspaceId: 'ws-1' } },
        }) // initial existing task
        .mockResolvedValueOnce({ id: 'prev-1', order: 1000 }) // previous task
        .mockResolvedValueOnce({ id: 'next-1', order: 2000 }) // next task

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
      })

      mockPrisma.column.findUnique.mockResolvedValueOnce({
        id: 'col-2',
        board: { workspaceId: 'ws-1' },
      })

      mockPrisma.task.update.mockResolvedValueOnce({
        id: 'task-1',
        columnId: 'col-2',
        title: 'Task A',
        description: null,
        priority: TaskPriority.MEDIUM,
        dueDate: null,
        order: 1500,
        createdAt: now,
        updatedAt: now,
        assignees: [],
      })

      const res = await service.moveTask('task-1', 'usr-1', {
        targetColumnId: 'col-2',
        previousTaskId: 'prev-1',
        nextTaskId: 'next-1',
      })

      expect(res.columnId).toBe('col-2')
      expect(res.order).toBe(1500)
      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          columnId: 'col-2',
          order: 1500,
        },
        include: expect.any(Object),
      })
    })

    it('should throw ForbiddenException if target column is in another workspace', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        columnId: 'col-1',
        column: { board: { workspaceId: 'ws-1' } },
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
      })

      mockPrisma.column.findUnique.mockResolvedValueOnce({
        id: 'col-other',
        board: { workspaceId: 'ws-foreign' },
      })

      await expect(
        service.moveTask('task-1', 'usr-1', { targetColumnId: 'col-other' })
      ).rejects.toThrow(ForbiddenException)
    })
  })

  describe('deleteTask', () => {
    it('should allow workspace member to delete task', async () => {
      mockPrisma.task.findUnique.mockResolvedValueOnce({
        id: 'task-1',
        column: { board: { workspaceId: 'ws-1' } },
      })

      mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
        userId: 'usr-1',
        workspaceId: 'ws-1',
        role: WorkspaceRole.MEMBER,
      })

      mockPrisma.task.delete.mockResolvedValueOnce({ id: 'task-1' })

      const res = await service.deleteTask('task-1', 'usr-1')
      expect(res).toEqual({ success: true })
      expect(mockPrisma.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      })
    })
  })
})
