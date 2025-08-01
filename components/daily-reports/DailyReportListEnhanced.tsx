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
      
      if (dateRange.start) {
        filters.start_date = dateRange.start
      }
      
      if (dateRange.end) {
        filters.end_date = dateRange.end
      }

      const result = await getDailyReports(filters)
      
      if (result.success && result.data) {
        const reportData = result.data as DailyReport[]
        setReports(reportData)

        // Calculate stats
        const statsData = reportData.reduce((acc, report) => {
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
        const statsData = result.data.items.reduce((acc, report) => {
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
        const statsData = result.data.items.reduce((acc, report) => {
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 py-3 space-y-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">작업일지</h1>
            <p className="text-sm text-gray-600">{format(new Date(), 'M월 d일')} 현황</p>
          </div>
          {canCreateReport && (
            <Link href="/dashboard/daily-reports/new">
              <Button size="sm" variant="primary" className="rounded-full">
                <Plus className="w-4 h-4" />
                <span className="ml-1 hidden sm:inline">작성</span>
              </Button>
            </Link>
          )}
        </div>

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-white border-0 shadow-sm p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">작업일지</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalReports}건</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-xs text-green-600">승인 {stats.approvedReports}</span>
                  <span className="text-xs text-blue-600">대기 {stats.submittedReports}</span>
                </div>
              </div>
              <div className="p-1.5 bg-blue-50 rounded">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-0 shadow-sm p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">작업인원</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalWorkers}명</p>
                <p className="text-xs text-gray-500 mt-1">
                  평균 {stats.averageWorkersPerDay}명
                </p>
              </div>
              <div className="p-1.5 bg-green-50 rounded">
                <Users className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-0 shadow-sm p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">NPC-1000</p>
                <p className="text-lg font-bold text-gray-900">{(stats.totalNPC1000Used / 1000).toFixed(1)}t</p>
                <p className="text-xs text-gray-500 mt-1">
                  평균 {Math.round(stats.totalNPC1000Used / stats.totalReports)}kg
                </p>
              </div>
              <div className="p-1.5 bg-orange-50 rounded">
                <Package className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-white border-0 shadow-sm p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-600">승인율</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.totalReports > 0 
                    ? Math.round((stats.approvedReports / stats.totalReports) * 100)
                    : 0}%
                </p>
                {stats.rejectedReports > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    반려 {stats.rejectedReports}건
                  </p>
                )}
              </div>
              <div className="p-1.5 bg-purple-50 rounded">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </Card>
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

      {/* Legacy Filters - Simple fallback */}
      {!isSearchMode && (
        <Card className="bg-white border-0 shadow-sm p-3">
          <div className="space-y-2">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="부재명, 공정, 특이사항으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm border-gray-200 focus:border-blue-500"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="px-3 py-1.5 h-8 border border-gray-200 rounded-lg bg-white text-sm focus:border-blue-500 focus:outline-none flex-shrink-0"
              >
                <option value="all">전체 현장</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1.5 h-8 border border-gray-200 rounded-lg bg-white text-sm focus:border-blue-500 focus:outline-none flex-shrink-0"
              >
                <option value="all">전체 상태</option>
                <option value="draft">임시저장</option>
                <option value="submitted">제출됨</option>
                <option value="approved">승인됨</option>
                <option value="rejected">반려됨</option>
              </select>
              
              <Button variant="outline" size="sm" onClick={loadReports} title="새로고침" className="flex-shrink-0">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)} title="통계" className="flex-shrink-0">
                <PieChart className="w-3 h-3" />
              </Button>
              <ExportButton 
                sites={sites}
                className="flex-shrink-0"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions for Search Mode */}
      {isSearchMode && (
        <Card className="bg-white border-0 shadow-sm p-3">
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsSearchMode(false)
                  setSearchResult(undefined)
                  loadReports()
                }}
                className="flex-shrink-0"
              >
                <X className="w-3 h-3 mr-1" />
                검색 해제
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)} title="통계" className="flex-shrink-0">
                <PieChart className="w-3 h-3" />
              </Button>
            </div>
            <ExportButton 
              sites={sites}
              className="flex-shrink-0"
            />
          </div>
        </Card>
      )}

      {/* Report List */}
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-base">작업일지를 불러오는 중...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-base mb-1">작업일지가 없습니다.</p>
            <p className="text-gray-500 text-sm mb-4">새로운 작업일지를 작성해보세요.</p>
            {canCreateReport && (
              <Link href="/dashboard/daily-reports/new">
                <Button variant="primary">
                  작업일지 작성하기
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredReports.map((report) => {
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
      </Card>
      </div>
    </div>
  )
}