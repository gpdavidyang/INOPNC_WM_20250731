'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  CalendarDays,
  Users,
  Clock
} from 'lucide-react'
import { getAttendanceRecords, getCompanyAttendanceSummary } from '@/app/actions/attendance'
import { getSites } from '@/app/actions/sites'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useFontSize, getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import type { AttendanceCalendarProps, AttendanceRecord } from '@/types/attendance'
import type { Site } from '@/types'

export function AttendanceCalendar({ profile, isPartnerView }: AttendanceCalendarProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [sites, setSites] = useState<Site[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [summary, setSummary] = useState({
    totalDays: 0,
    totalHours: 0,
    totalWorkers: 0
  })

  useEffect(() => {
    loadSites()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedSite || (!isPartnerView && profile.site_id)) {
      loadAttendanceData()
    }
  }, [currentDate, selectedSite, isPartnerView, profile.site_id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSites = async () => {
    const result = await getSites()
    if (result.success && result.data) {
      setSites(result.data as any)
      // Auto-select first site for partner view or user's assigned site
      if (isPartnerView && result.data.length > 0) {
        setSelectedSite(result.data[0].id)
      } else if (profile.site_id) {
        setSelectedSite(profile.site_id)
      }
    }
  }

  const loadAttendanceData = async () => {
    setLoading(true)
    try {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)
      
      if (isPartnerView) {
        // Load company-wide attendance summary
        const result = await getCompanyAttendanceSummary({
          organization_id: profile.organization_id,
          site_id: selectedSite,
          date_from: format(startDate, 'yyyy-MM-dd'),
          date_to: format(endDate, 'yyyy-MM-dd')
        })
        
        if (result.success && result.data) {
          setAttendanceData((result.data.records || []) as any)
          setSummary({
            totalDays: result.data.totalDays || 0,
            totalHours: result.data.totalHours || 0,
            totalWorkers: result.data.totalWorkers || 0
          })
        }
      } else {
        // Load individual attendance records
        const result = await getAttendanceRecords({
          user_id: profile.id,
          site_id: selectedSite || (profile as any).site_id,
          date_from: format(startDate, 'yyyy-MM-dd'),
          date_to: format(endDate, 'yyyy-MM-dd')
        })
        
        if (result.success && result.data) {
          const records = result.data.map((record: any) => ({
            id: record.id,
            date: record.attendance_date,
            site_id: record.site_id,
            site_name: record.site?.name || '',
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time,
            work_hours: record.labor_hours || record.work_hours,
            overtime_hours: record.overtime_hours,
            status: record.status || 'present'
          }))
          setAttendanceData(records)
          
          // Calculate summary for individual
          const totalDays = records.filter((r: any) => r.status === 'present').length
          const totalHours = records.reduce((sum: number, r: any) => sum + (r.work_hours || 0), 0)
          setSummary({
            totalDays,
            totalHours,
            totalWorkers: 1
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Add padding days for calendar grid
  const startPadding = getDay(monthStart)
  const calendarDays = [
    ...Array(startPadding).fill(null),
    ...monthDays
  ]

  const getAttendanceForDate = (date: Date) => {
    return attendanceData.find(record => 
      isSameDay(new Date(record.date), date)
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const getDayContent = (day: Date) => {
    const attendance = getAttendanceForDate(day)
    if (!attendance) return null

    if (isPartnerView) {
      // Show worker count for partner view
      return (
        <div className={getFullTypographyClass('caption', 'xs', isLargeFont)}>
          <div className="font-medium text-blue-600">{attendance.totalWorkers || 0}명</div>
        </div>
      )
    } else {
      // Show individual attendance status
      if (attendance.status === 'present') {
        return (
          <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} space-y-0.5`}>
            <div className="text-green-600 font-medium">출근</div>
            {attendance.work_hours && (
              <div className="text-gray-600">{attendance.work_hours}h</div>
            )}
          </div>
        )
      } else if (attendance.status === 'absent') {
        return (
          <div className={getFullTypographyClass('caption', 'xs', isLargeFont)}>
            <div className="text-red-600 font-medium">결근</div>
          </div>
        )
      } else if (attendance.status === 'holiday') {
        return (
          <div className={getFullTypographyClass('caption', 'xs', isLargeFont)}>
            <div className="text-blue-600 font-medium">휴일</div>
          </div>
        )
      }
    }
    return null
  }

  const selectedSiteInfo = sites.find(s => s.id === (selectedSite || profile.site_id))

  return (
    <div className="space-y-6">
      {/* Site Selection (for multi-site access) */}
      {(isPartnerView || sites.length > 1) && (
        <div className="flex items-center gap-4">
          <Building2 className="h-5 w-5 text-gray-600" />
          <select
            value={selectedSite || profile.site_id || ''}
            onChange={(e) => setSelectedSite(e.target.value)}
            className={`flex-1 rounded-md border border-gray-300 bg-white ${
              touchMode === 'glove' ? 'h-14 px-4 text-base' : 
              touchMode === 'precision' ? 'h-9 px-2 text-sm' : 
              'h-10 px-3 text-base'
            }`}
          >
            {sites.length === 0 && <option value="">현장을 불러오는 중...</option>}
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Calendar Header */}
      <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-semibold`}>
              {format(currentDate, 'yyyy년 MM월')}
            </h2>
            <Button
              variant="outline"
              size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {!isPartnerView && (
            <div className={`flex gap-4 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-600" />
                <span>출근일: {summary.totalDays}일</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span>총 공수: {summary.totalHours}시간</span>
              </div>
            </div>
          )}
          
          {isPartnerView && (
            <div className={`flex gap-4 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span>총 작업자: {summary.totalWorkers}명</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-600" />
                <span>총 근무일: {summary.totalDays}일</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span>총 공수: {summary.totalHours}시간</span>
              </div>
            </div>
          )}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
            <div
              key={day}
              className={cn(
                `bg-gray-50 text-center font-medium ${getFullTypographyClass('body', 'sm', isLargeFont)} ${
                  touchMode === 'glove' ? 'p-3' : 
                  touchMode === 'precision' ? 'p-1.5' : 
                  'p-2'
                }`,
                i === 0 && "text-red-600",
                i === 6 && "text-blue-600"
              )}
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day && isSameMonth(day, currentDate)
            const isToday = day && isSameDay(day, new Date())
            const isSelected = day && selectedDate && isSameDay(day, selectedDate)
            const attendance = day ? getAttendanceForDate(day) : null
            const dayOfWeek = day ? getDay(day) : -1

            return (
              <div
                key={index}
                onClick={() => day && setSelectedDate(day)}
                className={cn(
                  `bg-white cursor-pointer hover:bg-gray-50 transition-colors ${
                    touchMode === 'glove' ? 'p-3 min-h-[100px]' : 
                    touchMode === 'precision' ? 'p-1.5 min-h-[70px]' : 
                    'p-2 min-h-[80px]'
                  }`,
                  !isCurrentMonth && "opacity-30",
                  isToday && "ring-2 ring-blue-500",
                  isSelected && "bg-blue-50",
                  attendance && !isPartnerView && "border-l-4 border-green-500"
                )}
              >
                {day && (
                  <>
                    <div className={cn(
                      `${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium mb-1`,
                      dayOfWeek === 0 && "text-red-600",
                      dayOfWeek === 6 && "text-blue-600"
                    )}>
                      {format(day, 'd')}
                    </div>
                    {loading ? (
                      <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-400`}>...</div>
                    ) : (
                      getDayContent(day)
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        {!isPartnerView && (
          <div className={`mt-4 flex items-center justify-center gap-4 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-l-4 border-green-500"></div>
              <span>출근</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100"></div>
              <span>결근</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100"></div>
              <span>휴일</span>
            </div>
          </div>
        )}
      </Card>

      {/* Site Information */}
      {selectedSiteInfo && (
        <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
          <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4 flex items-center gap-2`}>
            <Building2 className="h-5 w-5" />
            현장 정보
          </h3>
          <div className="space-y-3">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>현장명</p>
              <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium`}>{selectedSiteInfo.name}</p>
              {(selectedSiteInfo as any).code && (
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>({(selectedSiteInfo as any).code})</p>
              )}
            </div>
            
            {selectedSiteInfo.address && (
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 flex items-center gap-1 mb-1`}>
                  <MapPin className="h-3.5 w-3.5" />
                  현장 주소
                </p>
                <p className={getFullTypographyClass('body', 'sm', isLargeFont)}>{selectedSiteInfo.address}</p>
              </div>
            )}
            
            {selectedSiteInfo.start_date && selectedSiteInfo.end_date && (
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 flex items-center gap-1 mb-1`}>
                  <CalendarDays className="h-3.5 w-3.5" />
                  공사 기간
                </p>
                <p className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                  {format(new Date(selectedSiteInfo.start_date), 'yyyy.MM.dd')} ~ 
                  {format(new Date(selectedSiteInfo.end_date), 'yyyy.MM.dd')}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Selected Date Details */}
      {selectedDate && !isPartnerView && (
        <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
          <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>
            {format(selectedDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })} 상세
          </h3>
          {(() => {
            const attendance = getAttendanceForDate(selectedDate)
            if (!attendance) {
              return (
                <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500`}>해당 날짜의 출근 기록이 없습니다.</p>
              )
            }
            
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Badge variant={attendance.status === 'present' ? 'success' : 'secondary'}>
                    {attendance.status === 'present' ? '출근' : 
                     attendance.status === 'absent' ? '결근' : 
                     attendance.status === 'holiday' ? '휴일' : '미정'}
                  </Badge>
                  {attendance.site_name && (
                    <span className="text-sm text-gray-600">
                      현장: {attendance.site_name}
                    </span>
                  )}
                </div>
                
                {attendance.check_in_time && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">출근 시간</p>
                      <p className="font-medium">{attendance.check_in_time}</p>
                    </div>
                    {attendance.check_out_time && (
                      <div>
                        <p className="text-sm text-gray-600">퇴근 시간</p>
                        <p className="font-medium">{attendance.check_out_time}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {attendance.work_hours && (
                  <div>
                    <p className="text-sm text-gray-600">근무 시간</p>
                    <p className="font-medium">{attendance.work_hours}시간</p>
                  </div>
                )}
              </div>
            )
          })()}
        </Card>
      )}
    </div>
  )
}