import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AttendancePageClient } from '@/components/attendance/attendance-page-client'

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
    <AttendancePageClient 
      profile={profile}
      isPartnerCompany={isPartnerCompany}
    />
  )
}