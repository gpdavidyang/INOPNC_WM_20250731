'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { NotificationBell } from './notification-bell'
import { NotificationList } from './notification-list'
import { markAllNotificationsAsRead } from '@/app/actions/notifications'
import { toast } from 'sonner'
import { CheckCheck, Settings } from 'lucide-react'
import Link from 'next/link'

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true)
    try {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        toast.success(`${result.count}개의 알림을 읽음 처리했습니다.`)
        // Refresh notification list by closing and reopening
        setOpen(false)
        setTimeout(() => setOpen(true), 100)
      } else {
        toast.error(result.error || '알림 읽음 처리에 실패했습니다.')
      }
    } catch (error) {
      toast.error('알림 읽음 처리에 실패했습니다.')
    } finally {
      setMarkingAllRead(false)
    }
  }

  const handleNotificationClick = () => {
    // Close dropdown when a notification is clicked
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div>
          <NotificationBell />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[400px] p-0" align="end">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">알림</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="compact"
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                모두 읽음
              </Button>
              <Link href="/dashboard/settings/notifications">
                <Button
                  variant="ghost"
                  size="compact"
                  className="h-8 text-xs"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <NotificationList 
          className="h-[400px]" 
          onNotificationClick={handleNotificationClick}
        />
        
        <DropdownMenuSeparator />
        
        <div className="p-2">
          <Link href="/dashboard/notifications">
            <Button variant="outline" className="w-full text-sm">
              모든 알림 보기
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}