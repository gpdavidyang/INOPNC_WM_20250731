'use client'

import { useEffect, useState } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Users, FileText, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageSection } from '@/components/dashboard/page-layout'
import { Card } from '@/components/ui/card'

interface HomeTabProps {
  profile: Profile
}

interface Stats {
  todayReports: number
  pendingApprovals: number
  activeWorkers: number
  notifications: number
}

export default function HomeTab({ profile }: HomeTabProps) {
  const [stats, setStats] = useState<Stats>({
    todayReports: 0,
    pendingApprovals: 0,
    activeWorkers: 0,
    notifications: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // 오늘의 작업일지 수
      const today = new Date().toISOString().split('T')[0]
      const { count: todayReports, error: todayError } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('report_date', today)

      if (todayError) {
        console.error('Today reports error:', todayError)
      }

      // 승인 대기 건수  
      const { count: pendingApprovals, error: pendingError } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')

      if (pendingError) {
        console.error('Pending approvals error:', pendingError)
      }

      // 활동 중인 작업자 수
      const { count: activeWorkers, error: workersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'worker')

      if (workersError) {
        console.error('Active workers error:', workersError)
      }

      // 읽지 않은 알림 - 테이블이 없을 수 있으므로 기본값 처리
      let notifications = 0
      try {
        const { count: notificationCount, error: notificationsError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_read', false)

        if (!notificationsError) {
          notifications = notificationCount || 0
        }
      } catch (notifError) {
        console.warn('Notifications table not available:', notifError)
        notifications = 0
      }

      setStats({
        todayReports: todayReports || 0,
        pendingApprovals: pendingApprovals || 0,
        activeWorkers: activeWorkers || 0,
        notifications: notifications
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // 오류 발생 시 기본값 설정
      setStats({
        todayReports: 0,
        pendingApprovals: 0,
        activeWorkers: 0,
        notifications: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      worker: '작업자',
      site_manager: '현장관리자',
      customer_manager: '파트너사',
      admin: '관리자',
      system_admin: '시스템관리자'
    }
    return roleMap[role] || role
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <PageSection>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            안녕하세요, {profile.full_name}님
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {getRoleDisplay(profile.role)}로 로그인하셨습니다.
          </p>
        </div>
      </PageSection>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  오늘의 작업일지
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.todayReports}
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  승인 대기
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.pendingApprovals}
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  활성 작업자
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.activeWorkers}
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-600 truncate">
                  알림
                </dt>
                <dd className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats.notifications}
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <PageSection
        title="빠른 작업"
        description="자주 사용하는 기능에 빠르게 접근하세요"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(profile.role === 'worker' || profile.role === 'site_manager') && (
            <button 
              onClick={() => router.push('/dashboard/daily-reports/new')}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              작업일지 작성
            </button>
          )}
          {(profile.role === 'site_manager' || profile.role === 'admin') && (
            <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              승인 관리
            </button>
          )}
          <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            문서 업로드
          </button>
        </div>
      </PageSection>

      {/* Recent activities */}
      <PageSection
        title="최근 활동"
        description="시스템에서 발생한 최근 활동을 확인하세요"
      >
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium text-gray-900">김철수</span>
            <span className="mx-2">•</span>
            <span>작업일지를 제출했습니다</span>
            <span className="ml-auto">10분 전</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium text-gray-900">박현장</span>
            <span className="mx-2">•</span>
            <span>작업일지를 승인했습니다</span>
            <span className="ml-auto">30분 전</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium text-gray-900">이파트너</span>
            <span className="mx-2">•</span>
            <span>문서를 업로드했습니다</span>
            <span className="ml-auto">1시간 전</span>
          </div>
        </div>
      </PageSection>
    </div>
  )
}