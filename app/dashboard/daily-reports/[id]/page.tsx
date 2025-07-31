import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getDailyReportById } from '@/app/actions/daily-reports'
import DailyReportDetail from '@/components/daily-reports/daily-report-detail-new'

export default async function DailyReportDetailPage({
  params
}: {
  params: { id: string }
}) {
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

  // Get daily report with all related data
  const result = await getDailyReportById(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const report = result.data

  // TODO: Implement proper access control when organization relationships are set up
  // For now, allow access to all authenticated users
  const hasAccess = true
  // report.site?.organization_id === profile.organization_id ||
  // profile.site_id === report.site_id ||
  // ['admin', 'system_admin'].includes(profile.role)

  if (!hasAccess) {
    redirect('/dashboard/daily-reports')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <DailyReportDetail
        report={report as any}
        currentUser={profile as any}
      />
    </div>
  )
}