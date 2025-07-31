'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import MobileSidebar from './mobile-sidebar'
import MobileBottomNav from './mobile-bottom-nav'
import MobileHeader from './mobile-header'

interface MobileLayoutProps {
  profile: Profile
  children: React.ReactNode
}

export default function MobileLayout({ profile, children }: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <MobileSidebar
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Header */}
      <MobileHeader title={getPageTitle(activeTab)} />

      {/* Main Content */}
      <main className="pt-16 pb-20 px-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}

function getPageTitle(tab: string): string {
  const titles: { [key: string]: string } = {
    'home': '홈',
    'daily-reports': '작업일지',
    'attendance': '출근/급여관리',
    'documents': '내문서함',
    'site-info': '현장정보',
    'shared-documents': '공유문서함',
    'user-management': '사용자 관리',
    'statistics': '통계 대시보드',
    'settings': '설정',
    'more': '더보기'
  }
  return titles[tab] || '홈'
}