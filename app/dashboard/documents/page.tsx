import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getDocuments } from '@/app/actions/documents'
import DocumentsList from '@/components/documents/documents-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

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
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Get user's documents
  const documentsResult = await getDocuments()
  const documents = documentsResult.success ? documentsResult.data : []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">문서 관리</h1>
          <p className="text-gray-600 dark:text-gray-400">
            개인 문서 및 업무 관련 파일을 관리합니다
          </p>
        </div>
        
        <Link href="/dashboard/documents/upload">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            문서 업로드
          </Button>
        </Link>
      </div>

      <DocumentsList documents={documents} />
    </div>
  )
}