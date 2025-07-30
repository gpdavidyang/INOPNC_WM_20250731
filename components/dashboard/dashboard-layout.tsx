'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import Sidebar from './sidebar'
import Header from './header'
import HomeTab from './tabs/home-tab'
import DailyReportTab from './tabs/daily-report-tab'
import AttendanceTab from './tabs/attendance-tab'
import DocumentsTab from './tabs/documents-tab'
import SiteInfoTab from './tabs/site-info-tab'
import SharedDocumentsTab from './tabs/shared-documents-tab'

interface DashboardLayoutProps {
  user: User
  profile: Profile
}

export default function DashboardLayout({ user, profile }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab profile={profile} />
      case 'daily-reports':
        return <DailyReportTab profile={profile} />
      case 'attendance':
        return <AttendanceTab profile={profile} />
      case 'documents':
        return <DocumentsTab profile={profile} />
      case 'site-info':
        return <SiteInfoTab profile={profile} />
      case 'shared-documents':
        return <SharedDocumentsTab profile={profile} />
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
        return <HomeTab profile={profile} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="lg:pl-64">
        <Header
          profile={profile}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}