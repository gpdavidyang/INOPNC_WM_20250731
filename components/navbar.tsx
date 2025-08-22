'use client'

import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface NavbarProps {
  user: any
  profile: any
}

export default function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const navigation = [
    { name: '대시보드', href: '/dashboard' },
    { name: '작업', href: '/tasks' },
    { name: '프로젝트', href: '/projects' },
    { name: '팀원', href: '/team' },
  ]

  return (
    <nav className="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Navigation */}
          <div className="flex items-center space-x-8">
            {navigation.map((item: any) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  pathname === item.href
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                } text-sm font-medium transition-colors duration-200`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Center - INOPNC Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => router.push('/dashboard')}
              className="cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                fontSize: '23px',
                color: 'var(--text)',
                textDecoration: 'none',
                border: 'none',
                background: 'none',
                outline: 'none'
              }}
            >
              INOPNC
            </button>
          </div>
          
          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            <span className="text-sm" style={{ color: 'var(--text)' }}>
              {profile?.full_name || user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 rounded-lg transition-colors duration-200 hover:bg-gray-100"
              style={{ color: 'var(--muted)' }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}