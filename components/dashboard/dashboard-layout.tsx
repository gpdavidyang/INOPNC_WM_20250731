'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { Home, Calendar, FileText, FolderOpen, User as UserIcon, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Sidebar from './sidebar'
import Header from './header'
import HomeTab from './tabs/home-tab'
import DailyReportTab from './tabs/daily-report-tab'
import AttendanceTab from './tabs/attendance-tab'
import DocumentsTabUnified from './tabs/documents-tab-unified'
// import SiteInfoTab from './tabs/site-info-tab' // Moved to dedicated page: /dashboard/site-info
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'
import { NavigationController } from '@/components/navigation/navigation-controller'
import { ConstructionNavBar, ConstructionNavItem } from '@/components/navigation/construction-nav-bar'

interface DashboardLayoutProps {
  user: User
  profile: Profile
  children?: React.ReactNode
  initialActiveTab?: string
  useConstructionMode?: boolean // 건설 현장 모드 옵션
  initialCurrentSite?: any
  initialSiteHistory?: any[]
}

export default function DashboardLayout({ user, profile, children, initialActiveTab = 'home', useConstructionMode = false, initialCurrentSite, initialSiteHistory }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [documentsInitialSearch, setDocumentsInitialSearch] = useState<string | undefined>()

  // Helper function to get active tab from pathname
  const getCurrentActiveTabFromPath = (path: string) => {
    if (path.includes('/dashboard/site-info')) return 'site-info'
    if (path.includes('/dashboard/daily-reports')) return 'daily-reports'
    if (path.includes('/dashboard/attendance')) return 'attendance'
    if (path.includes('/dashboard/documents')) return 'documents-unified'
    if (path.includes('/dashboard/markup')) return 'documents-unified'
    if (path.includes('/dashboard/profile')) return 'profile'
    if (path === '/dashboard') return 'home'
    return 'home'
  }

  // Update activeTab based on current pathname - OPTIMIZED
  useEffect(() => {
    // Performance optimization: Use single evaluation
    const newTab = getCurrentActiveTabFromPath(pathname)
    // Only update if actually changed to prevent re-renders
    if (newTab !== activeTab) {
      setActiveTab(newTab)
    }
  }, [pathname]) // ✅ Removed children and activeTab dependency to prevent loops

  // Handle navigation for dedicated pages - MOVED OUT OF RENDER
  useEffect(() => {
    if (activeTab === 'attendance' && pathname !== '/dashboard/attendance') {
      router.push('/dashboard/attendance')
    } else if (activeTab === 'documents' && pathname !== '/dashboard/documents') {
      router.push('/dashboard/documents')
    }
  }, [activeTab, pathname, router])

  // REMOVED: This effect causes circular routing and performance issues
  // Navigation should be handled by user actions, not state changes
  // Each navigation component (sidebar, bottom nav, quick menu) handles its own routing

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
      label: "출력정보", 
      href: "/dashboard/attendance", 
      icon: <Calendar /> 
    },
    { 
      label: "작업일지", 
      href: "/dashboard/daily-reports", 
      icon: <FileText />, 
      badge: 3 // TODO: 실제 미완성 보고서 수로 동적 설정
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
  
  // 건설 현장 네비게이션 아이템 (성능 최적화 및 안전 기능 강화)
  const constructionNavItems: ConstructionNavItem[] = [
    { 
      id: "home",
      label: "홈(빠른메뉴)", 
      href: "#home", 
      icon: <Home />,
      priority: 'normal'
    },
    { 
      id: "attendance",
      label: "출력정보", 
      href: "/dashboard/attendance", 
      icon: <Calendar />,
      priority: 'high', // 출근 기록은 중요
      badge: 1
    },
    { 
      id: "daily-reports",
      label: "작업일지", 
      href: "/dashboard/daily-reports", 
      icon: <FileText />, 
      priority: 'high',
      badge: 3
    },
    { 
      id: "site-info",
      label: "현장정보", 
      href: "/dashboard/site-info", 
      icon: <MapPin />,
      priority: 'normal'
    },
    { 
      id: "documents",
      label: "문서함", 
      href: "/dashboard/documents", 
      icon: <FolderOpen />,
      priority: 'normal'
    }
  ]



  // 하단 네비게이션 클릭 처리
  const handleBottomNavClick = (tabId: string) => {
    // Check if it's a direct link (starts with /)
    if (tabId.startsWith('/')) {
      router.push(tabId)
      return
    }
    const cleanTabId = tabId.replace('#', '')
    setActiveTab(cleanTabId)
  }

  const renderContent = () => {
    // If children are provided (e.g., from dedicated pages), render them instead
    if (children) {
      return (
        <div key={pathname} className="dashboard-dedicated-page">
          {children}
        </div>
      )
    }
    
    
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
        // Show fallback content while navigation happens
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          onDocumentsSearch={setDocumentsInitialSearch}
        />
      case 'documents-unified':
        return <DocumentsTabUnified profile={profile} initialSearch={documentsInitialSearch} />
      case 'documents':
        // Show fallback content while navigation happens
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          onDocumentsSearch={setDocumentsInitialSearch}
        />
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
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">내정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )
      // 관리자 전용 메뉴들
      case 'site-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">현장 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">현장 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'user-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">사용자 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">사용자 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'shared-documents-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">공유 문서함 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">공유 문서함 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'payroll-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">급여 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">급여 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'npc1000-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">NPC-1000 자재 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">NPC-1000 자재 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'blueprint-markup-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">도면 마킹 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">도면 마킹 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'other-admin-menu':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">그 외 관리자 메뉴</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">추가 관리자 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
        )
      case 'system-management':
        return (
          <Card elevation="sm" className="theme-transition">
            <CardHeader>
              <CardTitle className="text-2xl">시스템 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">시스템 관리 기능이 구현될 예정입니다.</p>
            </CardContent>
          </Card>
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
        return <HomeTab 
          profile={profile} 
          onTabChange={setActiveTab}
          initialCurrentSite={initialCurrentSite}
          initialSiteHistory={initialSiteHistory}
        />
    }
  }

  return (
    <NavigationController>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition">
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
          className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-40 lg:hidden transition-opacity duration-200"
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
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        {/* Main content */}
        <main id="main-content" className="pt-3 px-4 sm:px-6 lg:px-8 pb-16 md:pb-6 bg-slate-100 dark:bg-slate-900 min-h-screen">
          <div className="mx-auto max-w-7xl">
            <div role="region" aria-live="polite" aria-label="페이지 콘텐츠">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - 건설 모드에 따라 선택 */}
      <nav aria-label="모바일 하단 네비게이션" className="md:hidden">
        {useConstructionMode ? (
          <ConstructionNavBar 
            items={constructionNavItems}
            currentUser={{ 
              id: profile.id, 
              active_site_id: (profile as any).site_id || undefined 
            }}
          />
        ) : (
          <BottomNavigation 
            items={bottomNavItems}
            currentUser={{ 
              id: profile.id, 
              active_site_id: (profile as any).site_id || undefined 
            }}
            onTabChange={handleBottomNavClick}
            activeTab={activeTab}
          />
        )}
      </nav>
      </div>
    </NavigationController>
  )
}