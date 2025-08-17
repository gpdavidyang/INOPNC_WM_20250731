import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import { DocumentsPageWithTabs } from '@/components/documents/documents-page-with-tabs'

interface DocumentsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile with site information  
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      organization:organizations(*),
      site_assignments(
        site_id,
        site:sites(id, name)
      )
    `)
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <DashboardLayout 
      user={user} 
      profile={profile as any}
    >
      <DocumentsPageWithTabs profile={profile} searchParams={searchParams} />
    </DashboardLayout>
  )
}