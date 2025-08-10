'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DollarSign,
  FileText,
  Calculator,
  TrendingUp,
  Download,
  Calendar
} from 'lucide-react'
import { getSalaryInfo, calculateMonthlySalary } from '@/app/actions/salary'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import type { Profile } from '@/types'

interface SalaryViewProps {
  profile: Profile
}

interface SalaryInfo {
  id: string
  user_id: string
  base_salary: number
  hourly_rate: number
  overtime_rate: number
  effective_date: string
}

interface MonthlySalaryCalculation {
  base_salary: number
  hourly_rate: number
  overtime_rate: number
  total_work_hours: number
  total_overtime_hours: number
  total_labor_hours: number
  regular_pay: number
  overtime_pay: number
  bonus_pay: number
  total_gross_pay: number
  tax_deduction: number
  national_pension: number
  health_insurance: number
  employment_insurance: number
  total_deductions: number
  net_pay: number
  work_days: number
}

interface DateRangeOption {
  value: string
  label: string
  getMonthsBack: () => number
}

export function SalaryView({ profile }: SalaryViewProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo | null>(null)
  const [monthlyCalculation, setMonthlyCalculation] = useState<MonthlySalaryCalculation | null>(null)
  const [monthlyHistoryList, setMonthlyHistoryList] = useState<any[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('전체 현장')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('최근6개월')
  const [selectedMonthDetails, setSelectedMonthDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState<any[]>([])
  
  // Date range options
  const dateRangeOptions: DateRangeOption[] = [
    { value: '전체기간', label: '전체기간', getMonthsBack: () => 12 },
    { value: '최근3개월', label: '최근3개월', getMonthsBack: () => 3 },
    { value: '최근6개월', label: '최근6개월', getMonthsBack: () => 6 },
    { value: '최근12개월', label: '최근12개월', getMonthsBack: () => 12 }
  ]

  // Load sites and initial data
  useEffect(() => {
    if (profile?.id) {
      loadSites()
      loadSalaryHistoryList()
    }
  }, [profile?.id, selectedSite, selectedDateRange])

  const loadSites = async () => {
    try {
      // For now using mock data - could be replaced with real API call
      const mockSites = [
        { id: 'all', name: '전체 현장' },
        { id: 'gangnam', name: '강남 현장' },
        { id: 'songpa', name: '송파 현장' }
      ]
      setSites(mockSites)
    } catch (error) {
      console.error('Failed to load sites:', error)
      setSites([{ id: 'all', name: '전체 현장' }])
    }
  }

  const loadSalaryHistoryList = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      // Get the number of months to load based on selected date range
      const selectedOption = dateRangeOptions.find(opt => opt.value === selectedDateRange)
      const monthsToLoad = selectedOption?.getMonthsBack() || 6
      
      const historyList = []
      const currentDate = new Date()
      
      for (let i = 0; i < monthsToLoad; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const year = targetDate.getFullYear()
        const month = targetDate.getMonth() + 1
        
        // Calculate monthly salary for each month
        const calcResult = await calculateMonthlySalary({
          user_id: profile.id,
          year: year,
          month: month
        })
        
        if (calcResult.success && calcResult.data) {
          const data = calcResult.data
          const monthStr = `${month.toString().padStart(2, '0')}월`
          
          // Determine site name based on selection
          let siteName = selectedSite === '전체 현장' ? '강남' : selectedSite.replace(' 현장', '')
          
          const historyItem = {
            month: monthStr,
            site: siteName,
            workDays: data.work_days,
            basicPay: data.base_salary,
            overtimePay: data.overtime_pay,
            allowance: data.bonus_pay,
            deductions: data.total_deductions,
            netPay: data.net_pay,
            status: i === 0 ? 'pending' : 'paid', // Current month is pending, others are paid
            year: year,
            monthNum: month,
            fullData: data // Store full calculation data
          }
          
          historyList.push(historyItem)
        }
      }
      
      setMonthlyHistoryList(historyList)
    } catch (error) {
      console.error('Failed to load salary history:', error)
      // Fallback to empty list on error
      setMonthlyHistoryList([])
    } finally {
      setLoading(false)
    }
  }

  const loadSalaryData = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    try {
      // Get salary info
      const salaryResult = await getSalaryInfo({ 
        user_id: profile.id,
        date: format(currentDate, 'yyyy-MM-dd')
      })

      if (salaryResult.success && salaryResult.data) {
        setSalaryInfo(salaryResult.data)
      }

      // Calculate monthly salary
      const calcResult = await calculateMonthlySalary({
        user_id: profile.id,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      })

      if (calcResult.success && calcResult.data) {
        setMonthlyCalculation(calcResult.data)
      }
    } catch (error) {
      console.error('Failed to load salary data:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원'
  }

  const handleRowClick = (salaryItem: any) => {
    // Set the selected month details and load full calculation data
    setSelectedMonthDetails(salaryItem.fullData)
  }

  const handleDownloadPDF = async (salaryItem: any) => {
    try {
      // Using existing PDF functionality - create a salary statement
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF()
      
      // Set font
      doc.setFont('helvetica')
      
      // Title
      doc.setFontSize(18)
      doc.text('급여명세서', 105, 20, { align: 'center' })
      
      // Employee info
      doc.setFontSize(12)
      doc.text(`성명: ${profile.full_name || ''}`, 20, 40)
      doc.text(`지급월: ${salaryItem.year}-${salaryItem.monthNum.toString().padStart(2, '0')}`, 20, 50)
      doc.text(`현장: ${salaryItem.site}`, 20, 60)
      
      // Salary details
      doc.text('지급내역', 20, 80)
      doc.setFontSize(10)
      doc.text(`기본급: ${salaryItem.basicPay.toLocaleString()}원`, 30, 90)
      doc.text(`연장수당: ${salaryItem.overtimePay.toLocaleString()}원`, 30, 100)
      doc.text(`제수당: ${salaryItem.allowance.toLocaleString()}원`, 30, 110)
      
      doc.text('공제내역', 20, 130)
      doc.text(`총공제액: ${salaryItem.deductions.toLocaleString()}원`, 30, 140)
      
      doc.setFontSize(12)
      doc.text(`실지급액: ${salaryItem.netPay.toLocaleString()}원`, 20, 160)
      
      // Save PDF
      const fileName = `급여명세서_${salaryItem.year}-${salaryItem.monthNum.toString().padStart(2, '0')}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('PDF download error:', error)
      alert('PDF 다운로드 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-2">
      {/* Single Site Selection - Exactly like Image 1 */}
      <Card className="p-3 border-2 border-blue-300 rounded-xl">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
            <CustomSelectTrigger className="flex-1 border-0 bg-transparent p-0 text-base font-medium">
              <CustomSelectValue placeholder="전체 현장" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              {sites.map(site => (
                <CustomSelectItem key={site.id} value={site.name}>
                  {site.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>
      </Card>

      {/* Simple Salary Table - Exactly like Image 1 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 border-b">
          <div className="grid grid-cols-7 gap-1 font-medium text-gray-700 dark:text-gray-300 text-xs">
            <div className="whitespace-nowrap">월</div>
            <div className="whitespace-nowrap">현장</div>
            <div className="text-center whitespace-nowrap">근무일</div>
            <div className="text-right whitespace-nowrap">기본급</div>
            <div className="text-right whitespace-nowrap">연장수당</div>
            <div className="text-right whitespace-nowrap">실지급액</div>
            <div className="text-center whitespace-nowrap">PDF</div>
          </div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {loading ? (
            <div className="px-3 py-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">급여 데이터를 불러오는 중...</p>
            </div>
          ) : monthlyHistoryList.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">급여 데이터가 없습니다.</p>
            </div>
          ) : (
            monthlyHistoryList.map((salary, index) => (
              <div 
                key={index}
                className={cn(
                  "px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors",
                  selectedMonthDetails === salary.fullData && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => handleRowClick(salary)}
              >
                <div className="grid grid-cols-7 gap-1 items-center text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{salary.month}</div>
                  <div className="text-gray-600 dark:text-gray-400 whitespace-nowrap">{salary.site}</div>
                  <div className="text-center whitespace-nowrap">{salary.workDays}일</div>
                  <div className="text-right whitespace-nowrap">{Math.floor(salary.basicPay / 10000)}만</div>
                  <div className="text-right whitespace-nowrap">{Math.floor(salary.overtimePay / 10000)}만</div>
                  <div className="text-right font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {Math.floor(salary.netPay / 10000)}만
                  </div>
                  <div className="text-center">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="p-1 h-6 w-6 rounded hover:bg-blue-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(salary);
                      }}
                    >
                      <Download className="h-3 w-3 text-blue-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected Month Details - Exactly like Image 1 */}
      {selectedMonthDetails && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              선택된 급여내역 ({monthlyHistoryList.find(m => m.fullData === selectedMonthDetails)?.year}-{monthlyHistoryList.find(m => m.fullData === selectedMonthDetails)?.monthNum.toString().padStart(2, '0')})
            </span>
          </div>
          
          {/* Two Column Layout - Optimized for Mobile */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">기본급</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-right">
                  ₩{selectedMonthDetails.base_salary.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">연장수당</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-right">
                  ₩{selectedMonthDetails.overtime_pay.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">제수당</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-right">
                  ₩{selectedMonthDetails.bonus_pay.toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">공제액</span>
                <span className="text-sm font-bold text-red-600 whitespace-nowrap text-right">
                  -₩{selectedMonthDetails.total_deductions.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">실지급액</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap text-right">
                  ₩{selectedMonthDetails.net_pay.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Calculation - Exactly like Image 1 */}
      {selectedMonthDetails && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
              <Calculator className="h-4 w-4 text-orange-600" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100">급여 계산식</h4>
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">총 지급액</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ₩{selectedMonthDetails.total_gross_pay.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Calculation Process */}
          <div className="space-y-2 mb-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">계산과정:</div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">기본급</span>
              <span className="text-sm font-medium">{Math.floor(selectedMonthDetails.base_salary / 10000)}만원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">+ 연장수당</span>
              <span className="text-sm font-medium">{Math.floor(selectedMonthDetails.overtime_pay / 10000)}만원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">+ 제수당</span>
              <span className="text-sm font-medium">{Math.floor(selectedMonthDetails.bonus_pay / 10000)}만원</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span className="text-sm">- 공제액</span>
              <span className="text-sm font-medium">{Math.floor(selectedMonthDetails.total_deductions / 10000)}만원</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-blue-600">
              <span className="text-sm">= 실지급액</span>
              <span className="text-sm">{Math.floor(selectedMonthDetails.net_pay / 10000)}만원</span>
            </div>
          </div>

          {/* Work Days Info */}
          <div className="border-t pt-3">
            <div className="text-sm font-medium text-orange-600 mb-2">근무일 기준:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">총 근무일</span>
                <span className="text-sm font-medium">{selectedMonthDetails.work_days}일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">일당 평균</span>
                <span className="text-sm font-medium">
                  {selectedMonthDetails.work_days > 0 ? Math.floor((selectedMonthDetails.net_pay / selectedMonthDetails.work_days) / 1000) : 0}천원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">시급 평균 (8시간 기준)</span>
                <span className="text-sm font-medium">
                  {selectedMonthDetails.total_work_hours > 0 ? Math.floor((selectedMonthDetails.net_pay / selectedMonthDetails.total_work_hours) / 100) : 0}백원
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

    </div>
  )
}