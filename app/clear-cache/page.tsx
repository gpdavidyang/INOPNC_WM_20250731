'use client'

import { ElevatedCard, getContainerClasses, getSectionClasses, PrimaryButton } from '@/components/ui'
import { RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function ClearCachePage() {
  const [isClearing, setIsClearing] = useState(false)
  const [result, setResult] = useState<string>('')

  const clearAllCaches = async () => {
    setIsClearing(true)
    setResult('')
    
    try {
      let messages: string[] = []

      // Service Worker 캐시 삭제
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        messages.push(`발견된 캐시: ${cacheNames.length}개`)
        
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        messages.push('✅ Service Worker 캐시 삭제 완료')
      }

      // Service Worker 등록 해제
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(
          registrations.map(registration => registration.unregister())
        )
        messages.push('✅ Service Worker 등록 해제 완료')
      }

      // Local Storage 삭제
      localStorage.clear()
      messages.push('✅ Local Storage 삭제 완료')

      // Session Storage 삭제
      sessionStorage.clear()
      messages.push('✅ Session Storage 삭제 완료')

      // IndexedDB 삭제
      const dbNames = ['supabase-cache', 'keyval-store', 'workbox-precache']
      for (const dbName of dbNames) {
        try {
          const deleteReq = indexedDB.deleteDatabase(dbName)
          await new Promise((resolve, reject) => {
            deleteReq.onsuccess = () => resolve(true)
            deleteReq.onerror = () => reject(deleteReq.error)
          })
          messages.push(`✅ IndexedDB '${dbName}' 삭제 완료`)
        } catch {
          messages.push(`⚠️ IndexedDB '${dbName}' 삭제 실패 (존재하지 않음)`)
        }
      }

      setResult(messages.join('\n'))
      
      // 3초 후 새로고침
      setTimeout(() => {
        window.location.reload()
      }, 3000)
      
    } catch (error) {
      setResult(`❌ 오류 발생: ${error}`)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className={getContainerClasses()}>
        <div className={getSectionClasses()}>
          <ElevatedCard className="max-w-md w-full p-8 space-y-6">
            <div className="text-center">
              <Trash2 className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>PWA 캐시 삭제</h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                모든 PWA 캐시, Service Worker, Local Storage를 삭제합니다.
              </p>
            </div>

            <PrimaryButton
              onClick={clearAllCaches}
              disabled={isClearing}
              className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-red-600 hover:bg-red-700 disabled:bg-red-400"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  삭제 중...
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5" />
                  모든 캐시 삭제
                </>
              )}
            </PrimaryButton>

            {result && (
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--muted-bg)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>삭제 결과:</h3>
                <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--muted)' }}>
                  {result}
                </pre>
                {result.includes('✅') && (
                  <p className="text-green-600 text-sm mt-2 font-medium">
                    3초 후 페이지가 새로고침됩니다...
                  </p>
                )}
              </div>
            )}

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--accent-bg)' }}>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--accent-text)' }}>💡 다른 방법들:</h3>
              <ul className="text-sm space-y-1" style={{ color: 'var(--accent-text)' }}>
                <li>• F12 → Application → Clear Storage</li>
                <li>• Ctrl+Shift+R (하드 새로고침)</li>
                <li>• 시크릿/프라이빗 모드 사용</li>
              </ul>
            </div>
          </ElevatedCard>
        </div>
      </div>
    </div>
  )
}