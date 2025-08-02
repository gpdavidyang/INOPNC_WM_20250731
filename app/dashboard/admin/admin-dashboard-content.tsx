'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Users, 
  Building2, 
  FileText, 
  DollarSign,
  Package,
  Layers,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export function AdminDashboardContent() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  return (
    <div className={`${
      touchMode === 'glove' ? 'px-5 sm:px-7 lg:px-9 py-10' : touchMode === 'precision' ? 'px-3 sm:px-5 lg:px-7 py-6' : 'px-4 sm:px-6 lg:px-8 py-8'
    }`}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>관리자 대시보드</h1>
        <p className={`mt-2 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300`}>시스템 현황과 주요 지표를 확인하세요</p>
      </div>
      
      <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>전체 사용자</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>24명</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>활성 현장</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>3개</p>
            </div>
            <Building2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>오늘 작업일지</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>12건</p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>승인 대기</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>5건</p>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className={`${
        touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
      }`}>
        <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>빠른 작업</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/admin/users">
            <Button 
              variant="outline" 
              className={`${
                touchMode === 'glove' ? 'h-24' : touchMode === 'precision' ? 'h-16' : 'h-20'
              } flex flex-col items-center justify-center space-y-2 w-full`}
            >
              <Users className="h-6 w-6" />
              <span className={getFullTypographyClass('button', 'base', isLargeFont)}>사용자 관리</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/admin/sites">
            <Button 
              variant="outline" 
              className={`${
                touchMode === 'glove' ? 'h-24' : touchMode === 'precision' ? 'h-16' : 'h-20'
              } flex flex-col items-center justify-center space-y-2 w-full`}
            >
              <Building2 className="h-6 w-6" />
              <span className={getFullTypographyClass('button', 'base', isLargeFont)}>현장 관리</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/admin/salary">
            <Button 
              variant="outline" 
              className={`${
                touchMode === 'glove' ? 'h-24' : touchMode === 'precision' ? 'h-16' : 'h-20'
              } flex flex-col items-center justify-center space-y-2 w-full`}
            >
              <DollarSign className="h-6 w-6" />
              <span className={getFullTypographyClass('button', 'base', isLargeFont)}>급여 관리</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/admin/materials">
            <Button 
              variant="outline" 
              className={`${
                touchMode === 'glove' ? 'h-24' : touchMode === 'precision' ? 'h-16' : 'h-20'
              } flex flex-col items-center justify-center space-y-2 w-full`}
            >
              <Package className="h-6 w-6" />
              <span className={getFullTypographyClass('button', 'base', isLargeFont)}>자재 관리</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/admin/shared-documents">
            <Button 
              variant="outline" 
              className={`${
                touchMode === 'glove' ? 'h-24' : touchMode === 'precision' ? 'h-16' : 'h-20'
              } flex flex-col items-center justify-center space-y-2 w-full`}
            >
              <FileText className="h-6 w-6" />
              <span className={getFullTypographyClass('button', 'base', isLargeFont)}>문서 관리</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/admin/markup">
            <Button 
              variant="outline" 
              className={`${
                touchMode === 'glove' ? 'h-24' : touchMode === 'precision' ? 'h-16' : 'h-20'
              } flex flex-col items-center justify-center space-y-2 w-full`}
            >
              <Layers className="h-6 w-6" />
              <span className={getFullTypographyClass('button', 'base', isLargeFont)}>도면 관리</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`${
          touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
        }`}>
          <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>최근 활동</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>작업일지 승인</p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>김철수 - 강남 A현장 (2분 전)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>신규 사용자 등록</p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>이영희 - 작업자 (10분 전)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>자재 입고</p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>NPC-1000 500kg (1시간 전)</p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
        }`}>
          <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>시스템 상태</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>서버 상태</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}>정상</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>데이터베이스</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}>정상</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>백업 상태</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}>최신</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>스토리지 사용량</span>
              <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>45%</span>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}