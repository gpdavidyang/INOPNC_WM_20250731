'use client'

import { Profile, UserRole } from '@/types'
import { Home, FileText, Calendar, FolderOpen, Building, Share2, Users, BarChart3, Settings, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/auth/actions'

interface SidebarProps {
  profile: Profile
  activeTab: string
  onTabChange: (tab: string) => void
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: any
  roles: UserRole[]
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: 'daily-reports',
    label: '작업일지',
    icon: FileText,
    roles: ['worker', 'site_manager', 'admin', 'system_admin']
  },
  {
    id: 'attendance',
    label: '출근/급여관리',
    icon: Calendar,
    roles: ['worker', 'site_manager', 'admin', 'system_admin']
  },
  {
    id: 'documents',
    label: '내문서함',
    icon: FolderOpen,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: 'site-info',
    label: '현장정보',
    icon: Building,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  },
  {
    id: 'shared-documents',
    label: '공유문서함',
    icon: Share2,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  }
]

const adminMenuItems: MenuItem[] = [
  {
    id: 'user-management',
    label: '사용자 관리',
    icon: Users,
    roles: ['admin', 'system_admin']
  },
  {
    id: 'statistics',
    label: '통계 대시보드',
    icon: BarChart3,
    roles: ['admin', 'system_admin']
  },
  {
    id: 'settings',
    label: '설정',
    icon: Settings,
    roles: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
  }
]

export default function Sidebar({ profile, activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        // Use window.location for full page refresh to clear all auth state
        window.location.href = '/auth/login'
      } else if (result.error) {
        console.error('Logout error:', result.error)
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback to direct signout
      await supabase.auth.signOut()
      window.location.href = '/auth/login'
    }
  }

  // Handle null profile case
  if (!profile) {
    return null
  }

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(profile.role as UserRole)
  )

  const filteredAdminMenuItems = adminMenuItems.filter(item =>
    item.roles.includes(profile.role as UserRole)
  )

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">IN</span>
              </div>
              <span className="ml-3 text-lg font-semibold">INOPNC</span>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <SidebarContent
            profile={profile}
            activeTab={activeTab}
            onTabChange={onTabChange}
            filteredMenuItems={filteredMenuItems}
            filteredAdminMenuItems={filteredAdminMenuItems}
            handleLogout={handleLogout}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:shadow-lg">
        <div className="flex h-full flex-col">
          <div className="flex items-center px-4 py-4 border-b">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">IN</span>
            </div>
            <span className="ml-3 text-lg font-semibold">INOPNC</span>
          </div>
          <SidebarContent
            profile={profile}
            activeTab={activeTab}
            onTabChange={onTabChange}
            filteredMenuItems={filteredMenuItems}
            filteredAdminMenuItems={filteredAdminMenuItems}
            handleLogout={handleLogout}
          />
        </div>
      </div>
    </>
  )
}

function SidebarContent({ 
  profile, 
  activeTab, 
  onTabChange, 
  filteredMenuItems, 
  filteredAdminMenuItems,
  handleLogout 
}: any) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 px-3 py-4">
        {/* User info */}
        <div className="mb-6 px-3 py-2 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
          <p className="text-xs text-gray-500">{profile.email}</p>
          <p className="text-xs text-gray-500 mt-1">
            {profile.role === 'worker' && '작업자'}
            {profile.role === 'site_manager' && '현장관리자'}
            {profile.role === 'customer_manager' && '파트너사'}
            {profile.role === 'admin' && '관리자'}
            {profile.role === 'system_admin' && '시스템관리자'}
          </p>
        </div>

        {/* Main menu */}
        <nav className="space-y-1">
          {filteredMenuItems.map((item: any) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Admin menu */}
        {filteredAdminMenuItems.length > 0 && (
          <>
            <div className="my-4 border-t border-gray-200" />
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              관리자 메뉴
            </p>
            <nav className="space-y-1">
              {filteredAdminMenuItems.map((item: any) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </>
        )}
      </div>

      {/* Logout button */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}