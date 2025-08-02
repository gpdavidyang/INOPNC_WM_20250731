'use client'

import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AttendanceCalendar } from '@/components/attendance/attendance-calendar'
import { SalaryInfo } from '@/components/attendance/salary-info'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useFontSize, getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface AttendancePageClientProps {
  profile: any
  isPartnerCompany: boolean
}

export function AttendancePageClient({ profile, isPartnerCompany }: AttendancePageClientProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-semibold text-gray-900`}>
          출근현황
        </h1>
        <p className={`mt-1 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
          {isPartnerCompany 
            ? '소속 회사 작업자들의 출근 현황을 확인합니다'
            : '나의 출근 및 급여 정보를 확인합니다'
          }
        </p>
      </div>

      <div className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className={`grid w-full grid-cols-2 ${
            touchMode === 'glove' ? 'h-14' : 
            touchMode === 'precision' ? 'h-10' : 
            'h-12'
          }`}>
            <TabsTrigger value="attendance" className={`${
              getFullTypographyClass('button', 'base', isLargeFont)
            } ${
              touchMode === 'glove' ? 'py-3' : 
              touchMode === 'precision' ? 'py-1.5' : 
              'py-2'
            }`}>
              출근 정보
            </TabsTrigger>
            <TabsTrigger value="salary" className={`${
              getFullTypographyClass('button', 'base', isLargeFont)
            } ${
              touchMode === 'glove' ? 'py-3' : 
              touchMode === 'precision' ? 'py-1.5' : 
              'py-2'
            }`}>
              급여 정보
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <AttendanceCalendar 
                profile={profile}
                isPartnerView={isPartnerCompany}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="salary" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <SalaryInfo 
                profile={profile}
                isPartnerView={isPartnerCompany}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}