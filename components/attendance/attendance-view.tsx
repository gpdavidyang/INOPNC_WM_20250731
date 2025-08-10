'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { 
  ChevronLeft,
  ChevronRight,
  Building2,
  BarChart3
} from 'lucide-react'
import { getAttendanceRecords } from '@/app/actions/attendance'
import { getSites } from '@/app/actions/sites'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import type { Site, Profile } from '@/types'
import type { AttendanceRecord } from '@/types/attendance'
import { SalaryView } from './salary-view'

interface AttendanceViewProps {
  profile: Profile
}

interface AttendanceData extends AttendanceRecord {
  work_date: string
  date?: string
  sites?: {
    id: string
    name: string
  }
  site_name?: string
}

interface MonthlyStats {
  totalDays: number
  totalHours: number
  totalLaborHours: number
}

export function AttendanceView({ profile }: AttendanceViewProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [sites, setSites] = useState<Site[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    totalDays: 0,
    totalHours: 0,
    totalLaborHours: 0
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal')

  // Load sites on mount
  useEffect(() => {
    loadSites()
  }, [])

  // Load attendance data when date or site changes
  useEffect(() => {
    if (profile?.id) {
      loadAttendanceData()
    }
  }, [currentDate, selectedSite, profile?.id])

  const loadSites = async () => {
    try {
      const result = await getSites()
      if (result.success && result.data) {
        setSites(result.data as Site[])
        // Auto-select user's site if available
        if (profile?.site_id) {
          setSelectedSite(profile.site_id)
        } else if (result.data.length > 0) {
          setSelectedSite(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }

  const loadAttendanceData = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      const startDate = startOfMonth(currentDate)
      const endDate = endOfMonth(currentDate)
      
      const params = {
        user_id: profile.id,
        site_id: selectedSite === 'all' ? undefined : selectedSite,
        date_from: format(startDate, 'yyyy-MM-dd'),
        date_to: format(endDate, 'yyyy-MM-dd')
      }
      
      const result = await getAttendanceRecords(params)
      
      if (result.success && result.data) {
        setAttendanceData(result.data as AttendanceData[])
        
        // Calculate monthly statistics
        const stats = calculateMonthlyStats(result.data as AttendanceData[])
        setMonthlyStats(stats)
      } else {
        setAttendanceData([])
        setMonthlyStats({ totalDays: 0, totalHours: 0, totalLaborHours: 0 })
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error)
      setAttendanceData([])
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyStats = (data: AttendanceData[]): MonthlyStats => {
    const presentDays = data.filter(d => d.status === 'present' || d.labor_hours > 0)
    const totalDays = presentDays.length
    const totalHours = data.reduce((sum, d) => sum + (d.work_hours || 0), 0)
    const totalLaborHours = data.reduce((sum, d) => sum + (d.labor_hours || 0), 0)
    
    return {
      totalDays,
      totalHours: Math.round(totalHours * 10) / 10,
      totalLaborHours: Math.round(totalLaborHours * 10) / 10
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const getAttendanceForDate = (date: Date): AttendanceData | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return attendanceData.find(record => record.work_date === dateStr)
  }

  // Calendar generation
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  // Add padding days for calendar grid
  const startPadding = getDay(monthStart)
  const calendarDays = [
    ...Array(startPadding).fill(null),
    ...monthDays
  ]

  // Add trailing padding to complete last week
  const totalCells = calendarDays.length
  const trailingPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  const fullCalendarDays = [
    ...calendarDays,
    ...Array(trailingPadding).fill(null)
  ]

  const getDayClass = (attendance: AttendanceData | undefined, day: Date | null) => {
    if (!day) return ''
    
    const baseClass = 'relative'
    const dayOfWeek = getDay(day)
    
    // Weekend coloring
    let textColor = ''
    if (dayOfWeek === 0) textColor = 'text-red-600 dark:text-red-400'
    else if (dayOfWeek === 6) textColor = 'text-blue-600 dark:text-blue-400'
    else textColor = 'text-gray-900 dark:text-gray-100'
    
    // Today highlight
    const todayClass = isToday(day) ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''
    
    // Attendance status with color coding based on labor hours
    let statusClass = ''
    if (attendance && attendance.labor_hours && attendance.labor_hours > 0) {
      if (attendance.labor_hours >= 1.0) {
        statusClass = 'border-l-4 border-green-500'
      } else if (attendance.labor_hours >= 0.5) {
        statusClass = 'border-l-4 border-yellow-500'
      } else {
        statusClass = 'border-l-4 border-orange-500'
      }
    }
    
    return cn(baseClass, textColor, todayClass, statusClass)
  }

  // Function to convert site names to abbreviations
  const getSiteShortName = (siteName: string): string => {
    // Remove common suffixes like "현장", "A현장", "B현장", etc.
    const cleanName = siteName.replace(/\s*[A-Z]?현장\s*$/g, '').trim()
    
    // Common site name abbreviations
    const abbreviations: { [key: string]: string } = {
      '강남': '강남',
      '송파': '송파',
      '방배': '방배',
      '한포': '한포',
      '서초': '서초',
      '잠실': '잠실',
      '압구정': '압구정',
      '청담': '청담',
      '역삼': '역삼',
      '논현': '논현',
      '신사': '신사',
      '도곡': '도곡',
      '개포': '개포',
      '일원': '일원',
      '수서': '수서',
      '대치': '대치'
    }
    
    // Check if the clean name matches any abbreviation
    for (const [fullName, abbrev] of Object.entries(abbreviations)) {
      if (cleanName.includes(fullName)) {
        return abbrev
      }
    }
    
    // If no match, return first 2-3 characters of clean name
    return cleanName.length > 3 ? cleanName.substring(0, 2) : cleanName
  }

  const selectedSiteInfo = sites.find(s => s.id === selectedSite)

  return (
    <div className="space-y-2">
          {/* Site Selection - UI Guidelines Compliant */}
      <Card className="p-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center shrink-0">
            <Building2 className="h-3 w-3 text-gray-600" />
          </div>
          <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
            <CustomSelectTrigger className={cn(
              "flex-1",
              touchMode === 'glove' && "min-h-[60px] text-base",
              touchMode === 'precision' && "min-h-[44px] text-sm",
              touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
            )}>
              <CustomSelectValue placeholder="전체 현장" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">전체 현장</CustomSelectItem>
              {sites.map(site => (
                <CustomSelectItem key={site.id} value={site.id}>
                  {site.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>
      </Card>

      {/* Calendar Card - UI Guidelines Compliant */}
      <Card className="p-2">
        {/* Month Navigation - Touch Optimized */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('prev')}
            className={cn(
              "rounded-lg transition-all duration-200",
              touchMode === 'glove' && "h-12 w-12",
              touchMode === 'precision' && "h-7 w-7",
              touchMode !== 'precision' && touchMode !== 'glove' && "h-8 w-8"
            )}
          >
            <ChevronLeft className={cn(
              touchMode === 'glove' ? "h-5 w-5" : "h-4 w-4"
            )} />
          </Button>
          
          <h2 className={cn(
            "font-semibold text-gray-900 dark:text-gray-100",
            touchMode === 'glove' ? "text-xl" : "text-base"
          )}>
            {format(currentDate, 'yyyy년 M월')}
          </h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth('next')}
            className={cn(
              "rounded-lg transition-all duration-200",
              touchMode === 'glove' && "h-12 w-12",
              touchMode === 'precision' && "h-7 w-7",
              touchMode !== 'precision' && touchMode !== 'glove' && "h-8 w-8"
            )}
          >
            <ChevronRight className={cn(
              touchMode === 'glove' ? "h-5 w-5" : "h-4 w-4"
            )} />
          </Button>
        </div>

        {/* Calendar Grid - Quantum Holographic */}
        <div className="relative overflow-hidden">
          {/* Weekday Headers - Quantum Field */}
          <div className="grid grid-cols-7 mb-[4px] relative">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div
                key={day}
                className={cn(
                  "text-center relative group cursor-default z-20",
                  touchMode === 'glove' ? 'py-3.5 text-[12px]' : 'py-3 text-[10px]',
                  "font-extralight tracking-[0.2em] uppercase opacity-25",
                  "transition-all duration-1500 ease-out hover:opacity-90 hover:scale-125 hover:translate-y-[-3px]",
                  i === 0 && "text-red-400/80 dark:text-red-300/60",
                  i === 6 && "text-blue-400/80 dark:text-blue-300/60",
                  i !== 0 && i !== 6 && "text-gray-500/70 dark:text-gray-400/50"
                )}
              >
                <div className="relative transform transition-all duration-1500 group-hover:rotate-6 group-hover:scale-110">
                  {day}
                  {/* Quantum field distortion */}
                  <div className="absolute inset-[-12px] bg-gradient-radial from-violet-200/20 via-cyan-200/15 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-2000 rounded-full blur-xl animate-pulse" />
                  {/* Holographic projection beams */}
                  <div className="absolute top-1/2 left-full w-8 h-[0.5px] bg-gradient-to-r from-cyan-400/30 via-violet-400/40 to-transparent opacity-0 group-hover:opacity-80 transition-all duration-1500 animate-pulse" />
                  <div className="absolute top-1/2 right-full w-8 h-[0.5px] bg-gradient-to-l from-cyan-400/30 via-violet-400/40 to-transparent opacity-0 group-hover:opacity-80 transition-all duration-1500 animate-pulse" />
                  {/* Quantum interference */}
                  <div className="absolute top-[-2px] left-1/2 w-[0.5px] h-6 bg-gradient-to-b from-violet-400/25 to-transparent opacity-0 group-hover:opacity-60 transition-all duration-1200" />
                </div>
              </div>
            ))}
            {/* Quantum field background */}
            <div className="absolute inset-0 opacity-15 dark:opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 10">
                <defs>
                  <linearGradient id="quantumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(168 85 247)" stopOpacity="0.25" />
                    <stop offset="25%" stopColor="rgb(6 182 212)" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="rgb(139 92 246)" stopOpacity="0.3" />
                    <stop offset="75%" stopColor="rgb(34 211 238)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="rgb(168 85 247)" stopOpacity="0.25" />
                  </linearGradient>
                  <filter id="quantumGlow">
                    <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path d="M 0,5 Q 20,1 40,5 Q 60,9 80,5 Q 90,2 100,5" stroke="url(#quantumGradient)" strokeWidth="0.8" fill="none" filter="url(#quantumGlow)" />
                {/* Quantum particles */}
                <circle cx="12" cy="4" r="1.2" fill="rgb(168 85 247)" fillOpacity="0.4" className="animate-pulse" />
                <circle cx="28" cy="6" r="0.8" fill="rgb(6 182 212)" fillOpacity="0.5" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                <circle cx="45" cy="3.5" r="1" fill="rgb(139 92 246)" fillOpacity="0.4" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                <circle cx="62" cy="6.5" r="0.9" fill="rgb(34 211 238)" fillOpacity="0.45" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
                <circle cx="78" cy="4.2" r="1.1" fill="rgb(168 85 247)" fillOpacity="0.4" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
                <circle cx="88" cy="5.8" r="0.7" fill="rgb(6 182 212)" fillOpacity="0.5" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
              </svg>
            </div>
          </div>
          
          {/* Calendar Days - Holographic Matrix */}
          <div className="grid grid-cols-7 gap-[3px] bg-gradient-to-br from-violet-50/30 via-cyan-25/25 to-purple-50/30 dark:from-violet-950/25 dark:via-cyan-950/20 dark:to-purple-950/25 p-3 rounded-[2rem] overflow-hidden backdrop-blur-[40px] border border-violet-200/25 dark:border-violet-800/15 relative">
            {/* Holographic interference pattern */}
            <div className="absolute inset-0 opacity-15 dark:opacity-8 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                <defs>
                  <radialGradient id="holoField" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgb(139 92 246)" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="rgb(6 182 212)" stopOpacity="0.3" />
                    <stop offset="60%" stopColor="rgb(168 85 247)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="transparent" />
                  </radialGradient>
                  <pattern id="quantumGrid" x="0" y="0" width="15" height="12" patternUnits="userSpaceOnUse">
                    <circle cx="7.5" cy="6" r="1" fill="url(#holoField)" />
                    <path d="M 0,6 L 15,6 M 7.5,0 L 7.5,12" stroke="rgb(139 92 246)" strokeOpacity="0.15" strokeWidth="0.3" />
                    <path d="M 7.5,6 Q 11,3 15,6 Q 11,9 7.5,6" stroke="rgb(6 182 212)" strokeOpacity="0.2" strokeWidth="0.4" fill="none" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#quantumGrid)" />
                <ellipse cx="50" cy="25" rx="30" ry="15" fill="url(#holoField)" opacity="0.6" className="animate-pulse" />
              </svg>
            </div>
            
            {/* Quantum field waves */}
            <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10">
              <div className="absolute top-1/4 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-2/4 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-400/60 to-transparent animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
              <div className="absolute top-3/4 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
            </div>
            
            {fullCalendarDays.map((day, index) => {
              const attendance = day ? getAttendanceForDate(day) : undefined
              const dayNum = day ? format(day, 'd') : ''
              const isCurrentMonth = day && isSameMonth(day, currentDate)
              const dayOfWeek = day ? getDay(day) : -1
              const isTodayDate = day && isToday(day)
              const hasAttendance = attendance && attendance.labor_hours && attendance.labor_hours > 0
              
              // Quantum entanglement calculations
              const quantumConnections = []
              if (hasAttendance && isCurrentMonth) {
                for (let i = 0; i < fullCalendarDays.length; i++) {
                  if (i !== index && fullCalendarDays[i] && getAttendanceForDate(fullCalendarDays[i])?.labor_hours > 0) {
                    const distance = Math.abs(i - index)
                    if (distance <= 14 && Math.random() > 0.7) { // Quantum probability
                      quantumConnections.push(i)
                    }
                  }
                }
              }
              
              return (
                <div
                  key={index}
                  className={cn(
                    "relative group overflow-visible",
                    "bg-white/85 dark:bg-gray-950/75 backdrop-blur-[60px]",
                    "transition-all duration-1500 ease-out",
                    "border-0 hover:scale-[1.08] hover:z-50 rounded-[2rem]",
                    "hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] dark:hover:shadow-[0_0_35px_rgba(139,92,246,0.6)]",
                    "hover:bg-white/95 dark:hover:bg-gray-900/90",
                    touchMode === 'glove' ? 'h-[80px]' : 
                    touchMode === 'precision' ? 'h-[58px]' : 
                    'h-[62px]',
                    !day && "invisible",
                    !isCurrentMonth && "opacity-10 scale-[0.92] saturate-0 blur-[0.5px]",
                    // Today - quantum resonance
                    isTodayDate && [
                      "bg-gradient-to-br from-violet-50/90 via-white/85 to-cyan-50/80",
                      "dark:from-violet-950/50 dark:via-gray-900/75 dark:to-cyan-950/45",
                      "shadow-[0_0_20px_rgba(139,92,246,0.6)] dark:shadow-[0_0_25px_rgba(139,92,246,0.8)]",
                      "ring-2 ring-violet-300/70 dark:ring-violet-500/60",
                      "before:absolute before:inset-[-3px] before:bg-gradient-conic before:from-violet-400/20 before:via-cyan-400/15 before:to-violet-400/20 before:rounded-[2rem] before:animate-spin before:duration-[12000ms]",
                      "after:absolute after:inset-[-6px] after:bg-gradient-conic after:from-violet-300/10 after:via-cyan-300/8 after:to-violet-300/10 after:rounded-[2rem] after:animate-spin after:duration-[18000ms] after:opacity-60"
                    ],
                    // Hover - quantum field activation
                    day && isCurrentMonth && [
                      "cursor-pointer",
                      "hover:before:absolute hover:before:inset-[-5px] hover:before:bg-gradient-conic hover:before:from-violet-400/30 hover:before:via-cyan-400/20 hover:before:to-violet-400/30 hover:before:rounded-[2rem] hover:before:animate-pulse hover:before:duration-[3000ms]"
                    ],
                    // Quantum field presence
                    hasAttendance && [
                      "shadow-[0_0_15px_rgba(139,92,246,0.3)] dark:shadow-[0_0_20px_rgba(139,92,246,0.5)]",
                      "ring-1 ring-violet-200/60 dark:ring-violet-700/50"
                    ]
                  )}
                >
                  {/* Quantum entanglement beams */}
                  {hasAttendance && isCurrentMonth && quantumConnections.length > 0 && (
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-2000">
                      {quantumConnections.slice(0, 2).map((targetIndex, connIndex) => {
                        const targetRow = Math.floor(targetIndex / 7)
                        const targetCol = targetIndex % 7
                        const currentRow = Math.floor(index / 7)
                        const currentCol = index % 7
                        
                        const deltaX = (targetCol - currentCol) * 65 // Approximate cell width
                        const deltaY = (targetRow - currentRow) * 65 // Approximate cell height
                        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
                        
                        return (
                          <div
                            key={connIndex}
                            className="absolute top-1/2 left-1/2 pointer-events-none"
                            style={{
                              transform: `translate(-50%, -50%) rotate(${Math.atan2(deltaY, deltaX)}rad)`,
                              width: `${distance}px`,
                              height: '2px'
                            }}
                          >
                            <div className="w-full h-[3px] bg-gradient-to-r from-violet-500/40 via-cyan-400/60 to-violet-500/40 animate-pulse opacity-70 blur-[0.5px]" />
                            <div className="absolute right-0 top-[-3px] w-2 h-2 bg-cyan-400/70 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            <div className="absolute left-0 top-[-3px] w-2 h-2 bg-violet-400/70 rounded-full animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                            {/* Quantum particles traveling along the beam */}
                            <div className="absolute top-[-1px] left-0 w-1 h-1 bg-white rounded-full animate-pulse opacity-80" 
                                 style={{ 
                                   animation: `quantum-particle-${connIndex} 3s linear infinite`,
                                   animationDelay: `${connIndex * 0.5}s`
                                 }} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  {day && (
                    <>
                      {/* Date number - quantum projection */}
                      <div className={cn(
                        "absolute top-2 left-3 z-30",
                        touchMode === 'glove' ? 'text-[14px]' : 'text-[12px]',
                        "font-extralight tracking-wider",
                        "transition-all duration-1000 group-hover:scale-150 group-hover:translate-y-[-2px] group-hover:rotate-6",
                        dayOfWeek === 0 && "text-red-600/95 dark:text-red-300/85",
                        dayOfWeek === 6 && "text-blue-600/95 dark:text-blue-300/85",
                        dayOfWeek !== 0 && dayOfWeek !== 6 && "text-gray-800/100 dark:text-gray-100/100",
                        isTodayDate && "text-violet-700/100 dark:text-violet-200/100 font-normal drop-shadow-[0_0_4px_rgba(139,92,246,0.8)]",
                        !isCurrentMonth && "text-gray-400/20 dark:text-gray-600/15"
                      )}>
                        {dayNum}
                        {/* Quantum field oscillation */}
                        {hasAttendance && (
                          <div className="absolute inset-[-8px] bg-gradient-radial from-violet-300/25 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1500 animate-pulse" />
                        )}
                        {/* Holographic projection lines */}
                        <div className="absolute top-1/2 left-full w-4 h-[0.5px] bg-gradient-to-r from-violet-400/30 to-transparent opacity-0 group-hover:opacity-70 transition-all duration-1000" />
                      </div>
                      
                      {/* Labor Hours - Quantum Crystal */}
                      {!loading && hasAttendance && (
                        <div className="absolute inset-0 flex items-center justify-center pt-1.5">
                          <div className={cn(
                            "flex items-center justify-center relative overflow-visible",
                            "bg-gradient-to-br from-violet-600/98 via-cyan-500/96 to-purple-600/98",
                            "dark:from-violet-700/98 dark:via-cyan-600/96 dark:to-purple-700/98",
                            "text-white rounded-full backdrop-blur-[60px]",
                            "border-2 border-white/90 dark:border-violet-100/70",
                            touchMode === 'glove' ? 'w-10 h-10 text-[12px]' : 'w-9 h-9 text-[10px]',
                            "font-medium tracking-tight",
                            "transform transition-all duration-1000 ease-out",
                            "hover:scale-[1.4] hover:rotate-[15deg]",
                            "shadow-[0_0_20px_rgba(139,92,246,0.8)] dark:shadow-[0_0_25px_rgba(139,92,246,0.9)]",
                            // Quantum crystal structure
                            "before:absolute before:inset-[-6px] before:rounded-full",
                            "before:bg-gradient-conic before:from-violet-400/35 before:via-cyan-300/25 before:to-purple-400/35",
                            "before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-1000",
                            "before:animate-spin before:duration-[8000ms] hover:before:duration-[3000ms]",
                            // Inner quantum field
                            "after:absolute after:inset-[4px] after:rounded-full",
                            "after:bg-gradient-to-tr after:from-white/50 after:via-white/20 after:to-transparent after:pointer-events-none",
                            // Holographic shimmer
                            "animate-pulse hover:animate-none"
                          )}>
                            <span className="relative z-50 drop-shadow-[0_0_3px_rgba(255,255,255,0.8)] font-semibold">{attendance.labor_hours}</span>
                            {/* Quantum energy discharge */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500 skew-x-12 opacity-90 rounded-full" />
                            {/* Crystal facets */}
                            <div className="absolute top-[8px] right-[10px] w-1.5 h-1.5 bg-white/70 rounded-full opacity-85 shadow-[0_0_3px_rgba(255,255,255,0.8)]" />
                            <div className="absolute bottom-[9px] left-[11px] w-1 h-1 bg-white/60 rounded-full opacity-75" />
                            <div className="absolute top-[12px] left-[6px] w-0.5 h-0.5 bg-white/80 rounded-full opacity-80" />
                            {/* Quantum field resonance rings */}
                            <div className="absolute inset-[-10px] border border-violet-300/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1200 animate-ping" />
                            <div className="absolute inset-[-15px] border border-cyan-300/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1500 animate-ping" style={{ animationDelay: '0.3s' }} />
                            <div className="absolute inset-[-20px] border border-purple-300/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1800 animate-ping" style={{ animationDelay: '0.6s' }} />
                            {/* Quantum probability cloud */}
                            <div className="absolute inset-[-12px] bg-gradient-radial from-violet-400/20 via-cyan-400/15 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-2000 animate-pulse" />
                          </div>
                        </div>
                      )}
                      
                      {/* Loading state - quantum processing */}
                      {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="relative">
                            <div className="w-4 h-4 bg-gradient-conic from-violet-400 via-cyan-400 to-purple-400 dark:from-violet-500 dark:via-cyan-500 dark:to-purple-500 rounded-full animate-spin opacity-80 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                            <div className="absolute inset-[-4px] w-4 h-4 bg-gradient-conic from-violet-300 via-cyan-300 to-purple-300 dark:from-violet-400 dark:via-cyan-400 dark:to-purple-400 rounded-full animate-ping opacity-40 scale-150" />
                            <div className="absolute inset-[-8px] w-4 h-4 border border-violet-300/50 rounded-full animate-pulse opacity-50" />
                          </div>
                        </div>
                      )}
                      
                      {/* Holographic surface */}
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-400/0 via-cyan-300/0 to-purple-400/0 group-hover:from-violet-400/15 group-hover:via-cyan-300/10 group-hover:to-purple-400/15 transition-all duration-1500 rounded-[2rem] pointer-events-none" />
                      
                      {/* Quantum field particles */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1500">
                        <div className="absolute top-[15%] left-[75%] w-2 h-2 bg-violet-400/70 rounded-full animate-pulse shadow-[0_0_6px_rgba(139,92,246,0.8)]" style={{ animationDelay: '0s' }} />
                        <div className="absolute bottom-[25%] right-[15%] w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-pulse shadow-[0_0_4px_rgba(6,182,212,0.8)]" style={{ animationDelay: '0.4s' }} />
                        <div className="absolute top-[65%] left-[20%] w-1 h-1 bg-purple-400/50 rounded-full animate-pulse shadow-[0_0_3px_rgba(147,51,234,0.8)]" style={{ animationDelay: '0.8s' }} />
                        <div className="absolute top-[40%] right-[30%] w-0.5 h-0.5 bg-white/90 rounded-full animate-pulse" style={{ animationDelay: '1.2s' }} />
                      </div>
                      
                      {/* Quantum interference patterns */}
                      {hasAttendance && (
                        <div className="absolute inset-3 opacity-8 group-hover:opacity-15 transition-opacity duration-1000 pointer-events-none">
                          <div className="absolute top-1/4 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />
                          <div className="absolute top-2/4 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
                          <div className="absolute top-3/4 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-purple-300/60 to-transparent" />
                          <div className="absolute left-1/4 top-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent via-violet-300/60 to-transparent" />
                          <div className="absolute left-3/4 top-0 bottom-0 w-[0.5px] bg-gradient-to-b from-transparent via-cyan-300/60 to-transparent" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly Statistics - UI Guidelines Compliant */}
        <div className={cn(
          "border-t border-gray-200 dark:border-gray-700",
          touchMode === 'glove' ? 'mt-3 pt-3' : 'mt-2 pt-2'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <BarChart3 className="h-3 w-3 text-gray-600" />
            </div>
            <span className={cn(
              "font-medium text-gray-700 dark:text-gray-300",
              touchMode === 'glove' ? 'text-sm' : 'text-xs'
            )}>
              월간 통계
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-toss-blue-50 dark:bg-toss-blue-900/20 rounded-lg p-2 text-center">
              <div className={cn(
                "font-bold text-toss-blue-600 dark:text-toss-blue-400 mb-0.5",
                touchMode === 'glove' ? 'text-lg' : 'text-base'
              )}>
                {monthlyStats.totalDays}
              </div>
              <div className={cn(
                "text-toss-blue-700 dark:text-toss-blue-300",
                touchMode === 'glove' ? 'text-xs' : 'text-xs'
              )}>
                작업일
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
              <div className={cn(
                "font-bold text-green-600 dark:text-green-400 mb-0.5",
                touchMode === 'glove' ? 'text-lg' : 'text-base'
              )}>
                {attendanceData.filter(a => a.sites?.name).length || 1}
              </div>
              <div className={cn(
                "text-green-700 dark:text-green-300",
                touchMode === 'glove' ? 'text-xs' : 'text-xs'
              )}>
                현장수
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-center">
              <div className={cn(
                "font-bold text-orange-600 dark:text-orange-400 mb-0.5",
                touchMode === 'glove' ? 'text-lg' : 'text-base'
              )}>
                {monthlyStats.totalLaborHours}
              </div>
              <div className={cn(
                "text-orange-700 dark:text-orange-300",
                touchMode === 'glove' ? 'text-xs' : 'text-xs'
              )}>
                총공수
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}