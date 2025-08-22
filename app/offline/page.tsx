'use client'

import { ElevatedCard, getContainerClasses, getSectionClasses, PrimaryButton, SecondaryButton } from '@/components/ui'
import { Calendar, FileText, Home, RefreshCw, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-redirect when back online
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/dashboard')
    } else {
      // Try to reload the page
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className={getContainerClasses()}>
        <div className={getSectionClasses()}>
          <div className="max-w-md w-full text-center">
            {/* Status Icon */}
            <div className="mb-6">
              {isOnline ? (
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--success-bg)' }}>
                  <RefreshCw className="h-10 w-10 animate-spin" style={{ color: 'var(--success)' }} />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: 'var(--muted-bg)' }}>
                  <WifiOff className="h-10 w-10" style={{ color: 'var(--muted)' }} />
                </div>
              )}
            </div>

            {/* Status Message */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                {isOnline ? '연결 복구 중...' : '오프라인 모드'}
              </h1>
              <p style={{ color: 'var(--muted)' }}>
                {isOnline 
                  ? '인터넷 연결이 복구되었습니다. 잠시만 기다려주세요.'
                  : '인터넷 연결을 확인할 수 없습니다. 일부 기능은 오프라인에서도 사용 가능합니다.'
                }
              </p>
            </div>

            {/* Offline Features */}
            {!isOnline && (
              <ElevatedCard className="mb-8 p-4">
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                  오프라인에서 가능한 기능
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--muted)' }}>
                    <FileText className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                    <span>저장된 작업일지 보기</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--muted)' }}>
                    <Calendar className="h-4 w-4" style={{ color: 'var(--success)' }} />
                    <span>출력현황 기록 (동기화 대기)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--muted)' }}>
                    <Home className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                    <span>현장정보 확인</span>
                  </div>
                </div>
              </ElevatedCard>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <PrimaryButton
                onClick={handleRetry}
                disabled={isOnline}
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isOnline ? 'animate-spin' : ''}`} />
                {isOnline ? '연결 중...' : '다시 시도'}
              </PrimaryButton>

              {!isOnline && (
                <SecondaryButton
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  오프라인으로 계속하기
                </SecondaryButton>
              )}
            </div>

            {/* Tips */}
            {!isOnline && (
              <div className="mt-6 p-3 rounded-lg border" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'var(--warning)' }}>
                <p className="text-sm" style={{ color: 'var(--warning-text)' }}>
                  💡 오프라인에서 작성한 데이터는 인터넷 연결 시 자동으로 동기화됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}