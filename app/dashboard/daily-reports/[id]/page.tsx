import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDailyReport } from '@/lib/supabase/daily-reports'
import DailyReportDetail from '@/components/daily-reports/daily-report-detail'

export default async function DailyReportDetailPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }
  
  const report = await getDailyReport(params.id)
  
  if (!report) {
    redirect('/dashboard')
  }
  
  return <DailyReportDetail report={report} />
}