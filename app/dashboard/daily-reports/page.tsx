import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyReportListMobile } from '@/components/daily-reports/DailyReportListMobile'
import { DailyReportListEnhanced } from '@/components/daily-reports/DailyReportListEnhanced'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer, LoadingState } from '@/components/dashboard/page-layout'
import { ReportsPageHeader } from '@/components/ui/page-header'
import Sidebar from '@/components/dashboard/sidebar'
import Header from '@/components/dashboard/header'
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'
import { Home, Calendar, FileText, FolderOpen, MapPin } from 'lucide-react'

export default async function DailyReportsPage() {
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

  // Get sites - simplified since organization relationships aren't set up
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  console.log('DailyReportsPage - sites query result:', { sites, sitesError })

  // Check if user can create reports
  const canCreateReport = ['worker', 'site_manager', 'admin'].includes(profile.role)
  
  // Bottom navigation items
  const bottomNavItems: BottomNavItem[] = [
    { 
      label: "홈(빠른화면)", 
      href: "/dashboard", 
      icon: <Home /> 
    },
    { 
      label: "출력현황", 
      href: "/dashboard/attendance", 
      icon: <Calendar /> 
    },
    { 
      label: "작업일지", 
      href: "/dashboard/daily-reports", 
      icon: <FileText />, 
      badge: 3
    },
    { 
      label: "현장정보", 
      href: "/dashboard/site-info", 
      icon: <MapPin /> 
    },
    { 
      label: "문서함", 
      href: "/dashboard/documents", 
      icon: <FolderOpen /> 
    }
  ]
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar - No event handlers for independent page */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          {/* Simplified sidebar content without event handlers */}
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">INOPNC</h1>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              <a href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                홈
              </a>
              <a href="/dashboard/attendance" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                출근현황
              </a>
              <a href="/dashboard/daily-reports" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                작업일지
              </a>
              <a href="/dashboard/site-info" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                현장정보
              </a>
              <a href="/dashboard/documents" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                문서함
              </a>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <Header user={user} profile={profile as any} />
        
        {/* Page Content */}
        <main className="pb-16 lg:pb-0">
          <div className="h-full bg-gray-50 dark:bg-gray-900">
            {/* Mobile View - UI Guidelines에 맞춘 모바일 최적화 */}
            <div className="lg:hidden">
              <DailyReportListMobile 
                currentUser={profile as any}
                sites={sites || []}
              />
            </div>
            
            {/* Desktop View - 기존 Enhanced 컴포넌트 유지 */}
            <div className="hidden lg:block bg-white dark:bg-gray-900">
              <ReportsPageHeader
                title="작업일지"
                subtitle="일일 작업 보고서 및 현장 상황을 관리합니다"
              />
              <PageContainer>
                <DailyReportListEnhanced 
                  currentUser={profile as any}
                  sites={sites || []}
                />
              </PageContainer>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        items={bottomNavItems}
        className="lg:hidden"
      />
    </div>
  )
}