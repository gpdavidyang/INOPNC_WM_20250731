import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SharedDocumentsManagement from '@/components/admin/documents/SharedDocumentsManagement'

export default async function AdminSharedDocumentsPage() {
  const supabase = createClient()
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      redirect('/auth/login')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      redirect('/auth/login')
    }

    if (profile.role !== 'admin') {
      redirect('/dashboard')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공유문서함 관리</h1>
          <p className="text-gray-600 mt-1">현장별 공유 문서를 관리합니다.</p>
        </div>
        
        <SharedDocumentsManagement />
      </div>
    )
  } catch (error) {
    console.error('Error loading shared documents page:', error)
    redirect('/auth/login')
  }
}