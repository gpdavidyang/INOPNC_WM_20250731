'use client'

import { useState, useEffect } from 'react'
import { getMyAttendance } from '@/app/actions/attendance'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { AttendanceRecord } from '@/types'

interface AttendanceCalendarProps {
  siteId?: string
}

interface AttendanceSummary {
  total_days: number
  total_hours: number
  total_overtime: number
  days_present: number
  days_absent: number
  days_holiday: number
}

export default function AttendanceCalendar({ siteId }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAttendanceData()
  }, [currentDate, siteId])

  const fetchAttendanceData = async () => {
    setLoading(true)
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

      const result = await getMyAttendance({
        start_date: startDate,
        end_date: endDate,
        site_id: siteId
      })

      if (result.success && result.data) {
        setAttendanceData(result.data as any)
        setSummary(result.summary)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const getAttendanceForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return attendanceData.find(record => 
      (record as any).daily_report?.report_date === dateStr
    )
  }

  const getDayStatus = (day: number) => {
    const attendance = getAttendanceForDay(day)
    if (!attendance) return null
    
    if (attendance.status === 'present' && attendance.check_in_time && attendance.check_out_time) {
      return 'complete'
    } else if (attendance.status === 'present' && attendance.check_in_time) {
      return 'incomplete'
    } else if (attendance.status === 'absent') {
      return 'absent'
    } else if (attendance.status === 'holiday') {
      return 'holiday'
    }
    return null
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const formatMonth = () => {
    return currentDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long'
    })
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  // Calculate estimated salary (simplified)
  const estimatedSalary = summary ? Math.round(summary.total_hours * 13000) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 근무일</p>
              <p className="text-2xl font-bold">{summary?.days_present || 0}일</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 근무시간</p>
              <p className="text-2xl font-bold">{summary?.total_hours.toFixed(1) || 0}시간</p>
            </div>
            <Clock className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">초과근무</p>
              <p className="text-2xl font-bold">{summary?.total_overtime.toFixed(1) || 0}시간</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">예상 급여</p>
              <p className="text-2xl font-bold">₩{estimatedSalary.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{formatMonth()}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              오늘
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Week day headers */}
              {weekDays.map(day => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium py-2 ${
                    day === '일' ? 'text-red-600' : day === '토' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getDaysInMonth().map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} />
                }

                const status = getDayStatus(day)
                const attendance = getAttendanceForDay(day)
                const isToday = 
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear()

                return (
                  <div
                    key={day}
                    className={`
                      relative aspect-square p-2 border rounded-lg
                      ${isToday ? 'border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'}
                      ${status === 'complete' ? 'bg-green-50 dark:bg-green-900/20' : ''}
                      ${status === 'incomplete' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                      ${status === 'absent' ? 'bg-red-50 dark:bg-red-900/20' : ''}
                      ${status === 'holiday' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}
                  >
                    <div className="text-sm font-medium">{day}</div>
                    
                    {status && (
                      <div className="absolute bottom-1 right-1">
                        {status === 'complete' && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        {status === 'incomplete' && (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        {status === 'absent' && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    )}

                    {attendance && attendance.work_hours && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {attendance.work_hours.toFixed(1)}h
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>정상출근</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span>퇴근미처리</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>결근</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}