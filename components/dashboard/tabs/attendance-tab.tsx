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
  Building2
} from 'lucide-react'

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
  
  const supabase = createClient()

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  useEffect(() => {
    loadData()
  }, [selectedDate, selectedSite])

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
          work_date: '2024-08-01',
          check_in_time: '08:00',
          check_out_time: '17:00',
          site_name: '강남 A현장',
          status: 'present',
          hours_worked: 8,
          overtime_hours: 0
        },
        {
          id: '2',
          work_date: '2024-07-31',
          check_in_time: '08:15',
          check_out_time: '18:00',
          site_name: '강남 A현장',
          status: 'late',
          hours_worked: 8.75,
          overtime_hours: 1
        },
        {
          id: '3',
          work_date: '2024-07-30',
          site_name: '강남 A현장',
          status: 'absent'
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
          month: '2024-07',
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
          month: '2024-06',
          basic_salary: 3000000,
          overtime_pay: 350000,
          allowances: 200000,
          deductions: 180000,
          total_pay: 3370000,
          work_days: 21,
          site_name: '강남 A현장'
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
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dayDate)}
          className={`h-8 w-8 rounded-full text-sm font-medium transition-colors touch-manipulation ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isToday
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          } ${
            dayRecord ? 'relative' : ''
          }`}
        >
          {day}
          {dayRecord && (
            <div className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full ${
              dayRecord.status === 'present' ? 'bg-green-500' :
              dayRecord.status === 'absent' ? 'bg-red-500' :
              dayRecord.status === 'late' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}></div>
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

            {/* Today Button */}
            <div className="flex items-end">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
              >
                오늘
              </button>
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

              {/* Selected Date Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  선택된 날짜: {selectedDate.toLocaleDateString('ko-KR')}
                </h4>
                
                {/* Site Information Summary */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">현장명:</span> {sites.find(s => s.id === selectedSite)?.name || '전체 현장'}</p>
                  {sites.find(s => s.id === selectedSite) && (
                    <p><span className="font-medium">위치:</span> {sites.find(s => s.id === selectedSite)?.address}</p>
                  )}
                </div>
              </div>

              {/* Attendance Records */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">데이터를 불러오는 중...</p>
                  </div>
                ) : (
                  attendanceRecords.map((record: any) => (
                    <div key={record.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                            {getStatusText(record.status)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(record.work_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">현장: {record.site_name}</p>
                          {record.check_in_time && (
                            <p className="text-gray-600 dark:text-gray-400">출근: {record.check_in_time}</p>
                          )}
                        </div>
                        <div>
                          {record.check_out_time && (
                            <p className="text-gray-600 dark:text-gray-400">퇴근: {record.check_out_time}</p>
                          )}
                          {record.hours_worked && (
                            <p className="text-gray-600 dark:text-gray-400">근무시간: {record.hours_worked}h</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
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
                      <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors">
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