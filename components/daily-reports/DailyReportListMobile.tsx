'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import {
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  AlertCircle,
  X,
  Building2,
  FileText,
  Eye,
  Edit
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTouchMode } from '@/contexts/TouchModeContext'
import type { DailyReport, Site, Profile } from '@/types'
import Link from 'next/link'
import { showErrorNotification } from '@/lib/error-handling'
import { getDailyReports } from '@/app/actions/daily-reports'

interface DailyReportListMobileProps {
  currentUser: Profile
  sites: Site[]
}


export function DailyReportListMobile({ currentUser, sites = [] }: DailyReportListMobileProps) {
  const { touchMode } = useTouchMode()
  
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [dateRange, setDateRange] = useState(() => ({
    from: '2025-07-01',
    to: '2025-08-31'
  }))

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = {}
      
      if (selectedSite !== 'all') {
        filters.site_id = selectedSite
      }
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus
      }
      
      if (dateRange.from) {
        filters.start_date = dateRange.from
      }
      
      if (dateRange.to) {
        filters.end_date = dateRange.to
      }

      const result = await getDailyReports(filters)
      
      if (result.success && result.data) {
        const reportData = result.data as DailyReport[]
        setReports(reportData)

      } else {
        showErrorNotification(result.error || '일일보고서를 불러오는데 실패했습니다.', 'loadReports')
        setReports([])
      }
    } catch (error) {
      showErrorNotification(error, 'loadReports')
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [selectedSite, selectedStatus, dateRange])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.process_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issues?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSite = selectedSite === 'all' || report.site_id === selectedSite
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus
    
    return matchesSearch && matchesSite && matchesStatus
  })

  const canCreateReport = ['worker', 'site_manager', 'admin'].includes(currentUser.role)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: '임시저장', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <Badge className={cn('text-xs px-2 py-0.5', config.className)}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">작업일지</h2>
          {canCreateReport && (
            <Link href="/dashboard/daily-reports/new">
              <span className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
                새 작업일지
              </span>
            </Link>
          )}
        </div>
      </div>


      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-3">
          {/* Search Bar */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-lg"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between w-full p-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>필터</span>
              {(selectedSite !== 'all' || selectedStatus !== 'all') && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-1.5 py-0.5">
                  {[selectedSite !== 'all', selectedStatus !== 'all'].filter(Boolean).length}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
          </button>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-2 space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
                <CustomSelectTrigger className={cn(
                  "w-full",
                  touchMode === 'glove' && "min-h-[60px] text-base",
                  touchMode === 'precision' && "min-h-[44px] text-sm",
                  touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                )}>
                  <CustomSelectValue placeholder="전체 현장" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 현장</CustomSelectItem>
                  {sites?.map((site) => (
                    <CustomSelectItem key={site.id} value={site.id}>
                      {site.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>

              <CustomSelect value={selectedStatus} onValueChange={setSelectedStatus}>
                <CustomSelectTrigger className={cn(
                  "w-full",
                  touchMode === 'glove' && "min-h-[60px] text-base",
                  touchMode === 'precision' && "min-h-[44px] text-sm",
                  touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                )}>
                  <CustomSelectValue placeholder="전체 상태" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="all">전체 상태</CustomSelectItem>
                  <CustomSelectItem value="draft">임시저장</CustomSelectItem>
                  <CustomSelectItem value="submitted">제출됨</CustomSelectItem>
                  <CustomSelectItem value="approved">승인됨</CustomSelectItem>
                  <CustomSelectItem value="rejected">반려됨</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
          )}
        </div>
      </div>

      {/* Report List */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">작업일지를 불러오는 중...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">작업일지가 없습니다.</p>
          {canCreateReport && (
            <Link href="/dashboard/daily-reports/new">
              <Button className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                작업일지 작성하기
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredReports.map((report: any) => {
            const site = (report as any).site || sites?.find(s => s.id === report.site_id)
            const canEdit = currentUser.id === report.created_by && report.status === 'draft'
            
            return (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-shadow"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {format(new Date(report.work_date), 'MM월 dd일', { locale: ko })}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Building2 className="h-3 w-3" />
                      <span>{site?.name || '미지정'}</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/daily-reports/${report.id}`}>
                    <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </Link>
                </div>


                {/* Work Content */}
                <div className="space-y-1 mb-2">
                  {/* 작업내용 표시 */}
                  {(report.member_name || report.process_type) && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        작업내용1: {[
                          report.member_name,
                          report.process_type
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* 작업자 정보 표시 */}
                  {report.total_workers && report.total_workers > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        총 작업자: {report.total_workers}명
                      </span>
                    </div>
                  )}
                </div>


                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(report.created_at), 'yyyy.MM.dd HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/daily-reports/${report.id}`}>
                      <Button variant="ghost" size="compact" className="h-7 w-7 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {canEdit && (
                      <Link href={`/dashboard/daily-reports/${report.id}/edit`}>
                        <Button variant="ghost" size="compact" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}