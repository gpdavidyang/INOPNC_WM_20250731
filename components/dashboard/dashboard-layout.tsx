'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { Home, Calendar, FileText, FileImage, FolderOpen } from 'lucide-react'
import Sidebar from './sidebar'
import Header from './header'
import HomeTab from './tabs/home-tab'
import DailyReportTab from './tabs/daily-report-tab'
import AttendanceTab from './tabs/attendance-tab'
import DocumentsTabUnified from './tabs/documents-tab-unified'
// import SiteInfoTab from './tabs/site-info-tab' // Moved to dedicated page: /dashboard/site-info
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'

interface DashboardLayoutProps {
  user: User
  profile: Profile
  children?: React.ReactNode
  initialActiveTab?: string
}

export default function DashboardLayout({ user, profile, children, initialActiveTab = 'home' }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [documentsInitialSearch, setDocumentsInitialSearch] = useState<string | undefined>()

  // Update activeTab based on current pathname
  useEffect(() => {
    // Don't update activeTab for sub-pages
    if (pathname === '/dashboard/daily-reports/new') {
      // Keep current tab, don't change
      return
    }
    
    if (pathname.includes('/dashboard/site-info')) {
      setActiveTab('site-info')
    } else if (pathname.includes('/dashboard/daily-reports')) {
      setActiveTab('daily-reports')
    } else if (pathname.includes('/dashboard/attendance')) {
      setActiveTab('attendance')
    } else if (pathname.includes('/dashboard/documents')) {
      setActiveTab('documents-unified')
    } else if (pathname.includes('/dashboard/markup')) {
      setActiveTab('documents-unified')
    } else if (pathname === '/dashboard') {
      setActiveTab('home')
    }
  }, [pathname, children])

  // Handle tab changes when children are provided (dedicated pages)
  useEffect(() => {
    if (children && activeTab !== initialActiveTab) {
      // When activeTab changes and we have children (dedicated page), navigate to appropriate route
      // But don't navigate if we're already on the correct page
      switch (activeTab) {
        case 'home':
          if (pathname !== '/dashboard') {
            router.push('/dashboard')
          }
          break
        case 'daily-reports':
          // Don't navigate if we're on a daily-reports sub-page (like /new)
          if (!pathname.includes('/dashboard/daily-reports')) {
            router.push('/dashboard/daily-reports')
          }
          break
        case 'attendance':
          if (pathname !== '/dashboard/attendance') {
            router.push('/dashboard/attendance')
          }
          break
        case 'documents-unified':
        case 'documents':
          if (!pathname.includes('/dashboard/documents')) {
            router.push('/dashboard/documents')
          }
          break
        case 'shared-documents':
          if (pathname !== '/dashboard/documents' || !window.location.search.includes('tab=shared')) {
            router.push('/dashboard/documents?tab=shared')
          }
          break
        case 'site-info':
          // Don't navigate if we're already on site-info page
          if (!pathname.includes('/dashboard/site-info')) {
            router.push('/dashboard/site-info')
          }
          break
        case 'blueprint-markup':
          if (!window.location.search.includes('tab=markup')) {
            router.push('/dashboard/documents?tab=markup')
          }
          break
      }
    }
  }, [activeTab, children, initialActiveTab, router, pathname])

  // Handle case where profile is not loaded yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // PRD 사양에 맞는 하단 네비게이션 아이템 구성
  const bottomNavItems: BottomNavItem[] = [
    { 
      label: "홈(빠른메뉴)", 
      href: "#home", 
      icon: <Home /> 
    },
    { 
      label: "출력현황", 
      href: "#attendance", 
      icon: <Calendar /> 
    },
    { 
      label: "작업일지", 
      href: "#daily-reports", 
      icon: <FileText />, 
      badge: 3 // TODO: 실제 미완성 보고서 수로 동적 설정
    },
    { 
      label: "공도면", 
      href: "#shared-documents-blueprint", 
      icon: <FileImage />,
      specialAction: 'filter-blueprint' as const
    },
    { 
      label: "문서함", 
      href: "#documents-unified", 
      icon: <FolderOpen /> 
    }
  ]

  // 하단 네비게이션 클릭 처리
  const handleBottomNavClick = (tabId: string) => {
    const cleanTabId = tabId.replace('#', '')
    setActiveTab(cleanTabId)
  }

  const renderContent = () => {
    // If children are provided (e.g., from dedicated pages), render them instead
    if (children) {
      console.log('DashboardLayout: Rendering children (dedicated page)', { pathname, activeTab })
      return children
    }
    
    console.log('DashboardLayout: Rendering tab content', { pathname, activeTab })
    
    switch (activeTab) {
      case 'home':
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          onDocumentsSearch={setDocumentsInitialSearch}
        />
      case 'daily-reports':
        return <DailyReportTab profile={profile} />
      case 'attendance':
        return <AttendanceTab profile={profile} />
      case 'documents-unified':
      case 'documents':
        return <DocumentsTabUnified profile={profile} initialSearch={documentsInitialSearch} />
      case 'site-info':
        // Site info has its own dedicated page at /dashboard/site-info
        // This case shouldn't normally be reached when using the dedicated page
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          onDocumentsSearch={setDocumentsInitialSearch}
        />
      case 'blueprint-markup':
        // Should not reach here - dedicated page at /dashboard/markup
        return <div className="p-4">Loading markup editor...</div>
      case 'profile':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">내정보</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">이름</label>
                <p className="text-lg text-gray-900 dark:text-gray-100">{profile.full_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">이메일</label>
                <p className="text-lg text-gray-900 dark:text-gray-100">{profile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">역할</label>
                <p className="text-lg text-gray-900 dark:text-gray-100">
                  {profile.role === 'worker' && '작업자'}
                  {profile.role === 'site_manager' && '현장관리자'}
                  {profile.role === 'customer_manager' && '파트너사'}
                  {profile.role === 'admin' && '관리자'}
                  {profile.role === 'system_admin' && '시스템관리자'}
                </p>
              </div>
            </div>
          </div>
        )
      // 관리자 전용 메뉴들
      case 'site-management':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">현장 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">현장 관리 기능이 구현될 예정입니다.</p>
          </div>
        )
      case 'user-management':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">사용자 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">사용자 관리 기능이 구현될 예정입니다.</p>
          </div>
        )
      case 'shared-documents-management':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">공유 문서함 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">공유 문서함 관리 기능이 구현될 예정입니다.</p>
          </div>
        )
      case 'payroll-management':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">급여 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">급여 관리 기능이 구현될 예정입니다.</p>
          </div>
        )
      case 'npc1000-management':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">NPC-1000 자재 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">NPC-1000 자재 관리 기능이 구현될 예정입니다.</p>
          </div>
        )
      case 'blueprint-markup-management':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">도면 마킹 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">도면 마킹 관리 기능이 구현될 예정입니다.</p>
          </div>
        )
      case 'other-admin-menu':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">그 외 관리자 메뉴</h2>
            <p className="text-gray-600 dark:text-gray-400">추가 관리자 기능이 구현될 예정입니다.</p>
          </div>
        )
      case 'system-management':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">시스템 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">시스템 관리 기능이 구현될 예정입니다.</p>
          </div>
        )
      case 'settings':
        return (
          <div className="max-w-7xl mx-auto">
            <iframe 
              src="/dashboard/settings" 
              className="w-full h-screen border-0"
              title="Settings"
            />
          </div>
        )
      default:
        return <HomeTab profile={profile} onTabChange={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
      >
        메인 콘텐츠로 이동
      </a>

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside aria-label="메인 네비게이션">
        <Sidebar
          profile={profile}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Page header */}
        <Header
          profile={profile}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        {/* Main content */}
        <main id="main-content" className="py-6 pb-16 md:pb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div role="region" aria-live="polite" aria-label="페이지 콘텐츠">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="모바일 하단 네비게이션" className="md:hidden">
        <BottomNavigation 
          items={bottomNavItems}
          currentUser={{ 
            id: profile.id, 
            active_site_id: (profile as any).site_id || undefined 
          }}
          onTabChange={setActiveTab}
          activeTab={activeTab}
        />
      </nav>
    </div>
  )
}