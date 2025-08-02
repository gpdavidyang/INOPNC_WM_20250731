'use client'

import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import DashboardLayout from './dashboard-layout'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

interface DashboardWithNotificationsProps {
  user: User
  profile: Profile
}

export default function DashboardWithNotifications({ user, profile }: DashboardWithNotificationsProps) {
  // Enable real-time notifications with toast
  useRealtimeNotifications({
    showToast: true,
    onNewNotification: (notification) => {
      // Additional custom handling if needed
      console.log('New notification received:', notification)
    }
  })

  return <DashboardLayout user={user} profile={profile} />
}