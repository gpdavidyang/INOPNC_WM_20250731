import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AttendanceCalendar } from '@/components/attendance/attendance-calendar'
import { SalaryInfo } from '@/components/attendance/salary-info'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function AttendancePage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile with organization and site info
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations(*),
      site:sites(*)
    `)
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  const isPartnerCompany = profile.role === 'customer_manager'

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">출력현황</h1>
        <p className="mt-1 text-sm text-gray-600">
          {isPartnerCompany 
            ? '소속 회사 작업자들의 출력 현황을 확인합니다'
            : '나의 출력 및 급여 정보를 확인합니다'
          }
        </p>
      </div>

      <div className="p-6">
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attendance">출력 정보</TabsTrigger>
            <TabsTrigger value="salary">급여 정보</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <AttendanceCalendar 
                profile={profile}
                isPartnerView={isPartnerCompany}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <SalaryInfo 
                profile={profile}
                isPartnerView={isPartnerCompany}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}