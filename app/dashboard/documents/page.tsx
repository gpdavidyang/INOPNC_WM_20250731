'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DocumentsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main dashboard with documents tab active
    const tab = searchParams?.tab || 'personal'
    const search = searchParams?.search || ''
    
    // Build query params for the main dashboard
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    
    const targetUrl = `/dashboard#documents-unified${params.toString() ? '?' + params.toString() : ''}`
    
    console.log('[DocumentsPage] Redirecting to main dashboard with documents tab:', targetUrl)
    router.replace(targetUrl)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">문서함으로 이동 중...</p>
      </div>
    </div>
  )
}