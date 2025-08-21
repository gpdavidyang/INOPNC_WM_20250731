'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">로딩 중...</span>
  </div>
)

// 에러 경계 컴포넌트
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-8 text-center">
    <div className="text-red-600 mb-2">컴포넌트 로딩 중 오류가 발생했습니다</div>
    <button 
      onClick={() => window.location.reload()} 
      className="text-blue-600 hover:underline"
    >
      새로고침
    </button>
  </div>
)

// 지연 로딩할 컴포넌트들
export const LazyWorkLogsTab = dynamic(() => import('./work-logs-tab'), {
  loading: LoadingSpinner,
  ssr: false // 클라이언트에서만 렌더링 (성능 향상)
})

export const LazyDocumentsTab = dynamic(() => import('./documents-tab'), {
  loading: LoadingSpinner,
  ssr: false
})

export const LazyDocumentsTabUnified = dynamic(() => import('./documents-tab-unified'), {
  loading: LoadingSpinner,
  ssr: false
})

export const LazyAttendanceTab = dynamic(() => import('./attendance-tab'), {
  loading: LoadingSpinner,
  ssr: false
})

// 관리자 컴포넌트들 (더 적극적인 지연 로딩)
export const LazyAdminDashboard = dynamic(() => import('./home-tab'), {
  loading: LoadingSpinner,
  ssr: false
})

export const LazyMarkupEditor = dynamic(() => import('../../markup/markup-editor'), {
  loading: LoadingSpinner,
  ssr: false
})

// 성능 향상을 위한 프리로드 함수들
export const preloadWorkLogs = () => import('./work-logs-tab')
export const preloadDocuments = () => import('./documents-tab-unified')
export const preloadAttendance = () => import('./attendance-tab')
export const preloadMarkup = () => import('../../markup/markup-editor')

// 사용자 역할에 따른 프리로드
export const preloadForRole = (role: string) => {
  switch (role) {
    case 'worker':
      preloadWorkLogs()
      preloadAttendance()
      break
    case 'site_manager':
      preloadWorkLogs()
      preloadDocuments()
      preloadAttendance()
      break
    case 'admin':
    case 'system_admin':
      // 관리자 컴포넌트는 필요시에만 로딩
      break
  }
}