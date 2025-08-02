import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DocumentsPageClient } from '@/components/documents/documents-page-client'

export default async function DocumentsPage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return <DocumentsPageClient profile={profile} />
}