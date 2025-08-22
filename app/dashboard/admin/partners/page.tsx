import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PartnerList from '@/components/admin/partners/PartnerList'

export default async function PartnersPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return <PartnerList profile={profile} />
}