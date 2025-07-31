import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DailyReportList from '@/components/daily-reports/daily-report-list-new'
import { Skeleton } from '@/components/ui/skeleton'

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
      site:sites(id, name),
      created_by_profile:profiles!daily_reports_created_by_fkey(full_name),
      approved_by_profile:profiles!daily_reports_approved_by_fkey(full_name)
    `)
    .order('report_date', { ascending: false })
    .limit(20)

  return (
    <DailyReportList 
      sites={sites as any || []}
      initialReports={reports as any || []}
      currentUserRole={profile.role as any}
    />
  )
}

function DailyReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  )
}

export default function DailyReportsPage() {
  return (
    <Suspense fallback={<DailyReportsLoading />}>
      <DailyReportsContent />
    </Suspense>
  )
}