import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AttendanceCheck from '@/components/attendance/attendance-check'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function AttendancePage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, site:sites(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Check if user has a site assigned
  if (!profile.site_id || !profile.site) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-12 text-center">
          <h2 className="text-xl font-semibold mb-4">현장 배정 필요</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            출퇴근 체크를 위해서는 현장에 배정되어야 합니다.
            <br />
            관리자에게 문의하세요.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">출퇴근 관리</h1>
          <p className="text-gray-600 dark:text-gray-400">
            현재 현장: {profile.site.name}
          </p>
        </div>
        
        <Link href="/dashboard/attendance/calendar">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            월별 현황
          </Button>
        </Link>
      </div>

      <AttendanceCheck site={profile.site} />
    </div>
  )
}