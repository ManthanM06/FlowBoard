import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationSummary } from '@flowboard/shared-types'

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(userId: string): Promise<NotificationSummary[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      payload: n.payload as Record<string, unknown>,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
    }))
  }

  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<NotificationSummary> {
    const existing = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Notification not found')
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    })

    return {
      id: updated.id,
      userId: updated.userId,
      type: updated.type,
      payload: updated.payload as Record<string, unknown>,
      readAt: updated.readAt ? updated.readAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    }
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const res = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })

    return { count: res.count }
  }
}
