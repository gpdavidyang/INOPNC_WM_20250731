'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import DocumentsTabUnified from '@/components/dashboard/tabs/documents-tab-unified'

interface DocumentsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      console.log('[DocumentsPage] Checking authentication...')
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.log('[DocumentsPage] No user found, redirecting to login')
          router.replace('/auth/login')
          return
        }

        console.log('[DocumentsPage] User authenticated:', user.email)
        setUser(user)

        // Get user profile - simplified query without site_assignments
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          console.log('[DocumentsPage] Profile error:', profileError)
          router.replace('/auth/login')
          return
        }

        console.log('[DocumentsPage] Profile loaded:', profile.email)
        setProfile(profile)
      } catch (error) {
        console.error('[DocumentsPage] Auth check error:', error)
        router.replace('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">문서함을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null // Redirect will happen in useEffect
  }

  return (
    <DashboardLayout 
      user={user} 
      profile={profile}
    >
      <DocumentsTabUnified 
        profile={profile} 
        initialTab={(searchParams?.tab as 'personal' | 'shared' | 'markup') || 'personal'}
        initialSearch={searchParams?.search as string}
      />
    </DashboardLayout>
  )
}