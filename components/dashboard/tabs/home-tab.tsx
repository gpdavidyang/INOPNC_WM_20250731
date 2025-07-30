'use client'

import { useEffect, useState } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Users, FileText, AlertCircle } from 'lucide-react'

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

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // 오늘의 작업일지 수
      const today = new Date().toISOString().split('T')[0]
      const { count: todayReports } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('work_date', today)

      // 승인 대기 건수
      const { count: pendingApprovals } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted')

      // 활동 중인 작업자 수
      const { count: activeWorkers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'worker')
        .eq('status', 'active')

      // 읽지 않은 알림
      const { count: notifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)

      setStats({
        todayReports: todayReports || 0,
        pendingApprovals: pendingApprovals || 0,
        activeWorkers: activeWorkers || 0,
        notifications: notifications || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
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
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            안녕하세요, {profile.full_name}님
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {getRoleDisplay(profile.role)}로 로그인하셨습니다.
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    오늘의 작업일지
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.todayReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    승인 대기
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.pendingApprovals}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    활성 작업자
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.activeWorkers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    알림
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? '...' : stats.notifications}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            빠른 작업
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(profile.role === 'worker' || profile.role === 'site_manager') && (
              <button className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
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
        </div>
      </div>

      {/* Recent activities */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            최근 활동
          </h3>
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
        </div>
      </div>
    </div>
  )
}