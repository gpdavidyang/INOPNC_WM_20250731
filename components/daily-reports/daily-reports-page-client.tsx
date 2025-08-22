'use client'

import { DailyReportListEnhanced } from '@/components/daily-reports/DailyReportListEnhanced'
import { DailyReportListMobile } from '@/components/daily-reports/DailyReportListMobile'
import Header from '@/components/dashboard/header'
import Sidebar from '@/components/dashboard/sidebar'
import { NavigationController } from '@/components/navigation/navigation-controller'
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'
import { ReportsPageHeader } from '@/components/ui/page-header'
import { Profile } from '@/types'
import { Calendar, FileText, FolderOpen, Home, MapPin } from 'lucide-react'
import { useState } from 'react'

interface DailyReportsPageClientProps {
  profile: Profile
  sites: any[]
}

export function DailyReportsPageClient({ profile, sites }: DailyReportsPageClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Bottom navigation items
  const bottomNavItems: BottomNavItem[] = [
    { 
      label: "빠른화면", 
      href: "/dashboard", 
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
    <NavigationController>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        {/* Desktop Sidebar */}
        <Sidebar 
          profile={profile}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab="daily-reports"
          onTabChange={() => {}}
        />
        
        {/* Main Content */}
        <div className="lg:ml-64">
          {/* Header with hamburger button functionality */}
          <Header 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            isSidebarOpen={isSidebarOpen}
          />
          
          {/* Page Content */}
          <main className="px-3 sm:px-4 lg:px-6 pb-16 lg:pb-0">
            <div className="h-full" style={{ backgroundColor: 'var(--bg)' }}>
              {/* Mobile View - UI Guidelines에 맞춘 모바일 최적화 */}
              <div className="lg:hidden pt-3">
                <DailyReportListMobile 
                  currentUser={profile as any}
                  sites={sites || []}
                />
              </div>
              
              {/* Desktop View - 기존 Enhanced 컴포넌트 유지 */}
              <div className="hidden lg:block" style={{ backgroundColor: 'var(--card-bg)' }}>
                <ReportsPageHeader
                  title="작업일지"
                  subtitle="일일 작업 보고서 및 현장 상황을 관리합니다"
                />
                <DailyReportListEnhanced 
                  currentUser={profile as any}
                  sites={sites || []}
                />
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
    </NavigationController>
  )
}