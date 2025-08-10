'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AttendanceView } from './attendance-view'
import { SalaryView } from './salary-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { cn } from '@/lib/utils'

interface AttendancePageClientProps {
  profile: any
  isPartnerCompany: boolean
}

export function AttendancePageClient({ profile, isPartnerCompany }: AttendancePageClientProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [activeTab, setActiveTab] = useState('attendance')

  console.log('AttendancePageClient: Received profile:', {
    hasProfile: !!profile,
    profileId: profile?.id,
    profileRole: profile?.role,
    profileFullName: profile?.full_name,
    isPartnerCompany
  })

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <div className="p-3">
        {/* INOPNC 로고 헤더 */}
        <div className="flex items-center justify-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Image
              src="/INOPNC_logo.png"
              alt="INOPNC 로고"
              width={32}
              height={32}
              className="object-contain"
            />
            <h1 className={cn(
              "font-semibold text-gray-900 dark:text-white",
              isLargeFont ? "text-lg" : "text-base"
            )}>
              INOPNC
            </h1>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* UI Guidelines에 맞는 탭 디자인 */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab('attendance')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
                "min-h-[48px]", // UI Guidelines 표준 버튼 높이
                activeTab === 'attendance' 
                  ? "bg-toss-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                touchMode === 'glove' && "min-h-[60px] text-base",
                touchMode === 'precision' && "min-h-[44px] text-sm",
                touchMode !== 'precision' && touchMode !== 'glove' && "text-sm"
              )}
            >
              출근정보
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
                "min-h-[48px]", // UI Guidelines 표준 버튼 높이
                activeTab === 'salary' 
                  ? "bg-toss-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                touchMode === 'glove' && "min-h-[60px] text-base",
                touchMode === 'precision' && "min-h-[44px] text-sm",
                touchMode !== 'precision' && touchMode !== 'glove' && "text-sm"
              )}
            >
              급여정보
            </button>
          </div>

          <TabsContent value="attendance" className="mt-0">
            <AttendanceView profile={profile} />
          </TabsContent>

          <TabsContent value="salary" className="mt-0">
            <SalaryView profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}