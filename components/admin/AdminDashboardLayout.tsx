'use client'

import { Profile } from '@/types'
import { 
  Shield, Menu, X, Home, Users, Building2, FolderCheck, 
  DollarSign, Package, Layers, Settings, LogOut
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '@/app/auth/actions'
import Link from 'next/link'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface AdminDashboardLayoutProps {
  profile: Profile
  children: React.ReactNode
}

const adminMenuItems = [
  {
    id: 'home',
    label: '홈',
    icon: Home,
    href: '/dashboard/admin'
  },
  {
    id: 'sites',
    label: '현장 관리',
    icon: Building2,
    href: '/dashboard/admin/sites'
  },
  {
    id: 'users',
    label: '사용자 관리',
    icon: Users,
    href: '/dashboard/admin/users'
  },
  {
    id: 'shared-documents',
    label: '공유 문서함 관리',
    icon: FolderCheck,
    href: '/dashboard/admin/shared-documents'
  },
  {
    id: 'salary',
    label: '급여 관리',
    icon: DollarSign,
    href: '/dashboard/admin/salary'
  },
  {
    id: 'materials',
    label: 'NPC-1000 자재 관리',
    icon: Package,
    href: '/dashboard/admin/materials'
  },
  {
    id: 'markup',
    label: '도면 마킹 관리',
    icon: Layers,
    href: '/dashboard/admin/markup'
  }
]

const systemAdminItems = [
  {
    id: 'system',
    label: '시스템 관리',
    icon: Settings,
    href: '/dashboard/admin/system'
  }
]

export default function AdminDashboardLayout({ profile, children }: AdminDashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        window.location.href = '/auth/login'
      } else if (result.error) {
        console.error('Logout error:', result.error)
      }
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/auth/login'
    }
  }

  const menuItems = profile.role === 'system_admin' 
    ? [...adminMenuItems, ...systemAdminItems]
    : adminMenuItems

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          <div className={`flex items-center justify-between ${
            touchMode === 'glove' ? 'px-5 py-5' : touchMode === 'precision' ? 'px-3 py-3' : 'px-4 py-4'
          } border-b border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600 mr-3" />
              <span className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>관리자</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 ${
                touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
              } rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <SidebarContent 
            profile={profile}
            menuItems={menuItems}
            pathname={pathname}
            handleLogout={handleLogout}
            onItemClick={() => setIsSidebarOpen(false)}
            isLargeFont={isLargeFont}
            touchMode={touchMode}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:bg-white lg:dark:bg-gray-800 lg:shadow-lg">
        <div className="flex h-full flex-col">
          <div className={`flex items-center ${
            touchMode === 'glove' ? 'px-5 py-5' : touchMode === 'precision' ? 'px-3 py-3' : 'px-4 py-4'
          } border-b border-gray-200 dark:border-gray-700`}>
            <Shield className="h-8 w-8 text-red-600 mr-3" />
            <span className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>관리자 대시보드</span>
          </div>
          <SidebarContent 
            profile={profile}
            menuItems={menuItems}
            pathname={pathname}
            handleLogout={handleLogout}
            onItemClick={() => {}}
            isLargeFont={isLargeFont}
            touchMode={touchMode}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className={`${
            touchMode === 'glove' ? 'px-5 sm:px-7 lg:px-9' : touchMode === 'precision' ? 'px-3 sm:px-5 lg:px-7' : 'px-4 sm:px-6 lg:px-8'
          }`}>
            <div className={`flex items-center justify-between ${
              touchMode === 'glove' ? 'h-20' : touchMode === 'precision' ? 'h-14' : 'h-16'
            }`}>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 lg:hidden ${
                  touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
                }`}
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-4">
                <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300`}>
                  {profile.full_name}
                </div>
                <div className={`bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 ${
                  touchMode === 'glove' ? 'px-4 py-2' : touchMode === 'precision' ? 'px-2.5 py-0.5' : 'px-3 py-1'
                } rounded-full ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>
                  {profile.role === 'system_admin' ? '시스템 관리자' : '관리자'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ 
  profile, 
  menuItems, 
  pathname,
  handleLogout,
  onItemClick,
  isLargeFont,
  touchMode
}: any) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex-1 px-3 py-4">
        {/* User info */}
        <div className={`mb-6 ${
          touchMode === 'glove' ? 'px-5 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
        } bg-gray-50 dark:bg-gray-700 rounded-lg mx-3`}>
          <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100 truncate`}>{profile.full_name}</p>
          <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 truncate`}>{profile.email}</p>
          <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-1`}>
            {profile.role === 'admin' ? '관리자' : '시스템 관리자'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item: any) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onItemClick}
                className={`flex items-center ${
                  touchMode === 'glove' ? 'px-5 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
                } ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div className={`${
        touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
      } border-t border-gray-200 dark:border-gray-700`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center ${
            touchMode === 'glove' ? 'px-5 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
          } border border-gray-300 dark:border-gray-600 rounded-md shadow-sm ${getFullTypographyClass('button', 'base', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </button>
      </div>
    </div>
  )
}