import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MyDocuments } from '@/components/documents/my-documents'
import { SharedDocuments } from '@/components/documents/shared-documents'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">문서 관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          개인 문서 및 공유 문서를 관리합니다
        </p>
      </div>

      <div className="p-6">
        <Tabs defaultValue="my-documents" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-documents">내문서함</TabsTrigger>
            <TabsTrigger value="shared-documents">공유문서함</TabsTrigger>
          </TabsList>

          <TabsContent value="my-documents" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <MyDocuments profile={profile} />
            </Suspense>
          </TabsContent>

          <TabsContent value="shared-documents" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <SharedDocuments profile={profile} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}