'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getNotificationStats } from '@/app/actions/notifications'
import { cn } from '@/lib/utils'
import { useAuthContext } from '@/providers/auth-provider'

interface NotificationBellProps {
  onClick?: () => void
  className?: string
}

export function NotificationBell({ onClick, className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuthContext()

  useEffect(() => {
    // Only load notifications if user is authenticated and not loading
    if (!authLoading && user) {
      // Add a small delay to ensure auth is fully established
      const timeoutId = setTimeout(() => {
        loadNotificationStats()
      }, 100)
      
      // 30초마다 알림 수 갱신
      const interval = setInterval(loadNotificationStats, 30000)
      
      return () => {
        clearTimeout(timeoutId)
        clearInterval(interval)
      }
    } else if (!authLoading && !user) {
      // User is not authenticated, set loading to false
      setLoading(false)
      setUnreadCount(0)
    }
  }, [user, authLoading])

  const loadNotificationStats = async () => {
    // Double-check user is still authenticated before making the call
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      const result = await getNotificationStats()
      if (result.success && result.data) {
        setUnreadCount(result.data.unread)
      } else {
        // Handle authentication errors gracefully
        if (result.error?.includes('로그인이 필요합니다')) {
          setUnreadCount(0)
        }
      }
    } catch (error) {
      console.error('Failed to load notification stats:', error)
      // Don't show error notifications for auth-related failures
      if (!(error as any).toString().includes('Authentication') && !(error as any).toString().includes('로그인')) {
        console.error('Unexpected notification stats error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="compact"
      className={cn("relative", className)}
      onClick={onClick}
      disabled={loading}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge 
          variant="error" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  )
}