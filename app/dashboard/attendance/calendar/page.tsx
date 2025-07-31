import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getMonthlyAttendance } from '@/app/actions/attendance'
import { AttendanceCalendar } from '@/components/attendance/attendance-calendar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function AttendanceCalendarPage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile with site info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, site:sites(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Check if user has a site assigned  
  // TODO: Fix site property access when site relationship is properly set up
  if (!profile.site || (Array.isArray(profile.site) && profile.site.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold mb-4">현장 배정 필요</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            출퇴근 현황을 확인하려면 현장에 배정되어야 합니다.
            <br />
            관리자에게 문의하세요.
          </p>
          <Link href="/dashboard/attendance">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Get current month attendance data
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  const attendanceResult = await getMonthlyAttendance(year, month)
  const monthlyData = attendanceResult.success ? attendanceResult.data : []

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/attendance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">월별 출퇴근 현황</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {Array.isArray(profile.site) && profile.site.length > 0 ? profile.site[0].name : '현장 정보 없음'} - {profile.full_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            상세 내역
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            다운로드
          </Button>
        </div>
      </div>

      <AttendanceCalendar 
        profile={profile}
        isPartnerView={false}
      />
    </div>
  )
}