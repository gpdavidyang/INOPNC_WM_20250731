'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { NotificationExtended } from '@/types/notifications'

interface UseRealtimeNotificationsOptions {
  onNewNotification?: (notification: NotificationExtended) => void
  showToast?: boolean
}

export function useRealtimeNotifications({
  onNewNotification,
  showToast = true
}: UseRealtimeNotificationsOptions = {}) {
  const router = useRouter()
  const supabase = createClient()

  const handleNewNotification = useCallback((notification: NotificationExtended) => {
    // Call custom handler if provided
    if (onNewNotification) {
      onNewNotification(notification)
    }

    // Show toast notification if enabled
    if (showToast) {
      const toastOptions = {
        description: notification.message,
        duration: 5000,
        action: notification.action_url ? {
          label: '보기',
          onClick: () => {
            if (notification.action_url) {
              router.push(notification.action_url)
            }
          }
        } : undefined
      }

      switch (notification.type) {
        case 'success':
          toast.success(notification.title, toastOptions)
          break
        case 'error':
          toast.error(notification.title, toastOptions)
          break
        case 'warning':
          toast.warning(notification.title, toastOptions)
          break
        case 'system':
          toast.message(notification.title, toastOptions)
          break
        case 'approval':
          toast.info(notification.title, toastOptions)
          break
        default:
          toast(notification.title, toastOptions)
      }
    }

    // Refresh the page to update notification count
    router.refresh()
  }, [onNewNotification, showToast, router])

  useEffect(() => {
    // Get current user
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Subscribe to new notifications for the current user
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const notification = payload.new as NotificationExtended
            handleNewNotification(notification)
          }
        )
        .subscribe()

      // Cleanup subscription on unmount
      return () => {
        channel.unsubscribe()
      }
    }

    const unsubscribePromise = setupSubscription()

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe()
        }
      })
    }
  }, [supabase, handleNewNotification])
}