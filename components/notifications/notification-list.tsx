'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
  ExternalLink,
  Loader2,
  BellOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { NotificationExtended, NotificationType } from '@/types/notifications'
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification
} from '@/app/actions/notifications'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface NotificationListProps {
  className?: string
  onNotificationClick?: (notification: NotificationExtended) => void
}

export function NotificationList({ className, onNotificationClick }: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const result = await getNotifications({ limit: 50 })
      if (result.success && result.data) {
        setNotifications(result.data)
      } else {
        showErrorNotification(result.error || '알림을 불러오는데 실패했습니다', 'loadNotifications')
      }
    } catch (error) {
      showErrorNotification(error, 'loadNotifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notification: NotificationExtended) => {
    if (notification.read) return

    try {
      const result = await markNotificationAsRead(notification.id)
      if (result.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true, read_at: new Date().toISOString() } : n
          )
        )
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    setDeletingId(notificationId)

    try {
      const result = await deleteNotification(notificationId)
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        toast.success('알림이 삭제되었습니다.')
      } else {
        showErrorNotification(result.error || '알림 삭제에 실패했습니다', 'deleteNotification')
      }
    } catch (error) {
      showErrorNotification(error, 'deleteNotification')
    } finally {
      setDeletingId(null)
    }
  }

  const handleNotificationClick = (notification: NotificationExtended) => {
    handleMarkAsRead(notification)
    
    if (onNotificationClick) {
      onNotificationClick(notification)
    } else if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'system':
        return <Info className="h-5 w-5 text-purple-600" />
      case 'approval':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationBgColor = (type: NotificationType, read: boolean) => {
    if (read) return 'bg-white'
    
    switch (type) {
      case 'success':
        return 'bg-green-50'
      case 'warning':
        return 'bg-yellow-50'
      case 'error':
        return 'bg-red-50'
      case 'system':
        return 'bg-purple-50'
      case 'approval':
        return 'bg-blue-50'
      default:
        return 'bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <BellOff className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-sm">알림이 없습니다</p>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("h-[400px]", className)}>
      <div className="space-y-1 p-2">
        {notifications.map((notification: any) => (
          <div
            key={notification.id}
            className={cn(
              "relative group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all",
              "hover:shadow-sm border",
              getNotificationBgColor(notification.type, notification.read),
              notification.read ? "border-gray-100" : "border-gray-200"
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className={cn(
                    "text-sm font-medium",
                    notification.read ? "text-gray-700" : "text-gray-900"
                  )}>
                    {notification.title}
                  </h4>
                  <p className={cn(
                    "text-sm mt-1",
                    notification.read ? "text-gray-500" : "text-gray-600"
                  )}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ko
                      })}
                    </span>
                    {notification.action_url && (
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="compact"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(e, notification.id)}
                  disabled={deletingId === notification.id}
                >
                  {deletingId === notification.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {!notification.read && (
              <div className="absolute top-3 right-3 h-2 w-2 bg-blue-600 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}