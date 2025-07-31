import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DailyReportFormEnhanced from '@/components/daily-reports/daily-report-form-enhanced'

export default async function NewDailyReportPage() {
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

  // Check if user can create reports
  const allowedRoles = ['worker', 'site_manager', 'admin', 'system_admin']
  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard/daily-reports')
  }

  // Get sites
  const sitesQuery = profile.site_id 
    ? supabase.from('sites').select('*').eq('id', profile.site_id)
    : supabase.from('sites').select('*').eq('organization_id', profile.organization_id).eq('status', 'active')
  
  const { data: sites } = await sitesQuery

  // Get materials
  const { data: materials } = await supabase
    .from('materials')
    .select(`
      *,
      category:material_categories(*)
    `)
    .eq('is_active', true)
    .order('name')

  // Get workers for attendance
  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .in('role', ['worker', 'site_manager'])
    .eq('status', 'active')
    .order('full_name')

  return (
    <DailyReportFormEnhanced
      sites={sites || []}
      currentUser={profile}
      materials={materials || []}
      workers={workers || []}
    />
  )
}