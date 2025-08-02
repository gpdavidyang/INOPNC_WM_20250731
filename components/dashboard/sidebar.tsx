'use client'

import { Profile, UserRole } from '@/types'
import { 
  Home, FileText, Calendar, FolderOpen, MapPin, Share2, Edit3, User, Users, 
  BarChart3, Settings, X, Bell, Building2, FolderCheck, DollarSign, 
  Package, Layers, MoreHorizontal, Hammer 
} from 'lucide-react'
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
  href?: string // Optional href for navigation
  isAdminPage?: boolean // Flag to indicate admin pages
}

// UI_Guidelines.md 사양에 맞는 일반 사용자 메뉴 (A.작업자, B.현장관리자, C.파트너사)
const generalUserMenuItems: MenuItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    roles: ['worker', 'site_manager', 'customer_manager']
  },
  {
    id: 'attendance',
    label: '출력현황',
    icon: Calendar,
    roles: ['worker', 'site_manager', 'customer_manager']
  },
  {
    id: 'daily-reports',
    label: '작업일지',
    icon: FileText,
    roles: ['worker', 'site_manager', 'customer_manager']
  },
  {
    id: 'site-info',
    label: '현장정보',
    icon: MapPin,
    roles: ['worker', 'site_manager', 'customer_manager']
  },
  {
    id: 'documents',
    label: '내문서함',
    icon: FolderOpen,
    roles: ['worker', 'site_manager', 'customer_manager']
  },
  {
    id: 'shared-documents',
    label: '공유문서함',
    icon: Share2,
    roles: ['worker', 'site_manager', 'customer_manager']
  },
  {
    id: 'materials',
    label: '자재 관리',
    icon: Package,
    roles: ['worker', 'site_manager', 'customer_manager'],
    href: '/dashboard/materials'
  },
  {
    id: 'equipment',
    label: '장비 & 자원',
    icon: Hammer,
    roles: ['worker', 'site_manager', 'customer_manager'],
    href: '/dashboard/equipment'
  },
  {
    id: 'blueprint-markup',
    label: '도면 마킹 도구',
    icon: Edit3,
    roles: ['worker', 'site_manager', 'customer_manager']
  },
  {
    id: 'profile',
    label: '내정보',
    icon: User,
    roles: ['worker', 'site_manager', 'customer_manager']
  }
]

// UI_Guidelines.md 사양에 맞는 본사 관리자 전용 메뉴 (D.본사 관리자)
const adminMenuItems: MenuItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin',
    isAdminPage: true
  },
  {
    id: 'site-management',
    label: '현장 관리',
    icon: Building2,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/sites',
    isAdminPage: true
  },
  {
    id: 'user-management',
    label: '사용자 관리',
    icon: Users,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/users',
    isAdminPage: true
  },
  {
    id: 'shared-documents-management',
    label: '공유 문서함 관리',
    icon: FolderCheck,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/shared-documents',
    isAdminPage: true
  },
  {
    id: 'payroll-management',
    label: '급여 관리',
    icon: DollarSign,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/salary',
    isAdminPage: true
  },
  {
    id: 'npc1000-management',
    label: 'NPC-1000 자재 관리',
    icon: Package,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/materials',
    isAdminPage: true
  },
  {
    id: 'blueprint-markup-management',
    label: '도면 마킹 관리',
    icon: Layers,
    roles: ['admin', 'system_admin'],
    href: '/dashboard/admin/markup',
    isAdminPage: true
  }
]

// 시스템 관리자 추가 메뉴
const systemAdminMenuItems: MenuItem[] = [
  {
    id: 'system-management',
    label: '시스템 관리',
    icon: Settings,
    roles: ['system_admin'],
    href: '/dashboard/admin/system',
    isAdminPage: true
  },
  {
    id: 'profile',
    label: '내정보',
    icon: User,
    roles: ['admin', 'system_admin']
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

  // 사용자 역할에 따른 메뉴 구성
  const getMenuItemsForRole = () => {
    if (profile.role === 'admin' || profile.role === 'system_admin') {
      // 본사 관리자는 관리자 전용 메뉴를 사용
      return {
        mainMenuItems: adminMenuItems.filter(item => 
          item.roles.includes(profile.role as UserRole)
        ),
        systemMenuItems: profile.role === 'system_admin' ? systemAdminMenuItems : []
      }
    } else {
      // 일반 사용자 (작업자, 현장관리자, 파트너사)는 일반 메뉴를 사용
      return {
        mainMenuItems: generalUserMenuItems.filter(item => 
          item.roles.includes(profile.role as UserRole)
        ),
        systemMenuItems: []
      }
    }
  }

  const { mainMenuItems, systemMenuItems } = getMenuItemsForRole()

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col relative">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">IN</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">INOPNC</span>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="사이드바 닫기"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <SidebarContent
            profile={profile}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onClose={onClose}
            mainMenuItems={mainMenuItems}
            systemMenuItems={systemMenuItems}
            handleLogout={handleLogout}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:bg-white lg:dark:bg-gray-800 lg:shadow-lg">
        <div className="flex h-full flex-col">
          <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">IN</span>
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">INOPNC</span>
          </div>
          <SidebarContent
            profile={profile}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onClose={onClose}
            mainMenuItems={mainMenuItems}
            systemMenuItems={systemMenuItems}
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
  onClose,
  mainMenuItems, 
  systemMenuItems,
  handleLogout 
}: any) {
  const router = useRouter()

  // 메뉴 클릭 시 탭 변경과 모바일에서 사이드바 닫기를 동시에 처리
  const handleMenuClick = (item: MenuItem) => {
    // Admin pages should navigate to separate routes
    if (item.isAdminPage && item.href) {
      router.push(item.href)
    } else {
      onTabChange(item.id)
    }
    
    // 모바일에서만 사이드바 닫기 (lg 미만 화면에서)
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 px-3 py-4 pb-20 md:pb-4">
        {/* User info */}
        <div className="mb-6 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg mx-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{profile.full_name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.email}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {profile.role === 'worker' && '작업자'}
            {profile.role === 'site_manager' && '현장관리자'}
            {profile.role === 'customer_manager' && '파트너사'}
            {profile.role === 'admin' && '관리자'}
            {profile.role === 'system_admin' && '시스템관리자'}
          </p>
        </div>

        {/* Main menu - 사용자 역할에 따라 다른 메뉴 표시 */}
        <nav className="space-y-1" aria-label="주요 메뉴">
          {mainMenuItems.map((item: MenuItem) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors touch-manipulation min-h-[48px] ${
                  activeTab === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                aria-current={activeTab === item.id ? 'page' : false}
                aria-label={`${item.label} 메뉴로 이동`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* System Admin 추가 메뉴 - 시스템 관리자만 표시 */}
        {systemMenuItems.length > 0 && (
          <>
            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              시스템 관리
            </p>
            <nav className="space-y-1" aria-label="시스템 관리 메뉴">
              {systemMenuItems.map((item: MenuItem) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors touch-manipulation min-h-[48px] ${
                      activeTab === item.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    aria-current={activeTab === item.id ? 'page' : false}
                    aria-label={`${item.label} 메뉴로 이동`}
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
      <div className="p-4 pb-20 md:pb-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 touch-manipulation transition-colors"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}