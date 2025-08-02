'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Building2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface AttendanceTabProps {
  profile: Profile
}

interface AttendanceRecord {
  id: string
  work_date: string
  check_in_time?: string
  check_out_time?: string
  site_name: string
  status: 'present' | 'absent' | 'late' | 'half_day'
  hours_worked?: number
  overtime_hours?: number
  labor_hours?: number  // 공수 (1.0 = 8 hours)
  notes?: string
}

interface SalaryInfo {
  id: string
  month: string
  basic_salary: number
  overtime_pay: number
  allowances: number
  deductions: number
  total_pay: number
  work_days: number
  site_name: string
}

interface Site {
  id: string
  name: string
  address: string
}

export default function AttendanceTab({ profile }: AttendanceTabProps) {
  const [activeTab, setActiveTab] = useState<'print' | 'salary'>('print')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState<{key: 'work_date' | 'site_name' | 'labor_hours', direction: 'asc' | 'desc'} | null>(null)
  
  const supabase = createClient()

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  useEffect(() => {
    loadData()
  }, [selectedDate, selectedSite, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load sites
      await loadSites()
      
      if (activeTab === 'print') {
        await loadAttendanceData()
      } else {
        await loadSalaryData()
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address')
        .order('name')

      if (!error && data) {
        setSites(data)
      } else {
        // Mock data if no sites available
        setSites([
          { id: '1', name: '강남 A현장', address: '서울시 강남구 테헤란로 123' },
          { id: '2', name: '송파 B현장', address: '서울시 송파구 올림픽로 456' },
          { id: '3', name: '서초 C현장', address: '서울시 서초구 반포대로 789' }
        ])
      }
    } catch (error) {
      console.error('Error loading sites:', error)
      // Mock data fallback
      setSites([
        { id: '1', name: '강남 A현장', address: '서울시 강남구 테헤란로 123' },
        { id: '2', name: '송파 B현장', address: '서울시 송파구 올림픽로 456' }
      ])
    }
  }

  const loadAttendanceData = async () => {
    try {
      // Mock attendance data for demo
      const mockData: AttendanceRecord[] = [
        {
          id: '1',
          work_date: '2025-08-01',
          check_in_time: '08:00',
          check_out_time: '17:00',
          site_name: '강남 A현장',
          status: 'present',
          hours_worked: 8,
          overtime_hours: 0,
          labor_hours: 1.0  // 1.0 공수 = 8시간
        },
        {
          id: '2',
          work_date: '2025-08-02',
          check_in_time: '08:15',
          check_out_time: '19:00',
          site_name: '송파 B현장',
          status: 'present',
          hours_worked: 10,
          overtime_hours: 2,
          labor_hours: 1.5  // 1.5 공수로 수정
        },
        {
          id: '3',
          work_date: '2025-08-05',
          check_in_time: '08:00',
          check_out_time: '12:00',
          site_name: '반포 C현장',
          status: 'present',
          hours_worked: 4,
          labor_hours: 0.5  // 0.5 공수 = 4시간
        },
        {
          id: '4',
          work_date: '2025-08-06',
          check_in_time: '08:00',
          check_out_time: '17:00',
          site_name: '방배 현장',
          status: 'present',
          hours_worked: 8,
          overtime_hours: 0,
          labor_hours: 1.0
        },
        {
          id: '5',
          work_date: '2025-08-13',
          check_in_time: null,
          check_out_time: null,
          site_name: '',
          status: 'holiday',
          hours_worked: 0,
          overtime_hours: 0,
          labor_hours: null  // 휴무일은 null로 처리
        },
        {
          id: '6',
          work_date: '2025-08-27',
          check_in_time: '08:00',
          check_out_time: '17:00',
          site_name: '방배 현장',
          status: 'present',
          hours_worked: 8,
          overtime_hours: 0,
          labor_hours: 1.0
        }
      ]
      
      setAttendanceRecords(mockData)
    } catch (error) {
      console.error('Error loading attendance data:', error)
    }
  }

  const loadSalaryData = async () => {
    try {
      // Mock salary data for demo
      const mockSalaryData: SalaryInfo[] = [
        {
          id: '1',
          month: '2025-07',
          basic_salary: 3000000,
          overtime_pay: 400000,
          allowances: 200000,
          deductions: 180000,
          total_pay: 3420000,
          work_days: 22,
          site_name: '강남 A현장'
        },
        {
          id: '2',
          month: '2025-06',
          basic_salary: 3000000,
          overtime_pay: 350000,
          allowances: 200000,
          deductions: 180000,
          total_pay: 3370000,
          work_days: 21,
          site_name: '강남 A현장'
        },
        {
          id: '3',
          month: '2025-05',
          basic_salary: 2800000,
          overtime_pay: 320000,
          allowances: 200000,
          deductions: 160000,
          total_pay: 3160000,
          work_days: 20,
          site_name: '송파 B현장'
        }
      ]
      
      setSalaryInfo(mockSalaryData)
    } catch (error) {
      console.error('Error loading salary data:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'late':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'half_day':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return '출근'
      case 'absent': return '결근'
      case 'late': return '지각'
      case 'half_day': return '반차'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-50 text-green-700 border-green-200'
      case 'absent': return 'bg-red-50 text-red-700 border-red-200'
      case 'late': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'half_day': return 'bg-blue-50 text-blue-700 border-blue-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const downloadSalaryPDF = (salary: SalaryInfo) => {
    try {
      // Create new PDF document
      const doc = new jsPDF()
      
      // Title
      doc.setFontSize(18)
      doc.text('Salary Statement', 105, 30, { align: 'center' })
      
      // Date
      const [year, month] = salary.month.split('-')
      doc.setFontSize(14)
      doc.text(`${year}/${month}`, 105, 45, { align: 'center' })
      
      // Company and employee info
      doc.setFontSize(12)
      doc.text('INOPNC Construction', 20, 65)
      doc.text(`Employee: ${profile.name || 'N/A'}`, 20, 75)
      doc.text(`Site: ${salary.site_name}`, 20, 85)
      doc.text(`Work Days: ${salary.work_days}`, 20, 95)
      
      // Simple table without autoTable
      let yPos = 120
      const lineHeight = 15
      
      // Table header
      doc.setFontSize(12)
      doc.text('Item', 20, yPos)
      doc.text('Amount', 150, yPos)
      
      // Draw line under header
      doc.line(20, yPos + 3, 190, yPos + 3)
      yPos += lineHeight
      
      // Table rows
      doc.setFontSize(10)
      const salaryItems = [
        ['Basic Salary', formatCurrency(salary.basic_salary)],
        ['Overtime Pay', formatCurrency(salary.overtime_pay)],
        ['Allowances', formatCurrency(salary.allowances)],
        ['Deductions', `-${formatCurrency(salary.deductions)}`],
        ['Total Pay', formatCurrency(salary.total_pay)]
      ]
      
      salaryItems.forEach(([item, amount]) => {
        doc.text(item, 20, yPos)
        doc.text(amount, 150, yPos)
        yPos += lineHeight
      })
      
      // Draw line above total
      doc.line(20, yPos - lineHeight - 3, 190, yPos - lineHeight - 3)
      
      // Footer
      doc.setFontSize(8)
      doc.text('Generated by INOPNC Work Management System', 105, yPos + 20, { align: 'center' })
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, yPos + 30, { align: 'center' })
      
      // Download PDF
      const fileName = `salary_${year}_${month}_${salary.site_name.replace(/\s+/g, '_')}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('PDF 생성 중 오류가 발생했습니다.')
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(today)
  }

  // Sorting functions
  const handleSort = (key: 'work_date' | 'site_name' | 'labor_hours') => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortedRecords = () => {
    if (!sortConfig) return attendanceRecords

    return [...attendanceRecords].sort((a, b) => {
      const { key, direction } = sortConfig
      let aValue: any, bValue: any

      switch (key) {
        case 'work_date':
          aValue = new Date(a.work_date)
          bValue = new Date(b.work_date)
          break
        case 'site_name':
          aValue = a.site_name || ''
          bValue = b.site_name || ''
          break
        case 'labor_hours':
          aValue = a.labor_hours || 0
          bValue = b.labor_hours || 0
          break
        default:
          return 0
      }

      if (direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  const getSortIcon = (key: 'work_date' | 'site_name' | 'labor_hours') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="h-3 w-3 text-gray-400" />
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />
  }

  // Calculate statistics
  const getStatistics = () => {
    const workDays = attendanceRecords.filter(record => 
      record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0
    ).length
    
    const uniqueSites = new Set(
      attendanceRecords
        .filter(record => record.site_name && record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0)
        .map(record => record.site_name)
    ).size
    
    const totalLaborHours = attendanceRecords
      .filter(record => record.labor_hours !== null && record.labor_hours !== undefined)
      .reduce((sum, record) => sum + (record.labor_hours || 0), 0)

    return {
      workDays,
      uniqueSites,
      totalLaborHours,
      totalDays: attendanceRecords.length
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      const isSelected = selectedDate.toDateString() === dayDate.toDateString()
      const isToday = new Date().toDateString() === dayDate.toDateString()
      
      // Check if there's attendance data for this day
      const dayRecord = attendanceRecords.find(record => 
        new Date(record.work_date).toDateString() === dayDate.toDateString()
      )
      
      // Simple background without color coding
      const getDayBackground = (laborHours: number | undefined) => {
        if (!laborHours || laborHours === 0) return 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      }
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dayDate)}
          className={`h-20 w-full rounded-lg text-xs font-medium transition-colors touch-manipulation relative flex flex-col items-center justify-start p-1 ${
            isSelected
              ? 'bg-blue-600 text-white'
              : dayRecord && dayRecord.labor_hours !== undefined
              ? getDayBackground(dayRecord.labor_hours)
              : isToday
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          {/* 날짜 숫자 */}
          <div className="text-lg font-bold">{day}</div>
          
          {/* 공수 정보 */}
          {dayRecord && dayRecord.labor_hours !== undefined && dayRecord.labor_hours !== null && (
            <div className={`text-xs font-bold mt-1 ${
              isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-200'
            }`}>
              {dayRecord.labor_hours.toFixed(1)}
            </div>
          )}
          
          {/* 현장명 정보 */}
          {dayRecord && dayRecord.labor_hours !== undefined && dayRecord.labor_hours !== null && (
            <div className={`text-xs text-center leading-tight mt-0.5 px-1 max-w-full ${
              isSelected ? 'text-white' : 'text-blue-600 dark:text-blue-400'
            }`}>
              {dayRecord.site_name ? (
                <div className="truncate">
                  {dayRecord.site_name.replace(/\s*[A-Z]?현장$/g, '')}
                </div>
              ) : ''}
            </div>
          )}
          
        </button>
      )
    }
    
    return days
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('print')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'print'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            출력정보
          </button>
          <button
            onClick={() => setActiveTab('salary')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'salary'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            급여정보
          </button>
        </div>

        <div className="p-4">
          {/* Filters */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            {/* Site Selection */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                현장 선택
              </label>
              <div className="relative">
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">전체 현장</option>
                  {sites.map((site: any) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

          </div>

          {activeTab === 'print' ? (
            <div className="space-y-4">
              {/* Calendar */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </h3>
                  
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                
                {/* Legend for calendar */}
                <div className="flex items-center justify-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">근무일</span>
                  </div>
                </div>

                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day: any) => (
                    <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendar()}
                </div>
              </div>

              {/* Statistics Summary - Compact */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">통계 요약</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {getStatistics().workDays}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">작업일수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {getStatistics().uniqueSites}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">참여현장</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {getStatistics().totalLaborHours.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">총 공수</div>
                  </div>
                </div>
              </div>

              {/* Attendance Records - Table Layout */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">데이터를 불러오는 중...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th 
                            onClick={() => handleSort('work_date')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <span>날짜</span>
                              {getSortIcon('work_date')}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('site_name')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <span>현장</span>
                              {getSortIcon('site_name')}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleSort('labor_hours')}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <span>공수</span>
                              {getSortIcon('labor_hours')}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {getSortedRecords().map((record: any) => (
                          <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {new Date(record.work_date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {record.site_name || '미지정'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {record.labor_hours !== null && record.labor_hours !== undefined && record.labor_hours > 0 ? (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  {record.labor_hours.toFixed(1)} 공수
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Salary Info Tab */
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">데이터를 불러오는 중...</p>
                </div>
              ) : (
                salaryInfo.map((salary: any) => (
                  <div key={salary.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {salary.month} 급여명세서
                      </h4>
                      <button 
                        onClick={() => downloadSalaryPDF(salary)}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors hover:bg-blue-50 rounded-lg"
                      >
                        <Download className="h-4 w-4" />
                        다운로드
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">현장</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{salary.site_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">근무일수</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{salary.work_days}일</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">기본급</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(salary.basic_salary)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">연장근무수당</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(salary.overtime_pay)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">제수당</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(salary.allowances)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span>공제액</span>
                        <span className="font-medium">-{formatCurrency(salary.deductions)}</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                        <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-gray-100">
                          <span>실지급액</span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {formatCurrency(salary.total_pay)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}