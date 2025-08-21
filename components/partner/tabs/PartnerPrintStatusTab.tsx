'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChevronLeft, 
  ChevronRight, 
  Building2
} from 'lucide-react'

interface PartnerPrintStatusTabProps {
  profile: Profile
  sites: any[]
}

interface AttendanceRecord {
  id: string
  work_date: string
  site_name: string
  site_id: string
  labor_hours: number
  worker_count: number
}

export default function PartnerPrintStatusTab({ profile, sites }: PartnerPrintStatusTabProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyStats, setMonthlyStats] = useState({
    totalSites: 0,
    totalDays: 0,
    totalLaborHours: 0
  })

  const supabase = createClient()

  useEffect(() => {
    loadAttendanceData()
  }, [currentMonth, selectedSite])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration
      const mockData: AttendanceRecord[] = []
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      
      // Generate mock attendance records
      for (let day = 1; day <= daysInMonth; day++) {
        if (Math.random() > 0.3) { // 70% chance of work day
          const siteIndex = Math.floor(Math.random() * sites.length)
          const site = sites[siteIndex] || { id: '1', name: '강남 A현장' }
          
          mockData.push({
            id: `${year}-${month}-${day}`,
            work_date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            site_name: site.name || '강남 A현장',
            site_id: site.id || '1',
            labor_hours: Math.random() > 0.2 ? 1.0 : 0.5,
            worker_count: Math.floor(Math.random() * 10) + 5
          })
        }
      }
      
      setAttendanceRecords(mockData)
      
      // Calculate statistics
      const filteredData = selectedSite === 'all' 
        ? mockData 
        : mockData.filter(r => r.site_id === selectedSite)
      
      const uniqueSites = new Set(filteredData.map(r => r.site_id))
      const totalLaborHours = filteredData.reduce((sum, r) => sum + r.labor_hours, 0)
      
      setMonthlyStats({
        totalSites: uniqueSites.size,
        totalDays: filteredData.length,
        totalLaborHours: totalLaborHours
      })
      
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  // Calculate monthly statistics (선택된 월 통계)
  const getMonthlyStatistics = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // Filter records for current month
    const monthRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.work_date)
      return recordDate.getFullYear() === year && recordDate.getMonth() === month
    })
    
    // Apply site filter
    const filteredRecords = selectedSite === 'all'
      ? monthRecords
      : monthRecords.filter(r => r.site_id === selectedSite)
    
    const workDays = filteredRecords.filter(record => 
      record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0
    ).length
    
    const uniqueSites = new Set(
      filteredRecords
        .filter(record => record.site_name && record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0)
        .map(record => record.site_name)
    ).size
    
    const totalLaborHours = filteredRecords
      .filter(record => record.labor_hours !== null && record.labor_hours !== undefined)
      .reduce((sum, record) => sum + (record.labor_hours || 0), 0)

    return {
      workDays,
      uniqueSites,
      totalLaborHours
    }
  }

  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day)
      const dayOfWeek = dayDate.getDay()
      const isSelected = selectedDate ? selectedDate.toDateString() === dayDate.toDateString() : false
      const isToday = new Date().toDateString() === dayDate.toDateString()
      
      // Get attendance for this day
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayRecords = selectedSite === 'all'
        ? attendanceRecords.filter(r => r.work_date === dateStr)
        : attendanceRecords.filter(r => r.work_date === dateStr && r.site_id === selectedSite)
      
      const totalLaborHours = dayRecords.reduce((sum, r) => sum + r.labor_hours, 0)
      const siteName = dayRecords.length > 0 ? dayRecords[0].site_name : null
      
      // Simple background without color coding
      const getDayBackground = (laborHours: number) => {
        if (!laborHours || laborHours === 0) return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      }
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dayDate)}
          className={`h-16 w-full rounded-lg border transition-all touch-manipulation relative flex flex-col items-center justify-start p-2 ${
            isSelected
              ? 'border-blue-500 ring-2 ring-blue-500 bg-white dark:bg-gray-800'
              : isToday
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
              : totalLaborHours > 0
              ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {/* 날짜 숫자 - 일요일은 빨간색, 토요일은 파란색 */}
          <div className={`text-sm font-semibold mb-1 ${
            !isSelected && (
              dayOfWeek === 0 ? 'text-red-500' : 
              dayOfWeek === 6 ? 'text-blue-500' : 
              'text-gray-900 dark:text-gray-100'
            )
          } ${isSelected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
            {day}
          </div>
          
          {/* 공수 정보 */}
          {totalLaborHours > 0 && (
            <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {totalLaborHours.toFixed(2).replace('.00', '')}
            </div>
          )}
          
          {/* 현장명 약어 */}
          {totalLaborHours > 0 && siteName && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-full">
              {siteName.replace(/\s*[A-Z]?현장$/g, '').slice(0, 4)}
            </div>
          )}
        </button>
      )
    }
    
    return days
  }


  return (
    <div className="space-y-4">
      {/* Site Selector - Matching Manager's Style */}
      <div className="relative">
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 h-8 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">전체 현장</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        <Building2 className="absolute left-2 top-2 h-3 w-3 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>

      {/* Calendar - Exactly matching screenshot */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth('prev')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </h3>
          
          <button
            onClick={() => changeMonth('next')}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      {/* Monthly Statistics - Exactly matching screenshot */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">월간 통계</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {getMonthlyStatistics().workDays}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">작업일</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {getMonthlyStatistics().uniqueSites}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">현장수</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {getMonthlyStatistics().totalLaborHours.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">총공수</div>
          </div>
        </div>
      </div>

    </div>
  )
}