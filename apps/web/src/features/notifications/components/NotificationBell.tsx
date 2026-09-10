import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, CheckCheck, MessageSquare, Loader2 } from 'lucide-react'
import { NotificationSummary } from '@flowboard/shared-types'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notificationsApi'

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications()
      setNotifications(data)
    } catch (err) {
      console.error('Failed to load notifications', err)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    // Poll notifications every 30 seconds for background updates
    const timer = setInterval(loadNotifications, 30000)
    return () => clearInterval(timer)
  }, [loadNotifications])

  // Click outside to dismiss
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside)
    }
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !n.readAt).length

  const handleMarkAsRead = async (id: string) => {
    try {
      const updated = await markNotificationAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? updated : n))
      )
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const handleMarkAllRead = async () => {
    setIsLoading(true)
    try {
      await markAllNotificationsAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      )
    } catch (err) {
      console.error('Failed to mark all as read', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const mins = Math.floor(diffMs / 60000)
      if (mins < 1) return 'just now'
      if (mins < 60) return `${mins}m ago`
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return `${hrs}h ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) loadNotifications()
        }}
        className="relative p-2 rounded-button text-text-secondary hover:text-text-primary hover:bg-canvas transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-priority-high text-white text-[9px] font-bold font-mono flex items-center justify-center ring-2 ring-surface shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border-subtle rounded-card shadow-modal p-0 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-border-subtle flex items-center justify-between bg-surface-muted/40">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-primary font-mono uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-chip text-[10px] font-mono font-semibold bg-accent/10 text-accent">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3 h-3" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-border-subtle/50">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Bell className="w-6 h-6 text-text-secondary/40 mx-auto mb-2" />
                <p className="text-xs font-medium text-text-secondary">
                  No notifications yet
                </p>
                <p className="text-[11px] text-text-secondary/70 mt-0.5">
                  You will be notified when activity happens on your tasks
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.readAt
                const payload = notif.payload as {
                  taskTitle?: string
                  commenterName?: string
                }
                return (
                  <div
                    key={notif.id}
                    onClick={() => isUnread && handleMarkAsRead(notif.id)}
                    className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-2.5 hover:bg-canvas/60 ${
                      isUnread ? 'bg-accent/5 font-medium' : 'text-text-secondary'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-button bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-[11px] leading-snug">
                        <span className="font-semibold text-accent">
                          {payload.commenterName || 'Someone'}
                        </span>{' '}
                        commented on{' '}
                        <span className="font-semibold">
                          "{payload.taskTitle || 'a task'}"
                        </span>
                      </p>
                      <span className="text-[10px] font-mono text-text-secondary/70 mt-1 block">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
