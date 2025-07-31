'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import MobileSidebar from './mobile-sidebar'
import MobileBottomNav from './mobile-bottom-nav'
import MobileHeader from './mobile-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users, FileText, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react'

// Sample profile data
const sampleProfile: Profile = {
  id: '1',
  user_id: '1',
  email: 'worker@inopnc.com',
  full_name: '김건설',
  phone: '010-1234-5678',
  role: 'worker',
  organization_id: '1',
  site_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export default function MobileDemo() {
  const [activeTab, setActiveTab] = useState('home')

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeContent />
      case 'daily-reports':
        return <DailyReportsContent />
      case 'attendance':
        return <AttendanceContent />
      case 'documents':
        return <DocumentsContent />
      case 'more':
        return <MoreContent onTabChange={setActiveTab} />
      case 'site-info':
        return <SiteInfoContent />
      case 'shared-documents':
        return <SharedDocumentsContent />
      case 'settings':
        return <SettingsContent />
      default:
        return <HomeContent />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <MobileSidebar
        profile={sampleProfile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Header */}
      <MobileHeader 
        title={getPageTitle(activeTab)} 
        notificationCount={3}
      />

      {/* Main Content */}
      <main className="pt-16 pb-20 px-4">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav
        profile={sampleProfile}
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

// Content Components
function HomeContent() {
  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">안녕하세요, 김건설님!</h2>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">오늘도 안전한 작업 되세요.</p>
      </Card>

      {/* Today's Info */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-gray-100">오늘의 현장 정보</h3>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="dark:text-gray-300">강남 오피스 신축공사 현장</span>
          </div>
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="dark:text-gray-300">2024년 7월 31일 (수)</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="dark:text-gray-300">출근: 08:00 / 퇴근: 18:00</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="full" className="h-20 flex-col">
          <FileText className="h-6 w-6 mb-1" />
          <span className="text-sm">작업일지 작성</span>
        </Button>
        <Button variant="outline" size="full" className="h-20 flex-col">
          <Clock className="h-6 w-6 mb-1" />
          <span className="text-sm">출근 체크</span>
        </Button>
      </div>

      {/* Notifications */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-gray-100">알림</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium dark:text-gray-100">안전교육 예정</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">내일 오전 9시 안전교육이 있습니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium dark:text-gray-100">작업일지 승인됨</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">7월 30일 작업일지가 승인되었습니다.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function DailyReportsContent() {
  return (
    <div className="space-y-4">
      <Button variant="primary" size="full">
        새 작업일지 작성
      </Button>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium dark:text-gray-100">2024년 7월 {31 - i}일 작업일지</h4>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">승인됨</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">철근 콘크리트 작업 - 3층 기둥 타설</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">작성자: 김건설 / 승인자: 박관리</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AttendanceContent() {
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-semibold mb-2 dark:text-gray-100">이번 달 근무 현황</h3>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">총 근무일</p>
            <p className="text-xl font-bold dark:text-gray-100">22일</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">예상 급여</p>
            <p className="text-xl font-bold dark:text-gray-100">2,860,000원</p>
          </div>
        </div>
      </Card>

      <Button variant="primary" size="full">
        오늘 출근 체크하기
      </Button>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-gray-100">최근 출근 기록</h3>
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-0">
              <div>
                <p className="text-sm font-medium dark:text-gray-100">7월 {31 - i}일 (수)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">08:00 - 18:00</p>
              </div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">정상출근</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function DocumentsContent() {
  return (
    <div className="space-y-4">
      <Button variant="outline" size="full">
        새 문서 업로드
      </Button>
      
      <Card className="p-4">
        <h3 className="font-semibold mb-3">내 문서</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm font-medium">근로계약서</p>
                <p className="text-xs text-gray-500">2024.01.15</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-500 mr-3" />
              <div>
                <p className="text-sm font-medium">안전교육 수료증</p>
                <p className="text-xs text-gray-500">2024.03.20</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MoreContent({ onTabChange }: { onTabChange: (tab: string) => void }) {
  return (
    <div className="space-y-4">
      <Card className="p-1">
        <button
          onClick={() => onTabChange('site-info')}
          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
        >
          <span className="font-medium dark:text-gray-100">현장정보</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
        <div className="border-t" />
        <button
          onClick={() => onTabChange('shared-documents')}
          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
        >
          <span className="font-medium dark:text-gray-100">공유문서함</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
        <div className="border-t" />
        <button
          onClick={() => onTabChange('settings')}
          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
        >
          <span className="font-medium dark:text-gray-100">설정</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
      </Card>
    </div>
  )
}

function SiteInfoContent() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-gray-100">현장 정보</h3>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">현장명</p>
            <p className="font-medium dark:text-gray-100">강남 오피스 신축공사</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">현장 주소</p>
            <p className="font-medium dark:text-gray-100">서울시 강남구 테헤란로 123</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">공사 기간</p>
            <p className="font-medium dark:text-gray-100">2024.01.01 - 2024.12.31</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">현장 관리자</p>
            <p className="font-medium dark:text-gray-100">박관리 (010-5678-1234)</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-gray-100">현장 인원</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="text-sm dark:text-gray-300">전체 작업자</span>
          </div>
          <span className="font-medium dark:text-gray-100">45명</span>
        </div>
      </Card>
    </div>
  )
}

function SharedDocumentsContent() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 dark:text-gray-100">공유 문서</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium dark:text-gray-100">안전 수칙 가이드</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2024.07.15 업데이트</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium dark:text-gray-100">작업 매뉴얼</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2024.06.20 업데이트</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function SettingsContent() {
  return (
    <div className="space-y-4">
      <Card className="p-1">
        <button className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
          <span className="dark:text-gray-100">알림 설정</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
        <div className="border-t" />
        <button className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
          <span className="dark:text-gray-100">비밀번호 변경</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
        <div className="border-t" />
        <button className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between">
          <span className="dark:text-gray-100">언어 설정</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
      </Card>

      <Card className="p-4 bg-gray-50 dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">버전 정보</p>
        <p className="font-medium dark:text-gray-100">INOPNC WM v1.0.0</p>
      </Card>
    </div>
  )
}