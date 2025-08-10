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
      {/* Filter Controls - UI Guidelines Compliant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
        {/* Site Selection */}
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center shrink-0">
              <FileText className="h-3 w-3 text-gray-600" />
            </div>
            <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
              <CustomSelectTrigger className={cn(
                "flex-1",
                touchMode === 'glove' && "min-h-[60px] text-base",
                touchMode === 'precision' && "min-h-[44px] text-sm",
                touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
              )}>
                <CustomSelectValue placeholder="현장 선택" />
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

        {/* Date Range Selection */}
        <Card className="p-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center shrink-0">
              <Calendar className="h-3 w-3 text-gray-600" />
            </div>
            <CustomSelect value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <CustomSelectTrigger className={cn(
                "flex-1",
                touchMode === 'glove' && "min-h-[60px] text-base",
                touchMode === 'precision' && "min-h-[44px] text-sm",
                touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
              )}>
                <CustomSelectValue placeholder="기간 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                {dateRangeOptions.map(option => (
                  <CustomSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
        </Card>
      </div>

      {/* Monthly Salary List Table - UI Guidelines Compliant */}
      <Card className="p-0 overflow-hidden">
        {/* Table Header */}
        <div className="bg-toss-blue-50 dark:bg-toss-blue-900/30 px-2 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className={cn(
            "grid grid-cols-7 gap-1.5 font-medium text-toss-blue-700 dark:text-toss-blue-300",
            touchMode === 'glove' ? 'text-sm' : 'text-xs'
          )}>
            <div>월</div>
            <div>현장</div>
            <div className="text-center">근무일</div>
            <div className="text-right">기본급</div>
            <div className="text-right">연장수당</div>
            <div className="text-right">실지급액</div>
            <div className="text-center">PDF</div>
          </div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="px-2 py-4 text-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-toss-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">급여 데이터를 불러오는 중...</p>
            </div>
          ) : monthlyHistoryList.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-xs">선택한 기간에 급여 데이터가 없습니다.</p>
            </div>
          ) : (
            monthlyHistoryList.map((salary, index) => (
            <div 
              key={index} 
              className={cn(
                "px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200",
                "active:bg-gray-100 dark:active:bg-gray-700",
                touchMode === 'glove' && "py-3 min-h-[48px]"
              )}
              onClick={() => handleRowClick(salary)}
            >
              <div className={cn(
                "grid grid-cols-7 gap-1.5 items-center",
                touchMode === 'glove' ? 'text-sm' : 'text-xs'
              )}>
                <div className="font-medium text-gray-900 dark:text-gray-100">{salary.month}</div>
                <div className="text-gray-600 dark:text-gray-400">{salary.site}</div>
                <div className="text-center">{salary.workDays}일</div>
                <div className="text-right">{(salary.basicPay / 10000).toFixed(0)}만</div>
                <div className="text-right">{(salary.overtimePay / 10000).toFixed(0)}만</div>
                <div className="text-right font-semibold text-toss-blue-600 dark:text-toss-blue-400">
                  {Math.floor(salary.netPay / 10000)}만
                </div>
                <div className="text-center">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className={cn(
                      "p-0.5 rounded-lg transition-all duration-200 hover:bg-toss-blue-100",
                      touchMode === 'glove' && "h-7 w-7 p-0",
                      touchMode !== 'glove' && "h-5 w-5 p-0"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPDF(salary);
                    }}
                  >
                    <Download className={cn(
                      "text-toss-blue-600",
                      touchMode === 'glove' ? "h-3 w-3" : "h-2.5 w-2.5"
                    )} />
                  </Button>
                </div>
              </div>
            </div>
          )))}
        </div>
      </Card>

      {/* Selected Month Detail - UI Guidelines Compliant */}
      {selectedMonthDetails && (
        <Card className="p-2 bg-toss-blue-50 dark:bg-toss-blue-900/20 border border-toss-blue-200 dark:border-toss-blue-800">
          <h3 className={cn(
            "font-medium text-toss-blue-700 dark:text-toss-blue-300 mb-2 flex items-center gap-2",
            touchMode === 'glove' ? 'text-sm' : 'text-xs'
          )}>
            <div className="w-4 h-4 bg-toss-blue-100 dark:bg-toss-blue-800 rounded flex items-center justify-center">
              <FileText className="h-2.5 w-2.5" />
            </div>
            선택된 급여내역 ({monthlyHistoryList.find(m => m.fullData === selectedMonthDetails)?.year}-{monthlyHistoryList.find(m => m.fullData === selectedMonthDetails)?.monthNum.toString().padStart(2, '0')})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 space-y-0.5">
              <div className={cn(
                "text-gray-600 dark:text-gray-400",
                touchMode === 'glove' ? 'text-xs' : 'text-xs'
              )}>기본급</div>
              <div className={cn(
                "font-semibold text-gray-900 dark:text-gray-100",
                touchMode === 'glove' ? 'text-sm' : 'text-xs'
              )}>{formatCurrency(selectedMonthDetails.base_salary)}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 space-y-0.5">
              <div className={cn(
                "text-gray-600 dark:text-gray-400",
                touchMode === 'glove' ? 'text-xs' : 'text-xs'
              )}>공제액</div>
              <div className={cn(
                "font-semibold text-red-600",
                touchMode === 'glove' ? 'text-sm' : 'text-xs'
              )}>-{formatCurrency(selectedMonthDetails.total_deductions)}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 space-y-0.5">
              <div className={cn(
                "text-gray-600 dark:text-gray-400",
                touchMode === 'glove' ? 'text-xs' : 'text-xs'
              )}>연장수당</div>
              <div className={cn(
                "font-semibold text-gray-900 dark:text-gray-100",
                touchMode === 'glove' ? 'text-sm' : 'text-xs'
              )}>{formatCurrency(selectedMonthDetails.overtime_pay)}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 space-y-0.5">
              <div className={cn(
                "text-gray-600 dark:text-gray-400",
                touchMode === 'glove' ? 'text-xs' : 'text-xs'
              )}>실지급액</div>
              <div className={cn(
                "font-bold text-toss-blue-600 dark:text-toss-blue-400",
                touchMode === 'glove' ? 'text-sm' : 'text-sm'
              )}>{formatCurrency(selectedMonthDetails.net_pay)}</div>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-toss-blue-200 dark:border-toss-blue-700">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 space-y-0.5">
                <div className={cn(
                  "text-gray-600 dark:text-gray-400",
                  touchMode === 'glove' ? 'text-xs' : 'text-xs'
                )}>제수당</div>
                <div className={cn(
                  "font-semibold text-gray-900 dark:text-gray-100",
                  touchMode === 'glove' ? 'text-sm' : 'text-xs'
                )}>{formatCurrency(selectedMonthDetails.bonus_pay)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 space-y-0.5">
                <div className={cn(
                  "text-gray-600 dark:text-gray-400",
                  touchMode === 'glove' ? 'text-xs' : 'text-xs'
                )}>근무일수</div>
                <div className={cn(
                  "font-semibold text-gray-900 dark:text-gray-100",
                  touchMode === 'glove' ? 'text-sm' : 'text-xs'
                )}>{selectedMonthDetails.work_days}일</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2 space-y-0.5">
                <div className={cn(
                  "text-gray-600 dark:text-gray-400",
                  touchMode === 'glove' ? 'text-xs' : 'text-xs'
                )}>총공수</div>
                <div className={cn(
                  "font-semibold text-gray-900 dark:text-gray-100",
                  touchMode === 'glove' ? 'text-sm' : 'text-xs'
                )}>{selectedMonthDetails.total_labor_hours.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* PDF Download Button for selected month */}
          <div className="mt-2 pt-2 border-t border-toss-blue-200 dark:border-toss-blue-700">
            <Button
              onClick={() => {
                const salaryItem = monthlyHistoryList.find(m => m.fullData === selectedMonthDetails);
                if (salaryItem) handleDownloadPDF(salaryItem);
              }}
              className={cn(
                "w-full bg-toss-blue-600 hover:bg-toss-blue-700 text-white transition-all duration-200",
                touchMode === 'glove' && "min-h-[56px] text-base",
                touchMode === 'precision' && "min-h-[44px] text-sm",
                touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[48px] text-sm"
              )}
              variant="default"
            >
              <Download className="h-4 w-4 mr-2" />
              급여명세서 PDF 다운로드
            </Button>
          </div>
        </Card>
      )}

      {/* Salary Calculation - UI Guidelines Compliant */}
      {selectedMonthDetails && (
        <Card className="p-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-orange-100 dark:bg-orange-800 rounded flex items-center justify-center">
              <Calculator className="h-3 w-3 text-orange-600" />
            </div>
            <h4 className={cn(
              "font-semibold text-gray-900 dark:text-gray-100",
              touchMode === 'glove' ? 'text-sm' : 'text-xs'
            )}>급여 계산식</h4>
          </div>

          {/* 총 지급액 */}
          <div className="bg-toss-blue-50 dark:bg-toss-blue-900/20 p-2 rounded-lg mb-2">
            <div className="flex justify-between items-center">
              <span className={cn(
                "font-medium text-gray-700 dark:text-gray-300",
                touchMode === 'glove' ? 'text-sm' : 'text-xs'
              )}>총 지급액</span>
              <span className={cn(
                "font-bold text-toss-blue-600 dark:text-toss-blue-400",
                touchMode === 'glove' ? 'text-base' : 'text-sm'
              )}>{formatCurrency(selectedMonthDetails.total_gross_pay)}</span>
            </div>
          </div>

          {/* 계산 과정 */}
          <div className={cn(
            "space-y-1",
            touchMode === 'glove' ? 'text-sm' : 'text-xs'
          )}>
            <div className="flex justify-between py-1">
              <span className="text-gray-700 dark:text-gray-300">기본급</span>
              <span className="font-medium">{Math.floor(selectedMonthDetails.base_salary / 10000)}만원</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-700 dark:text-gray-300">+ 연장수당</span>
              <span className="font-medium">{Math.floor(selectedMonthDetails.overtime_pay / 10000)}만원</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-700 dark:text-gray-300">+ 제수당</span>
              <span className="font-medium">{Math.floor(selectedMonthDetails.bonus_pay / 10000)}만원</span>
            </div>
            <div className="flex justify-between py-1 text-red-600 dark:text-red-400">
              <span>- 공제액</span>
              <span className="font-medium">{Math.floor(selectedMonthDetails.total_deductions / 10000)}만원</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold text-toss-blue-600 dark:text-toss-blue-400">
              <span>= 실지급액</span>
              <span>{Math.floor(selectedMonthDetails.net_pay / 10000)}만원</span>
            </div>
          </div>

          {/* 근무일 기준 */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <h5 className={cn(
              "font-medium text-orange-600 mb-1 flex items-center gap-1",
              touchMode === 'glove' ? 'text-sm' : 'text-xs'
            )}>
              <span>근무일 기준</span>
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                <div className={cn(
                  "text-gray-600 dark:text-gray-400 mb-0.5",
                  touchMode === 'glove' ? 'text-xs' : 'text-xs'
                )}>총 근무일</div>
                <div className={cn(
                  "font-semibold text-gray-900 dark:text-gray-100",
                  touchMode === 'glove' ? 'text-sm' : 'text-xs'
                )}>{selectedMonthDetails.work_days}일</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                <div className={cn(
                  "text-gray-600 dark:text-gray-400 mb-0.5",
                  touchMode === 'glove' ? 'text-xs' : 'text-xs'
                )}>일당 평균</div>
                <div className={cn(
                  "font-semibold text-gray-900 dark:text-gray-100",
                  touchMode === 'glove' ? 'text-sm' : 'text-xs'
                )}>
                  {selectedMonthDetails.work_days > 0 ? Math.floor((selectedMonthDetails.net_pay / selectedMonthDetails.work_days) / 1000) : 0}천원
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
                <div className={cn(
                  "text-gray-600 dark:text-gray-400 mb-0.5",
                  touchMode === 'glove' ? 'text-xs' : 'text-xs'
                )}>시급 평균 (8시간 기준)</div>
                <div className={cn(
                  "font-semibold text-gray-900 dark:text-gray-100",
                  touchMode === 'glove' ? 'text-sm' : 'text-xs'
                )}>
                  {selectedMonthDetails.total_work_hours > 0 ? Math.floor((selectedMonthDetails.net_pay / selectedMonthDetails.total_work_hours) / 100) : 0}백원
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

    </div>
  )
}