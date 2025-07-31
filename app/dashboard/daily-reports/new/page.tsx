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

  // Get sites - simplified for now since site relationships aren't properly set up
  const sitesQuery = supabase.from('sites').select('*').eq('status', 'active')
  
  const { data: sites } = await sitesQuery

  // TODO: Get materials when materials table is created
  // const { data: materials } = await supabase
  //   .from('materials')
  //   .select(`
  //     *,
  //     category:material_categories(*)
  //   `)
  //   .eq('is_active', true)
  //   .order('name')
  
  const materials: any[] = []

  // Get workers for attendance - simplified query since organization relationships aren't set up
  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['worker', 'site_manager'])
    .eq('status', 'active')
    .order('full_name')

  return (
    <DailyReportFormEnhanced
      sites={sites as any || []}
      currentUser={profile as any}
      materials={materials || []}
      workers={workers as any || []}
    />
  )
}