'use client'

import { useState, useEffect, useMemo } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, Eye, Edit, Trash2, Search, Filter, Calendar,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  FileText, Clock, CheckCircle, XCircle, AlertTriangle,
  Building2, MoreHorizontal, Download, Copy
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WorkLogsTabProps {
  profile: Profile
}

interface WorkLog {
  id: string
  work_date: string
  site_name: string
  work_content: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  created_by_name: string
  site_id: string
}

interface Site {
  id: string
  name: string
}

interface SortConfig {
  key: keyof WorkLog | null
  direction: 'asc' | 'desc'
}

export default function WorkLogsTab({ profile }: WorkLogsTabProps) {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  const supabase = createClient()
  const router = useRouter()
  
  const canCreate = ['worker', 'site_manager'].includes(profile.role)
  const canBulkEdit = ['site_manager', 'admin', 'system_admin'].includes(profile.role)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadWorkLogs(), loadSites()])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWorkLogs = async () => {
    try {
      // Mock data for demo - in real implementation, this would fetch from Supabase
      const mockData: WorkLog[] = [
        {
          id: '1',
          work_date: '2024-08-01',
          site_name: '강남 A현장',
          work_content: '슬라브 타설 작업 진행, 3층 구조체 완료',
          status: 'draft',
          created_at: '2024-08-01T08:00:00Z',
          updated_at: '2024-08-01T10:30:00Z',
          created_by_name: '김철수',
          site_id: '1'
        },
        {
          id: '2',
          work_date: '2024-07-31',
          site_name: '강남 A현장',
          work_content: '기둥 거푸집 설치 및 철근 배근 작업',
          status: 'submitted',
          created_at: '2024-07-31T08:00:00Z',
          updated_at: '2024-07-31T17:00:00Z',
          created_by_name: '박현장',
          site_id: '1'
        },
        {
          id: '3',
          work_date: '2024-07-30',
          site_name: '송파 B현장',
          work_content: '외벽 단열재 시공 및 방수 작업 완료',
          status: 'approved',
          created_at: '2024-07-30T08:00:00Z',
          updated_at: '2024-07-30T16:00:00Z',
          created_by_name: '이작업',
          site_id: '2'
        },
        {
          id: '4',
          work_date: '2024-07-29',
          site_name: '서초 C현장',
          work_content: '지하층 굴착 작업 및 토공사',
          status: 'draft',
          created_at: '2024-07-29T08:00:00Z',
          updated_at: '2024-07-29T14:00:00Z',
          created_by_name: '최감독',
          site_id: '3'
        },
        {
          id: '5',
          work_date: '2024-07-28',
          site_name: '강남 A현장',
          work_content: '안전점검 및 품질관리 업무',
          status: 'approved',
          created_at: '2024-07-28T08:00:00Z',
          updated_at: '2024-07-28T15:30:00Z',
          created_by_name: '정안전',
          site_id: '1'
        }
      ]
      
      setWorkLogs(mockData)
    } catch (error) {
      console.error('Error loading work logs:', error)
    }
  }

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .order('name')

      if (!error && data) {
        setSites(data)
      } else {
        // Mock data fallback
        setSites([
          { id: '1', name: '강남 A현장' },
          { id: '2', name: '송파 B현장' },
          { id: '3', name: '서초 C현장' }
        ])
      }
    } catch (error) {
      console.error('Error loading sites:', error)
      setSites([
        { id: '1', name: '강남 A현장' },
        { id: '2', name: '송파 B현장' }
      ])
    }
  }

  // Filter and sort work logs
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = workLogs.filter(log => {
      const matchesSearch = log.work_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.created_by_name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSite = selectedSite === 'all' || log.site_id === selectedSite
      const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus
      
      let matchesDateRange = true
      if (dateRange.start && dateRange.end) {
        const logDate = new Date(log.work_date)
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        matchesDateRange = logDate >= startDate && logDate <= endDate
      }
      
      return matchesSearch && matchesSite && matchesStatus && matchesDateRange
    })

    // Primary sort by status (drafts first), secondary by date (newest first)
    filtered.sort((a, b) => {
      // Status priority: draft > submitted > approved > rejected
      const statusPriority = {
        'draft': 1,
        'submitted': 2,
        'approved': 3,
        'rejected': 4
      }
      
      const statusComparison = statusPriority[a.status] - statusPriority[b.status]
      if (statusComparison !== 0) return statusComparison
      
      // Secondary sort by date (newest first)
      return new Date(b.work_date).getTime() - new Date(a.work_date).getTime()
    })

    // Apply custom sorting if specified
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [workLogs, searchTerm, selectedSite, selectedStatus, dateRange, sortConfig])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage)
  const paginatedLogs = filteredAndSortedLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (key: keyof WorkLog) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (key: keyof WorkLog) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'submitted':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '작성중'
      case 'submitted': return '제출됨'
      case 'approved': return '승인됨'
      case 'rejected': return '반려됨'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'approved': return 'bg-green-50 text-green-700 border-green-200'
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLogs(paginatedLogs.map(log => log.id))
    } else {
      setSelectedLogs([])
    }
  }

  const handleSelectLog = (logId: string, checked: boolean) => {
    if (checked) {
      setSelectedLogs(prev => [...prev, logId])
    } else {
      setSelectedLogs(prev => prev.filter(id => id !== logId))
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action ${action} for logs:`, selectedLogs)
    // TODO: Implement bulk actions
    setSelectedLogs([])
  }

  const truncateText = (text: string, maxLength: number = 60) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">작업일지를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">작업일지 관리</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              전체 {filteredAndSortedLogs.length}건 | 작성중 {filteredAndSortedLogs.filter(l => l.status === 'draft').length}건
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => router.push('/dashboard/daily-reports/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
            >
              <Plus className="h-4 w-4" />
              새 작업일지
            </button>
          )}
        </div>

        {/* Search and Quick Filters - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span className="sm:inline">필터</span>
            {filtersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Expanded Filters */}
        {filtersExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg animate-in slide-in-from-top-1 duration-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">현장</label>
              <div className="relative">
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체 현장</option>
                  {sites.map((site: any) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 상태</option>
                <option value="draft">작성중</option>
                <option value="submitted">제출됨</option>
                <option value="approved">승인됨</option>
                <option value="rejected">반려됨</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">기간</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions - Mobile Optimized */}
        {canBulkEdit && selectedLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedLogs.length}개 항목 선택됨
            </span>
            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1 text-sm text-green-700 hover:text-green-800 transition-colors"
              >
                일괄 승인
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="px-3 py-1 text-sm text-blue-700 hover:text-blue-800 transition-colors"
              >
                내보내기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Work Log Table - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {paginatedLogs.map((log: any) => (
            <div key={log.id} className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(log.work_date)}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(log.status)}
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(log.status)}`}>
                        {getStatusText(log.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {log.site_name}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {log.work_content}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    작성자: {log.created_by_name}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => router.push(`/dashboard/daily-reports/${log.id}`)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="보기"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {log.status === 'draft' && (
                    <button
                      onClick={() => router.push(`/dashboard/daily-reports/${log.id}/edit`)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="편집"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {canBulkEdit && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={selectedLogs.includes(log.id)}
                      onChange={(e) => handleSelectLog(log.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    선택
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {canBulkEdit && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLogs.length === paginatedLogs.length && paginatedLogs.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('work_date')}
                >
                  <div className="flex items-center gap-1">
                    날짜
                    {getSortIcon('work_date')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('site_name')}
                >
                  <div className="flex items-center gap-1">
                    현장명
                    {getSortIcon('site_name')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업내용
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 hidden lg:table-cell"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    상태
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 hidden xl:table-cell"
                  onClick={() => handleSort('created_by_name')}
                >
                  <div className="flex items-center gap-1">
                    작성자
                    {getSortIcon('created_by_name')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {canBulkEdit && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log.id)}
                        onChange={(e) => handleSelectLog(log.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(log.work_date)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="block truncate max-w-[150px]" title={log.site_name}>
                      {log.site_name}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="block truncate max-w-[200px] lg:max-w-[300px]" title={log.work_content}>
                      {log.work_content}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(log.status)}`}>
                        {getStatusText(log.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                    {log.created_by_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/dashboard/daily-reports/${log.id}`)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="보기"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {log.status === 'draft' && (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/daily-reports/${log.id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                            title="편집"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('정말 삭제하시겠습니까?')) {
                                console.log('Delete log:', log.id)
                                // TODO: Implement delete
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors hidden sm:block"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State - Works for both mobile and desktop */}
        {filteredAndSortedLogs.length === 0 && (
          <div className="text-center py-12 px-4">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">작업일지가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || selectedSite !== 'all' || selectedStatus !== 'all' 
                ? '검색 조건을 변경해보세요.' 
                : '새로운 작업일지를 작성해보세요.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                -
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAndSortedLogs.length)}</span>
                {' '}of{' '}
                <span className="font-medium">{filteredAndSortedLogs.length}</span>
                {' '}결과
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}