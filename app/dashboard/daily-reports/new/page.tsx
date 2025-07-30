import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DailyReportForm from '@/components/daily-reports/daily-report-form'

export default async function NewDailyReportPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }
  
  // Get user profile to check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['worker', 'site_manager'].includes(profile.role)) {
    redirect('/dashboard')
  }
  
  // Get sites for the form
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, organization_id')
    .eq('status', 'active')
    .order('name')
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">새 작업일지 작성</h1>
      <DailyReportForm sites={sites || []} />
    </div>
  )
}