'use client'

import {
    ChipA,
    ChipB,
    ChipD,
    ElevatedCard,
    getContainerClasses,
    getSectionClasses,
    INOPNCInput,
    MainButton,
    MutedButton,
    PrimaryButton,
    ProminentCard,
    SecondaryButton
} from '@/components/ui'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DashboardContentProps {
  user: any
  profile: any
  taskStats: {
    total: number
    pending: number
    inProgress: number
    completed: number
  }
}

export default function DashboardContent({ user, profile, taskStats }: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Navigation */}
      <nav className="header">
        <div className={getContainerClasses()}>
          <div className="flex justify-between items-center">
            {/* Left side - empty for balance */}
            <div className="w-32"></div>
            
            {/* Center - INOPNC Logo */}
            <div className="flex-1 flex justify-center">
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
            
            {/* Right side - User controls */}
            <div className="flex items-center space-x-4 w-32 justify-end">
              <ThemeToggle />
              <span style={{ color: 'var(--text)' }}>
                안녕하세요, {profile?.full_name || user.email}
              </span>
              <MutedButton 
                size="compact"
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? '로그아웃 중...' : '로그아웃'}
              </MutedButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="app">
        <div className="section">
          {/* Welcome section */}
          <div className={getSectionClasses()}>
            <ProminentCard>
              <h2 className="title-lg mb-4" style={{ color: 'var(--text)' }}>
                대시보드
              </h2>
              
              {/* Task Statistics */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <ElevatedCard>
                  <div className="p-5">
                    <dt className="text-r12 font-medium" style={{ color: 'var(--muted)' }}>
                      전체 작업
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold" style={{ color: 'var(--text)' }}>
                      {taskStats.total}
                    </dd>
                  </div>
                </ElevatedCard>

                <ElevatedCard>
                  <div className="p-5">
                    <dt className="text-r12 font-medium" style={{ color: 'var(--primary)' }}>
                      대기 중
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold" style={{ color: 'var(--primary)' }}>
                      {taskStats.pending}
                    </dd>
                  </div>
                </ElevatedCard>

                <ElevatedCard>
                  <div className="p-5">
                    <dt className="text-r12 font-medium" style={{ color: '#f59e0b' }}>
                      진행 중
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold" style={{ color: '#f59e0b' }}>
                      {taskStats.inProgress}
                    </dd>
                  </div>
                </ElevatedCard>

                <ElevatedCard>
                  <div className="p-5">
                    <dt className="text-r12 font-medium" style={{ color: '#10b981' }}>
                      완료됨
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold" style={{ color: '#10b981' }}>
                      {taskStats.completed}
                    </dd>
                  </div>
                </ElevatedCard>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="title-lg mb-4" style={{ color: 'var(--text)' }}>
                  빠른 작업
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <PrimaryButton 
                    size="field"
                    onClick={() => router.push('/tasks/new')}
                  >
                    새 작업 만들기
                  </PrimaryButton>

                  <SecondaryButton 
                    size="field"
                    onClick={() => router.push('/daily-reports/new')}
                  >
                    일일 보고서 작성
                  </SecondaryButton>

                  <MainButton 
                    size="field"
                    onClick={() => router.push('/materials')}
                  >
                    자재 관리
                  </MainButton>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h3 className="title-lg mb-4" style={{ color: 'var(--text)' }}>
                  최근 활동
                </h3>
                <div className="space-y-3">
                  <div className="row">
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--text)' }}>새 작업이 생성되었습니다</span>
                      <ChipA>완료</ChipA>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--text)' }}>일일 보고서가 제출되었습니다</span>
                      <ChipB>진행</ChipB>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'var(--text)' }}>자재 재고가 업데이트되었습니다</span>
                      <ChipD>정보</ChipD>
                    </div>
                  </div>
                </div>
              </div>
            </ProminentCard>
          </div>

          {/* User Profile Summary */}
          <div className={getSectionClasses()}>
            <ElevatedCard>
              <h3 className="title-lg mb-4" style={{ color: 'var(--text)' }}>
                사용자 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <INOPNCInput
                  label="이름"
                  value={profile?.full_name || 'N/A'}
                  readOnly
                  fullWidth
                />
                
                <INOPNCInput
                  label="역할"
                  value={profile?.role || 'N/A'}
                  readOnly
                  fullWidth
                />
                
                <INOPNCInput
                  label="이메일"
                  type="email"
                  value={user.email || 'N/A'}
                  readOnly
                  fullWidth
                />
                
                <div>
                  <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                    상태
                  </label>
                  <div className="flex items-center">
                    <ChipD>
                      {profile?.status === 'active' ? '활성' : '비활성'}
                    </ChipD>
                  </div>
                </div>
              </div>
            </ElevatedCard>
          </div>
        </div>
      </main>
    </div>
  )
}