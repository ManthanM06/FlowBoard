import { api } from '../../../shared/lib/api'
import { ApiResponse, NotificationSummary } from '@flowboard/shared-types'

export const fetchNotifications = async (): Promise<NotificationSummary[]> => {
  const res = await api.get<ApiResponse<NotificationSummary[]>>('/notifications')
  return res.data.data ?? []
}

export const markNotificationAsRead = async (
  notificationId: string
): Promise<NotificationSummary> => {
  const res = await api.patch<ApiResponse<NotificationSummary>>(
    `/notifications/${notificationId}/read`
  )
  if (!res.data.data) throw new Error('Failed to mark notification as read')
  return res.data.data
}

export const markAllNotificationsAsRead = async (): Promise<{ count: number }> => {
  const res = await api.patch<ApiResponse<{ count: number }>>('/notifications/read-all')
  return res.data.data ?? { count: 0 }
}
