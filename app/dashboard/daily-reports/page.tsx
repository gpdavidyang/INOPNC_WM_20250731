import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyReportListEnhanced } from '@/components/daily-reports/DailyReportListEnhanced'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLayout, PageContainer, LoadingState } from '@/components/dashboard/page-layout'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function DailyReportsContent() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Get sites - simplified since organization relationships aren't set up
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  // Get initial reports
  const { data: reports } = await supabase
    .from('daily_reports')
    .select(`
      *,
      sites!daily_reports_site_id_fkey(id, name)
    `)
    .order('work_date', { ascending: false })
    .limit(20)

  // Check if user can create reports
  const canCreateReport = ['worker', 'site_manager', 'admin'].includes(profile.role)

  return (
    <DailyReportListEnhanced 
      currentUser={profile as any}
      sites={sites as any || []}
    />
  )
}

function DailyReportsLoading() {
  return (
    <LoadingState 
      title="작업일지를 불러오는 중..."
      description="데이터를 로딩하고 있습니다."
    />
  )
}

export default function DailyReportsPage() {
  return (
    <PageLayout
      title="작업일지"
      description="일일 작업 보고서 및 현장 상황을 관리합니다"
    >
      <PageContainer>
        <Suspense fallback={<DailyReportsLoading />}>
          <DailyReportsContent />
        </Suspense>
      </PageContainer>
    </PageLayout>
  )
}