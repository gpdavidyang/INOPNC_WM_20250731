'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  FileText,
  Users,
  Package,
  TrendingUp,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  PieChart,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import type { DailyReport, Site, Profile } from '@/types'
import Link from 'next/link'
import { showErrorNotification } from '@/lib/error-handling'
import { getDailyReports } from '@/app/actions/daily-reports'
import { searchDailyReports, getQuickFilterResults } from '@/app/actions/search'
import { CompactReportCard } from './CompactReportCard'
import { ExportButton } from '@/components/export/export-button'
import { SearchInterface } from '@/components/search/SearchInterface'
import { dailyReportSearchConfig } from '@/lib/search/daily-report-config'
import type { SearchOptions, SearchResult } from '@/lib/search/types'

interface DailyReportListEnhancedProps {
  currentUser: Profile
  sites: Site[]
}

interface ReportStats {
  totalReports: number
  draftReports: number
  submittedReports: number
  approvedReports: number
  rejectedReports: number
  totalWorkers: number
  totalNPC1000Used: number
  averageWorkersPerDay: number
}

export function DailyReportListEnhanced({ currentUser, sites }: DailyReportListEnhancedProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [stats, setStats] = useState<ReportStats>({
    totalReports: 0,
    draftReports: 0,
    submittedReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    totalWorkers: 0,
    totalNPC1000Used: 0,
    averageWorkersPerDay: 0
  })
  const [showStats, setShowStats] = useState(true)
  const [searchResult, setSearchResult] = useState<SearchResult<DailyReport> | undefined>()
  const [isSearchMode, setIsSearchMode] = useState(false)

  useEffect(() => {
    loadReports()
  }, [selectedSite, selectedStatus, dateRange])

  const loadReports = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      
      if (selectedSite !== 'all') {
        filters.site_id = selectedSite
      }
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus
      }
      
      if ((dateRange as any).start) {
        filters.start_date = (dateRange as any).start
      }
      
      if ((dateRange as any).end) {
        filters.end_date = (dateRange as any).end
      }

      const result = await getDailyReports(filters)
      
      if (result.success && result.data) {
        const reportData = result.data as DailyReport[]
        setReports(reportData)

        // Calculate stats
        const statsData = reportData.reduce((acc: any, report: any) => {
          acc.totalReports++
          acc[`${report.status}Reports` as keyof ReportStats]++
          acc.totalWorkers += report.total_workers || 0
          acc.totalNPC1000Used += report.npc1000_used || 0
          return acc
        }, {
          totalReports: 0,
          draftReports: 0,
          submittedReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          averageWorkersPerDay: 0
        } as ReportStats)

        statsData.averageWorkersPerDay = reportData.length > 0 
          ? Math.round(statsData.totalWorkers / statsData.totalReports) 
          : 0
        setStats(statsData)
      } else {
        showErrorNotification(result.error || '일일보고서를 불러오는데 실패했습니다.', 'loadReports')
        setReports([])
        setStats({
          totalReports: 0,
          draftReports: 0,
          submittedReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          averageWorkersPerDay: 0
        })
      }
    } catch (error) {
      showErrorNotification(error, 'loadReports')
      setReports([])
      setStats({
        totalReports: 0,
        draftReports: 0,
        submittedReports: 0,
        approvedReports: 0,
        rejectedReports: 0,
        totalWorkers: 0,
        totalNPC1000Used: 0,
        averageWorkersPerDay: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (options: SearchOptions) => {
    setLoading(true)
    setIsSearchMode(true)
    try {
      const result = await searchDailyReports(options)
      
      if (result.success && result.data) {
        setSearchResult(result.data)
        setReports(result.data.items)
        
        // Calculate stats for search results
        const statsData = result.data.items.reduce((acc: any, report: any) => {
          acc.totalReports++
          acc[`${report.status}Reports` as keyof ReportStats]++
          acc.totalWorkers += report.total_workers || 0
          acc.totalNPC1000Used += report.npc1000_used || 0
          return acc
        }, {
          totalReports: 0,
          draftReports: 0,
          submittedReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          averageWorkersPerDay: 0
        } as ReportStats)

        statsData.averageWorkersPerDay = result.data.items.length > 0 
          ? Math.round(statsData.totalWorkers / statsData.totalReports) 
          : 0
        setStats(statsData)
      } else {
        showErrorNotification(result.error || '검색 중 오류가 발생했습니다.', 'handleSearch')
        setSearchResult(undefined)
        setReports([])
      }
    } catch (error) {
      showErrorNotification(error, 'handleSearch')
      setSearchResult(undefined)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickFilter = async (filterId: string) => {
    setLoading(true)
    setIsSearchMode(true)
    try {
      const result = await getQuickFilterResults(filterId, dailyReportSearchConfig.quickFilters)
      
      if (result.success && result.data) {
        setSearchResult(result.data)
        setReports(result.data.items)
        
        // Calculate stats for filtered results
        const statsData = result.data.items.reduce((acc: any, report: any) => {
          acc.totalReports++
          acc[`${report.status}Reports` as keyof ReportStats]++
          acc.totalWorkers += report.total_workers || 0
          acc.totalNPC1000Used += report.npc1000_used || 0
          return acc
        }, {
          totalReports: 0,
          draftReports: 0,
          submittedReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          totalWorkers: 0,
          totalNPC1000Used: 0,
          averageWorkersPerDay: 0
        } as ReportStats)

        statsData.averageWorkersPerDay = result.data.items.length > 0 
          ? Math.round(statsData.totalWorkers / statsData.totalReports) 
          : 0
        setStats(statsData)
      } else {
        showErrorNotification(result.error || '빠른 필터 적용 중 오류가 발생했습니다.', 'handleQuickFilter')
      }
    } catch (error) {
      showErrorNotification(error, 'handleQuickFilter')
    } finally {
      setLoading(false)
    }
  }

  // In search mode, use the reports as-is since filtering is done server-side
  // In normal mode, apply client-side filtering for the old search functionality  
  const filteredReports = isSearchMode ? reports : reports.filter(report => {
    const matchesSearch = 
      report.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.process_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issues?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSite = selectedSite === 'all' || report.site_id === selectedSite
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus
    
    return matchesSearch && matchesSite && matchesStatus
  })


  const canCreateReport = ['worker', 'site_manager', 'admin'].includes(currentUser.role)

  return (
    <div className="space-y-6">
      {/* Action Button for PageLayout */}
      <div className="hidden" id="page-action">
        {canCreateReport && (
          <Link href="/dashboard/daily-reports/new">
            <Button 
              size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
              variant="primary"
              touchMode={touchMode}
            >
              <Plus className="w-4 h-4 mr-2" />
              작업일지 작성
            </Button>
          </Link>
        )}
      </div>

      {/* High-Density Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>작업일지</div>
                <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} text-gray-900 dark:text-gray-100 mt-0.5`}>{stats.totalReports}건</div>
                <div className={`flex gap-1.5 mt-0.5 ${getFullTypographyClass('caption', 'xs', isLargeFont)}`}>
                  <span className="text-green-600 dark:text-green-400">승인 {stats.approvedReports}</span>
                  <span className="text-blue-600 dark:text-blue-400">대기 {stats.submittedReports}</span>
                </div>
              </div>
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>작업인원</div>
                <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} text-gray-900 dark:text-gray-100 mt-0.5`}>{stats.totalWorkers}명</div>
                <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-0.5`}>
                  평균 {stats.averageWorkersPerDay}명
                </div>
              </div>
              <div className="p-1.5 bg-green-50 dark:bg-green-900 rounded-lg">
                <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>NPC-1000</div>
                <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} text-gray-900 dark:text-gray-100 mt-0.5`}>{(stats.totalNPC1000Used / 1000).toFixed(1)}t</div>
                <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-0.5`}>
                  평균 {Math.round(stats.totalNPC1000Used / stats.totalReports)}kg
                </div>
              </div>
              <div className="p-1.5 bg-orange-50 dark:bg-orange-900 rounded-lg">
                <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>승인율</div>
                <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} text-gray-900 dark:text-gray-100 mt-0.5`}>
                  {stats.totalReports > 0 
                    ? Math.round((stats.approvedReports / stats.totalReports) * 100)
                    : 0}%
                </div>
                {stats.rejectedReports > 0 && (
                  <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-red-600 dark:text-red-400 mt-0.5`}>
                    반려 {stats.rejectedReports}건
                  </div>
                )}
              </div>
              <div className="p-1.5 bg-purple-50 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Interface */}
      <SearchInterface
        fields={dailyReportSearchConfig.fields}
        quickFilters={dailyReportSearchConfig.quickFilters}
        onSearch={handleSearch}
        onQuickFilter={handleQuickFilter}
        searchResult={searchResult}
        loading={loading}
        sites={sites}
      />

      {/* Compact Filters - Mobile Optimized */}
      {!isSearchMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="space-y-2">
            {/* Compact Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="부재명, 공정, 특이사항으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-9 ${
                  touchMode === 'glove' ? 'h-14' : 
                  touchMode === 'precision' ? 'h-9' : 
                  'h-10'
                } ${getFullTypographyClass('body', 'sm', isLargeFont)} bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-white`}
              />
            </div>
            
            {/* Compact Filter Grid */}
            <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className={`px-3 py-2 ${
                  touchMode === 'glove' ? 'h-14' : 
                  touchMode === 'precision' ? 'h-9' : 
                  'h-10'
                } border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 ${getFullTypographyClass('body', 'sm', isLargeFont)} focus:border-blue-500 focus:outline-none dark:text-white`}
              >
                <option value="all">전체 현장</option>
                {sites.map((site: any) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-3 py-2 ${
                  touchMode === 'glove' ? 'h-14' : 
                  touchMode === 'precision' ? 'h-9' : 
                  'h-10'
                } border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 ${getFullTypographyClass('body', 'sm', isLargeFont)} focus:border-blue-500 focus:outline-none dark:text-white`}
              >
                <option value="all">전체 상태</option>
                <option value="draft">임시저장</option>
                <option value="submitted">제출됨</option>
                <option value="approved">승인됨</option>
                <option value="rejected">반려됨</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="compact" 
                  onClick={loadReports} 
                  className="h-8 px-3 rounded-lg dark:border-gray-600 dark:text-gray-300"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  새로고침
                </Button>
                <Button 
                  variant="outline" 
                  size="compact" 
                  onClick={() => setShowStats(!showStats)}
                  className="h-8 px-3 rounded-lg dark:border-gray-600 dark:text-gray-300"
                >
                  <PieChart className="w-3 h-3 mr-1" />
                  통계
                </Button>
              </div>
              <ExportButton 
                sites={sites}
                className="h-8 px-3"
              />
            </div>
          </div>
        </div>
      )}

      {/* Compact Search Mode Actions */}
      {isSearchMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="compact" 
                onClick={() => {
                  setIsSearchMode(false)
                  setSearchResult(undefined)
                  loadReports()
                }}
                className="h-8 px-3 rounded-lg dark:border-gray-600 dark:text-gray-300"
              >
                <X className="w-3 h-3 mr-1" />
                검색 해제
              </Button>
              <Button 
                variant="outline" 
                size="compact" 
                onClick={() => setShowStats(!showStats)}
                className="h-8 px-3 rounded-lg dark:border-gray-600 dark:text-gray-300"
              >
                <PieChart className="w-3 h-3 mr-1" />
                통계
              </Button>
            </div>
            <ExportButton 
              sites={sites}
              className="h-8 px-3"
            />
          </div>
        </div>
      )}

      {/* High-Density Report List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-3 text-gray-600 dark:text-gray-400 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>작업일지를 불러오는 중...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className={`text-gray-600 dark:text-gray-400 ${getFullTypographyClass('body', 'sm', isLargeFont)} mb-1`}>작업일지가 없습니다.</p>
            <p className={`text-gray-500 dark:text-gray-500 ${getFullTypographyClass('caption', 'xs', isLargeFont)} mb-3`}>새로운 작업일지를 작성해보세요.</p>
            {canCreateReport && (
              <Link href="/dashboard/daily-reports/new">
                <Button 
                  variant="primary" 
                  size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
                  touchMode={touchMode}
                  className="px-4 rounded-xl"
                >
                  작업일지 작성하기
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredReports.map((report: any) => {
              const site = sites.find(s => s.id === report.site_id)
              const canEdit = currentUser.id === report.created_by && report.status === 'draft'
              
              return (
                <CompactReportCard
                  key={report.id}
                  report={report}
                  site={site}
                  canEdit={canEdit}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}