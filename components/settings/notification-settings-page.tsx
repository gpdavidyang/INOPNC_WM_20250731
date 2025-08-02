'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useFontSize, getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Info,
  FileText,
  Users,
  Package,
  Save,
  Loader2
} from 'lucide-react'
import {
  getNotificationPreferences,
  updateNotificationPreference
} from '@/app/actions/notifications'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'
import type { UserNotificationPreference } from '@/types/notifications'

interface NotificationTypeConfig {
  type: string
  label: string
  description: string
  icon: React.ReactNode
}

const notificationTypes: NotificationTypeConfig[] = [
  {
    type: 'daily_report_submitted',
    label: '작업일지 제출',
    description: '새로운 작업일지가 제출되었을 때 알림',
    icon: <FileText className="w-5 h-5 text-blue-600" />
  },
  {
    type: 'daily_report_approved',
    label: '작업일지 승인',
    description: '작업일지가 승인되었을 때 알림',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />
  },
  {
    type: 'daily_report_rejected',
    label: '작업일지 반려',
    description: '작업일지가 반려되었을 때 알림',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />
  },
  {
    type: 'npc1000_low_stock',
    label: 'NPC-1000 재고 부족',
    description: '재고가 최소 수량 이하일 때 알림',
    icon: <Package className="w-5 h-5 text-orange-600" />
  },
  {
    type: 'worker_attendance',
    label: '작업자 출퇴근',
    description: '작업자가 출퇴근했을 때 알림',
    icon: <Users className="w-5 h-5 text-purple-600" />
  },
  {
    type: 'system_announcement',
    label: '시스템 공지',
    description: '중요한 시스템 공지사항 알림',
    icon: <Info className="w-5 h-5 text-gray-600" />
  }
]

export function NotificationSettingsPage() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [preferences, setPreferences] = useState<Record<string, UserNotificationPreference>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changedPreferences, setChangedPreferences] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const result = await getNotificationPreferences()
      if (result.success && result.data) {
        const prefsMap = result.data.reduce((acc: any, pref: any) => {
          acc[(pref as any).notification_type] = pref as any
          return acc
        }, {} as Record<string, UserNotificationPreference>)
        setPreferences(prefsMap)
      } else {
        showErrorNotification(result.error || '알림 설정을 불러오는데 실패했습니다', 'loadPreferences')
      }
    } catch (error) {
      showErrorNotification(error, 'loadPreferences')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (type: string, field: 'enabled' | 'email_enabled' | 'push_enabled', value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        notification_type: type,
        [field]: value
      }
    }))
    setChangedPreferences(prev => new Set(prev).add(type))
  }

  const handleSave = async () => {
    setSaving(true)
    const promises: Promise<any>[] = []

    changedPreferences.forEach(type => {
      const pref = preferences[type]
      if (pref) {
        promises.push(
          updateNotificationPreference(type, {
            enabled: pref.enabled ?? true,
            email_enabled: pref.email_enabled ?? false,
            push_enabled: pref.push_enabled ?? false
          })
        )
      }
    })

    try {
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length

      if (successCount === promises.length) {
        toast.success('알림 설정이 저장되었습니다.')
        setChangedPreferences(new Set())
      } else {
        toast.error('일부 설정 저장에 실패했습니다.')
      }
    } catch (error) {
      toast.error('알림 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getPreference = (type: string) => {
    return preferences[type] || {
      notification_type: type,
      enabled: true,
      email_enabled: false,
      push_enabled: false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-gray-900`}>알림 설정</h1>
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 mt-1`}>알림 수신 방법을 설정하세요</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || changedPreferences.size === 0}
            size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                설정 저장
              </>
            )}
          </Button>
        </div>

        {/* Global Settings */}
        <Card className={`bg-white border-0 shadow-sm ${
          touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
        }`}>
          <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold text-gray-900 mb-4`}>전체 알림 설정</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 flex-1`}>
                앱 내 알림
              </Label>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>항상 활성화</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 flex-1`}>
                이메일 알림
              </Label>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>각 알림 유형별로 설정</p>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 flex-1`}>
                푸시 알림
              </Label>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>현재 지원하지 않음</p>
            </div>
          </div>
        </Card>

        {/* Notification Types */}
        <Card className="bg-white border-0 shadow-sm">
          <div className={`${
            touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
          } border-b`}>
            <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold text-gray-900`}>알림 유형별 설정</h2>
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 mt-1`}>각 알림 유형에 대해 수신 방법을 설정할 수 있습니다</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {notificationTypes.map((notifType: any) => {
              const pref = getPreference(notifType.type)
              
              return (
                <div key={notifType.type} className={`${
                  touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {notifType.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 mb-1`}>
                        {notifType.label}
                      </h3>
                      <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 mb-4`}>
                        {notifType.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${notifType.type}-enabled`} className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                            알림 받기
                          </Label>
                          <Switch
                            id={`${notifType.type}-enabled`}
                            checked={pref.enabled}
                            onCheckedChange={(checked) => handleToggle(notifType.type, 'enabled', checked)}
                          />
                        </div>
                        
                        {pref.enabled && (
                          <>
                            <div className="flex items-center justify-between pl-4">
                              <Label htmlFor={`${notifType.type}-email`} className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                                이메일로 받기
                              </Label>
                              <Switch
                                id={`${notifType.type}-email`}
                                checked={pref.email_enabled}
                                onCheckedChange={(checked) => handleToggle(notifType.type, 'email_enabled', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between pl-4">
                              <Label htmlFor={`${notifType.type}-push`} className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                                푸시 알림으로 받기
                              </Label>
                              <Switch
                                id={`${notifType.type}-push`}
                                checked={pref.push_enabled}
                                onCheckedChange={(checked) => handleToggle(notifType.type, 'push_enabled', checked)}
                                disabled
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Info Card */}
        <Card className={`bg-blue-50 border-blue-200 ${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-blue-800`}>
              <p className="font-medium mb-1">알림 설정 안내</p>
              <ul className={`space-y-1 text-blue-700`}>
                <li>• 앱 내 알림은 항상 활성화되어 있습니다</li>
                <li>• 이메일 알림은 등록된 이메일 주소로 발송됩니다</li>
                <li>• 푸시 알림은 추후 지원 예정입니다</li>
                <li>• 중요한 시스템 공지는 설정과 관계없이 발송될 수 있습니다</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}