'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-new'
import {
  Bell,
  Filter,
  Search,
  CheckCheck,
  Trash2,
  RefreshCw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  BellOff,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { NotificationExtended, NotificationType, NotificationFilter } from '@/types/notifications'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '@/app/actions/notifications'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

export function NotificationsPage() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [notifications, setNotifications] = useState<NotificationExtended[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [readFilter, setReadFilter] = useState<string>('all')
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [typeFilter, readFilter])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const filter: NotificationFilter = {}
      
      if (typeFilter !== 'all') {
        filter.type = typeFilter as NotificationType
      }
      
      if (readFilter !== 'all') {
        filter.read = readFilter === 'read'
      }

      const result = await getNotifications(filter)
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

  const handleDelete = async (notificationId: string) => {
    try {
      const result = await deleteNotification(notificationId)
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setSelectedNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notificationId)
          return newSet
        })
        toast.success('알림이 삭제되었습니다.')
      } else {
        showErrorNotification(result.error || '알림 삭제에 실패했습니다', 'deleteNotification')
      }
    } catch (error) {
      showErrorNotification(error, 'deleteNotification')
    }
  }

  const handleMarkAllRead = async () => {
    setBulkActionLoading(true)
    try {
      const result = await markAllNotificationsAsRead()
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        )
        toast.success(`${result.count}개의 알림을 읽음 처리했습니다.`)
      } else {
        toast.error(result.error || '알림 읽음 처리에 실패했습니다.')
      }
    } catch (error) {
      toast.error('알림 읽음 처리에 실패했습니다.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) return

    setBulkActionLoading(true)
    const promises = Array.from(selectedNotifications).map(id => deleteNotification(id))
    
    try {
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount > 0) {
        setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)))
        setSelectedNotifications(new Set())
        toast.success(`${successCount}개의 알림이 삭제되었습니다.`)
      }
      
      if (successCount < selectedNotifications.size) {
        toast.error(`일부 알림 삭제에 실패했습니다.`)
      }
    } catch (error) {
      toast.error('알림 삭제에 실패했습니다.')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
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

  const getTypeBadge = (type: NotificationType) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      system: 'bg-purple-100 text-purple-800',
      approval: 'bg-blue-100 text-blue-800',
      info: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      success: '성공',
      warning: '경고',
      error: '오류',
      system: '시스템',
      approval: '승인',
      info: '정보'
    }

    return (
      <Badge className={cn('px-2 py-0.5 text-xs', variants[type])}>
        {labels[type]}
      </Badge>
    )
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Action Button for PageLayout */}
      <div className="hidden" id="page-action">
        <Button
          variant="outline"
          size="compact"
          onClick={loadNotifications}
          disabled={loading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          새로고침
        </Button>
      </div>

        {/* Compact Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="space-y-3">
            {/* Compact Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="알림 제목 또는 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 text-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            
            {/* Compact Filter Grid */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl text-sm">
                  <SelectValue placeholder="알림 유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 유형</SelectItem>
                  <SelectItem value="info">정보</SelectItem>
                  <SelectItem value="success">성공</SelectItem>
                  <SelectItem value="warning">경고</SelectItem>
                  <SelectItem value="error">오류</SelectItem>
                  <SelectItem value="approval">승인</SelectItem>
                  <SelectItem value="system">시스템</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className={`${
                  touchMode === 'glove' ? 'h-14' : touchMode === 'precision' ? 'h-8' : 'h-10'
                } bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>
                  <SelectValue placeholder="읽음 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="unread">읽지 않음</SelectItem>
                  <SelectItem value="read">읽음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Compact Bulk Actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedNotifications.size > 0 ? `${selectedNotifications.size}개 선택` : '전체 선택'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="compact"
                  onClick={handleMarkAllRead}
                  disabled={bulkActionLoading}
                  className="h-8 px-3 text-xs rounded-lg dark:border-gray-600 dark:text-gray-300"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  모두 읽음
                </Button>
                {selectedNotifications.size > 0 && (
                  <Button
                    variant="outline"
                    size="compact"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                    className="h-8 px-3 text-xs rounded-lg text-red-600 hover:text-red-700 dark:border-gray-600"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    삭제
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* High-Density Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">알림을 불러오는 중...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-gray-400">
              <BellOff className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium">알림이 없습니다</p>
              <p className="text-xs mt-1">새로운 알림이 도착하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer",
                    !notification.read && "bg-blue-50/30 dark:bg-blue-950/30"
                  )}
                  onClick={() => handleMarkAsRead(notification)}
                >
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleNotificationSelection(notification.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={cn(
                            "text-sm font-medium truncate",
                            notification.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100"
                          )}>
                            {notification.title}
                          </h3>
                          {getTypeBadge(notification.type)}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs line-clamp-2",
                          notification.read ? "text-gray-500 dark:text-gray-400" : "text-gray-600 dark:text-gray-300"
                        )}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ko
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="compact"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(notification.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  )
}