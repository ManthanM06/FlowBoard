import { Test, TestingModule } from '@nestjs/testing'
import { NotificationsService } from './notifications.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

describe('NotificationsService', () => {
  let service: NotificationsService

  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<NotificationsService>(NotificationsService)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getUserNotifications', () => {
    it('should return mapped notifications', async () => {
      const now = new Date()

      mockPrisma.notification.findMany.mockResolvedValueOnce([
        {
          id: 'notif-1',
          userId: 'usr-1',
          type: 'COMMENT_ADDED',
          payload: { taskId: 't-1' },
          readAt: null,
          createdAt: now,
        },
      ])

      const res = await service.getUserNotifications('usr-1')

      expect(res).toHaveLength(1)
      expect(res[0].id).toBe('notif-1')
      expect(res[0].readAt).toBeNull()
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const now = new Date()

      mockPrisma.notification.findUnique.mockResolvedValueOnce({
        id: 'notif-1',
        userId: 'usr-1',
      })

      mockPrisma.notification.update.mockResolvedValueOnce({
        id: 'notif-1',
        userId: 'usr-1',
        type: 'COMMENT_ADDED',
        payload: {},
        readAt: now,
        createdAt: now,
      })

      const res = await service.markAsRead('notif-1', 'usr-1')

      expect(res.readAt).toBe(now.toISOString())
    })

    it('should throw NotFoundException if notification does not exist or belongs to someone else', async () => {
      mockPrisma.notification.findUnique.mockResolvedValueOnce(null)

      await expect(service.markAsRead('notif-x', 'usr-1')).rejects.toThrow(
        NotFoundException
      )
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 5 })

      const res = await service.markAllAsRead('usr-1')

      expect(res.count).toBe(5)
    })
  })
})
