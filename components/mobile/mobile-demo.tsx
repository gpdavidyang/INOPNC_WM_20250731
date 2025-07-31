'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import MobileSidebar from './mobile-sidebar'
import MobileBottomNav from './mobile-bottom-nav'
import MobileHeader from './mobile-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, Users, FileText, AlertCircle, TrendingUp, CheckCircle, Edit3, User, Settings as SettingsIcon } from 'lucide-react'
import { useFontSize } from '@/providers/font-size-provider'
import { FontSizeToggleCompact } from './font-size-toggle'
import { cn } from '@/lib/utils'

// Sample profile data
const sampleProfile: Profile = {
  id: '1',
  email: 'worker@inopnc.com',
  full_name: '김건설',
  phone: '010-1234-5678',
  role: 'worker',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export default function MobileDemo() {
  const [activeTab, setActiveTab] = useState('home')
  const { isLargeFont } = useFontSize()

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeContent />
      case 'attendance':
        return <AttendanceContent />
      case 'daily-reports':
        return <DailyReportsContent />
      case 'documents':
        return <DocumentsContent />
      case 'shared-documents':
        return <SharedDocumentsContent />
      case 'drawing-tools':
        return <DrawingToolsContent />
      case 'my-info':
        return <MyInfoContent />
      case 'more':
        return <MoreContent onTabChange={setActiveTab} />
      case 'settings':
        return <SettingsContent />
      default:
        return <HomeContent />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
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
      <main className={cn(
        "pb-20 px-4",
        isLargeFont ? "pt-24" : "pt-16"
      )}>
        <div className="max-w-md mx-auto">
          {renderContent()}
        </div>
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
    'attendance': '출력현황',
    'daily-reports': '작업일지',
    'documents': '내문서함',
    'shared-documents': '공유문서함',
    'drawing-tools': '도면 마킹 도구',
    'my-info': '내정보',
    'user-management': '사용자 관리',
    'statistics': '통계 대시보드',
    'settings': '설정',
    'more': '더보기'
  }
  return titles[tab] || '홈'
}

// Content Components
function HomeContent() {
  const { isLargeFont } = useFontSize()
  
  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <Card className="p-5 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 shadow-lg">
        <h2 className={cn(
          "font-bold text-white",
          isLargeFont ? "text-3xl" : "text-xl"
        )}>안녕하세요, 김건설님!</h2>
        <p className={cn(
          "text-blue-50 mt-1",
          isLargeFont ? "text-lg" : "text-sm"
        )}>오늘도 안전한 작업 되세요.</p>
      </Card>

      {/* Today's Info */}
      <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className={cn(
          "font-bold mb-4 text-gray-900 dark:text-white",
          isLargeFont ? "text-2xl" : "text-lg"
        )}>오늘의 현장 정보</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className={cn(
              "font-medium text-gray-700 dark:text-gray-200",
              isLargeFont ? "text-lg" : "text-sm"
            )}>강남 오피스 신축공사 현장</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className={cn(
              "font-medium text-gray-700 dark:text-gray-200",
              isLargeFont ? "text-lg" : "text-sm"
            )}>2024년 7월 31일 (수)</span>
          </div>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-3">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className={cn(
              "font-medium text-gray-700 dark:text-gray-200",
              isLargeFont ? "text-lg" : "text-sm"
            )}>출근: 08:00 / 퇴근: 18:00</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="full" className={cn(
          "flex-col bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all",
          isLargeFont ? "h-32" : "h-24"
        )}>
          <div className={cn(
            "bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2",
            isLargeFont ? "w-16 h-16" : "w-12 h-12"
          )}>
            <FileText className={cn(
              "text-blue-600 dark:text-blue-400",
              isLargeFont ? "h-8 w-8" : "h-6 w-6"
            )} />
          </div>
          <span className={cn(
            "font-medium text-gray-700 dark:text-gray-200",
            isLargeFont ? "text-lg" : "text-sm"
          )}>작업일지 작성</span>
        </Button>
        <Button variant="outline" size="full" className={cn(
          "flex-col bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all",
          isLargeFont ? "h-32" : "h-24"
        )}>
          <div className={cn(
            "bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2",
            isLargeFont ? "w-16 h-16" : "w-12 h-12"
          )}>
            <Clock className={cn(
              "text-green-600 dark:text-green-400",
              isLargeFont ? "h-8 w-8" : "h-6 w-6"
            )} />
          </div>
          <span className={cn(
            "font-medium text-gray-700 dark:text-gray-200",
            isLargeFont ? "text-lg" : "text-sm"
          )}>출근 체크</span>
        </Button>
      </div>

      {/* Notifications */}
      <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className={cn(
          "font-bold mb-4 text-gray-900 dark:text-white",
          isLargeFont ? "text-2xl" : "text-lg"
        )}>알림</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-semibold text-gray-900 dark:text-gray-100",
                isLargeFont ? "text-lg" : "text-sm"
              )}>안전교육 예정</p>
              <p className={cn(
                "text-gray-600 dark:text-gray-300 mt-0.5",
                isLargeFont ? "text-base" : "text-xs"
              )}>내일 오전 9시 안전교육이 있습니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-semibold text-gray-900 dark:text-gray-100",
                isLargeFont ? "text-lg" : "text-sm"
              )}>작업일지 승인됨</p>
              <p className={cn(
                "text-gray-600 dark:text-gray-300 mt-0.5",
                isLargeFont ? "text-base" : "text-xs"
              )}>7월 30일 작업일지가 승인되었습니다.</p>
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
      <Button variant="primary" size="full" className="shadow-lg">
        <FileText className="h-5 w-5 mr-2" />
        새 작업일지 작성
      </Button>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">2024년 7월 {31 - i}일 작업일지</h4>
              <span className="text-xs px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium rounded-full">승인됨</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">철근 콘크리트 작업 - 3층 기둥 타설</p>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <span>작성자: 김건설</span>
              <span className="mx-2">•</span>
              <span>승인자: 박관리</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function AttendanceContent() {
  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 shadow-lg">
        <h3 className="text-lg font-bold mb-4 text-white">이번 달 근무 현황</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <p className="text-sm text-blue-100">총 근무일</p>
            <p className="text-2xl font-bold text-white mt-1">22일</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-4">
            <p className="text-sm text-blue-100">예상 급여</p>
            <p className="text-2xl font-bold text-white mt-1">2,860,000원</p>
          </div>
        </div>
      </Card>

      <Button variant="primary" size="full" className="shadow-lg">
        <Clock className="h-5 w-5 mr-2" />
        오늘 출근 체크하기
      </Button>

      <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">최근 출근 기록</h3>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">7월 {31 - i}일 (수)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">08:00 - 18:00</p>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">정상출근</span>
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
      <Button variant="outline" size="full" className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <span className="text-sm font-medium">새 문서 업로드</span>
        </div>
      </Button>
      
      <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">내 문서</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70 rounded-lg transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">근로계약서</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">2024.01.15</p>
            </div>
            <span className="text-gray-400 dark:text-gray-500">›</span>
          </div>
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70 rounded-lg transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">안전교육 수료증</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">2024.03.20</p>
            </div>
            <span className="text-gray-400 dark:text-gray-500">›</span>
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

function DrawingToolsContent() {
  const { isLargeFont } = useFontSize()
  
  return (
    <div className="space-y-4">
      <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className={cn(
          "font-bold mb-4 text-gray-900 dark:text-white",
          isLargeFont ? "text-2xl" : "text-lg"
        )}>도면 마킹 도구</h3>
        <div className="space-y-3">
          <Button variant="primary" size="full" className="shadow-lg">
            <Edit3 className="h-5 w-5 mr-2" />
            새 도면 마킹 시작
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="full" className={cn(
              "flex-col bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all",
              isLargeFont ? "h-32" : "h-24"
            )}>
              <div className={cn(
                "bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-2",
                isLargeFont ? "w-16 h-16" : "w-12 h-12"
              )}>
                <Edit3 className={cn(
                  "text-orange-600 dark:text-orange-400",
                  isLargeFont ? "h-8 w-8" : "h-6 w-6"
                )} />
              </div>
              <span className={cn(
                "font-medium text-gray-700 dark:text-gray-200",
                isLargeFont ? "text-lg" : "text-sm"
              )}>펜 도구</span>
            </Button>
            
            <Button variant="outline" size="full" className={cn(
              "flex-col bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all",
              isLargeFont ? "h-32" : "h-24"
            )}>
              <div className={cn(
                "bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2",
                isLargeFont ? "w-16 h-16" : "w-12 h-12"
              )}>
                <FileText className={cn(
                  "text-green-600 dark:text-green-400",
                  isLargeFont ? "h-8 w-8" : "h-6 w-6"
                )} />
              </div>
              <span className={cn(
                "font-medium text-gray-700 dark:text-gray-200",
                isLargeFont ? "text-lg" : "text-sm"
              )}>텍스트 추가</span>
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className={cn(
          "font-bold mb-4 text-gray-900 dark:text-white",
          isLargeFont ? "text-2xl" : "text-lg"
        )}>최근 마킹 내역</h3>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900/70 rounded-lg transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                <Edit3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-semibold text-gray-900 dark:text-gray-100",
                  isLargeFont ? "text-lg" : "text-sm"
                )}>3층 평면도 마킹</p>
                <p className={cn(
                  "text-gray-600 dark:text-gray-400 mt-0.5",
                  isLargeFont ? "text-base" : "text-xs"
                )}>2024.7.{31 - i}</p>
              </div>
              <span className="text-gray-400 dark:text-gray-500">›</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function MyInfoContent() {
  const { isLargeFont } = useFontSize()
  
  return (
    <div className="space-y-4">
      <Card className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className={cn(
          "font-bold mb-4 text-gray-900 dark:text-white",
          isLargeFont ? "text-2xl" : "text-lg"
        )}>내 정보</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className={cn(
                "font-bold text-gray-900 dark:text-white",
                isLargeFont ? "text-2xl" : "text-lg"
              )}>김건설</p>
              <p className={cn(
                "text-gray-600 dark:text-gray-400",
                isLargeFont ? "text-lg" : "text-sm"
              )}>작업자</p>
            </div>
          </div>
          
          <div className="border-t dark:border-gray-700 pt-4">
            <div className="space-y-3">
              <div>
                <p className={cn(
                  "text-gray-600 dark:text-gray-400",
                  isLargeFont ? "text-lg" : "text-sm"
                )}>이메일</p>
                <p className={cn(
                  "font-medium text-gray-900 dark:text-white",
                  isLargeFont ? "text-xl" : "text-base"
                )}>worker@inopnc.com</p>
              </div>
              <div>
                <p className={cn(
                  "text-gray-600 dark:text-gray-400",
                  isLargeFont ? "text-lg" : "text-sm"
                )}>연락처</p>
                <p className={cn(
                  "font-medium text-gray-900 dark:text-white",
                  isLargeFont ? "text-xl" : "text-base"
                )}>010-1234-5678</p>
              </div>
              <div>
                <p className={cn(
                  "text-gray-600 dark:text-gray-400",
                  isLargeFont ? "text-lg" : "text-sm"
                )}>소속 현장</p>
                <p className={cn(
                  "font-medium text-gray-900 dark:text-white",
                  isLargeFont ? "text-xl" : "text-base"
                )}>강남 오피스 신축공사 현장</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <button className={cn(
          "w-full text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 flex items-center justify-between transition-colors",
          isLargeFont ? "text-lg p-5" : "text-sm p-4"
        )}>
          <span className="font-medium text-gray-900 dark:text-gray-100">프로필 수정</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
        <div className="border-t dark:border-gray-700" />
        <button className={cn(
          "w-full text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 flex items-center justify-between transition-colors",
          isLargeFont ? "text-lg p-5" : "text-sm p-4"
        )}>
          <span className="font-medium text-gray-900 dark:text-gray-100">비밀번호 변경</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
      </Card>
    </div>
  )
}

function SettingsContent() {
  const { isLargeFont } = useFontSize()
  
  return (
    <div className="space-y-4">
      <Card className="p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* 큰글씨 설정 추가 */}
        <div className="p-4">
          <FontSizeToggleCompact />
        </div>
        <div className="border-t dark:border-gray-700" />
        <button className={cn(
          "w-full text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 flex items-center justify-between transition-colors",
          isLargeFont ? "text-lg p-5" : "text-sm p-4"
        )}>
          <span className="font-medium text-gray-900 dark:text-gray-100">알림 설정</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
        <div className="border-t dark:border-gray-700" />
        <button className={cn(
          "w-full text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 flex items-center justify-between transition-colors",
          isLargeFont ? "text-lg p-5" : "text-sm p-4"
        )}>
          <span className="font-medium text-gray-900 dark:text-gray-100">비밀번호 변경</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
        <div className="border-t dark:border-gray-700" />
        <button className={cn(
          "w-full text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 flex items-center justify-between transition-colors",
          isLargeFont ? "text-lg p-5" : "text-sm p-4"
        )}>
          <span className="font-medium text-gray-900 dark:text-gray-100">언어 설정</span>
          <span className="text-gray-400 dark:text-gray-500">›</span>
        </button>
      </Card>

      <Card className="p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <p className={cn(
          "text-gray-600 dark:text-gray-400",
          isLargeFont ? "text-lg" : "text-sm"
        )}>버전 정보</p>
        <p className={cn(
          "font-medium text-gray-900 dark:text-gray-100 mt-1",
          isLargeFont ? "text-xl" : "text-base"
        )}>INOPNC WM v1.0.0</p>
      </Card>
    </div>
  )
}