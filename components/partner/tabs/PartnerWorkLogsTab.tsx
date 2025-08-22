'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Search, Calendar, FileText, Eye, RefreshCw, Building2, Users, Package, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import WorkLogDetailModal from '../WorkLogDetailModal'
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'

interface PartnerWorkLogsTabProps {
  profile: Profile
  sites: any[]
}

interface WorkLog {
  id: string
  date: string
  siteId: string
  siteName?: string
  mainWork: string
  status: 'draft' | 'submitted'
  author: string
  weather?: string
  totalWorkers: number
  npc1000Used?: number
  issues?: string
}

export default function PartnerWorkLogsTab({ profile, sites }: PartnerWorkLogsTabProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadWorkLogs()
  }, [selectedSite, selectedStatus, dateRange])

  const loadWorkLogs = async () => {
    try {
      setLoading(true)
      
      // Generate recent dates for mock data
      const today = new Date()
      const getRecentDate = (daysAgo: number) => {
        const date = new Date(today)
        date.setDate(date.getDate() - daysAgo)
        return date.toISOString().split('T')[0]
      }
      
      // Mock data for demonstration - matching site manager's data structure
      const mockLogs: WorkLog[] = [
        {
          id: '1',
          date: getRecentDate(2),
          siteId: '1',
          siteName: '강남 A현장',
          mainWork: '기초 콘크리트 타설 작업',
          status: 'submitted',
          author: '김작업',
          weather: '맑음',
          totalWorkers: 12,
          npc1000Used: 250,
          issues: '콘크리트 타설 중 일부 균열 발생, 보수 완료'
        },
        {
          id: '2',
          date: getRecentDate(3),
          siteId: '2',
          siteName: '송파 B현장',
          mainWork: '철골 조립 작업',
          status: 'submitted',
          author: '이작업',
          weather: '흐림',
          totalWorkers: 8,
          npc1000Used: 180
        },
        {
          id: '3',
          date: getRecentDate(5),
          siteId: '1',
          siteName: '강남 A현장',
          mainWork: '방수 작업 진행',
          status: 'submitted',
          author: '박작업',
          weather: '비',
          totalWorkers: 5,
          npc1000Used: 120,
          issues: '우천으로 인한 작업 일부 지연'
        },
        {
          id: '4',
          date: getRecentDate(7),
          siteId: '3',
          siteName: '서초 C현장',
          mainWork: '내부 마감 작업',
          status: 'submitted',
          author: '최작업',
          weather: '맑음',
          totalWorkers: 15,
          npc1000Used: 320
        },
        {
          id: '5',
          date: getRecentDate(10),
          siteId: '2',
          siteName: '송파 B현장',
          mainWork: '전기 배선 작업',
          status: 'draft',
          author: '정전기',
          weather: '흐림',
          totalWorkers: 6,
          npc1000Used: 95
        },
        {
          id: '6',
          date: getRecentDate(12),
          siteId: '1',
          siteName: '강남 A현장',
          mainWork: '슬라브 타설 작업',
          status: 'submitted',
          author: '김현장',
          weather: '맑음',
          totalWorkers: 18,
          npc1000Used: 450,
          issues: '타설 작업 완료, 양생 진행 중'
        },
        {
          id: '7',
          date: getRecentDate(15),
          siteId: '1',
          siteName: '강남 A현장',
          mainWork: '지하층 골조 작업',
          status: 'submitted',
          author: '이작업',
          weather: '흐림',
          totalWorkers: 20,
          npc1000Used: 380
        },
        {
          id: '8',
          date: getRecentDate(18),
          siteId: '2',
          siteName: '송파 B현장',
          mainWork: '외벽 미장 작업',
          status: 'submitted',
          author: '박미장',
          weather: '맑음',
          totalWorkers: 10,
          npc1000Used: 220
        },
        {
          id: '9',
          date: getRecentDate(20),
          siteId: '1',
          siteName: '강남 A현장',
          mainWork: '배관 설치 작업',
          status: 'draft',
          author: '최배관',
          weather: '비',
          totalWorkers: 8,
          npc1000Used: 150,
          issues: '배관 규격 불일치로 재작업 필요'
        },
        {
          id: '10',
          date: getRecentDate(25),
          siteId: '3',
          siteName: '서초 C현장',
          mainWork: '천장 마감 작업',
          status: 'submitted',
          author: '정마감',
          weather: '맑음',
          totalWorkers: 12,
          npc1000Used: 280
        }
      ]
      
      // Filter by site
      let filtered = selectedSite === 'all' 
        ? mockLogs 
        : mockLogs.filter(log => log.siteId === selectedSite)
      
      // Filter by status
      if (selectedStatus !== 'all') {
        filtered = filtered.filter(log => log.status === selectedStatus)
      }
      
      // Filter by date range
      filtered = filtered.filter(log => {
        const logDate = new Date(log.date)
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        return logDate >= startDate && logDate <= endDate
      })
      
      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(log => 
          log.mainWork.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.siteName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
          (log.issues?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
        )
      }
      
      setWorkLogs(filtered)
    } catch (error) {
      console.error('Error loading work logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadWorkLogs()
  }

  const handleViewDetail = (log: WorkLog) => {
    setSelectedLog(log)
    setDetailModalOpen(true)
  }


  // Filter work logs based on search term and selected filters
  const filteredWorkLogs = workLogs

  // Get active filters for display
  const getActiveFilters = () => {
    const filters: { label: string; value: string; key: string }[] = []
    
    if (selectedSite !== 'all') {
      const site = sites?.find(s => s.id === selectedSite)
      filters.push({ 
        label: `현장: ${site?.name || '미지정'}`, 
        value: selectedSite, 
        key: 'site' 
      })
    }
    
    if (selectedStatus !== 'all') {
      const statusNames = {
        draft: '임시저장',
        submitted: '제출됨'
      }
      filters.push({ 
        label: `상태: ${statusNames[selectedStatus as keyof typeof statusNames]}`, 
        value: selectedStatus, 
        key: 'status' 
      })
    }
    
    if (searchTerm) {
      filters.push({ 
        label: `검색: ${searchTerm}`, 
        value: searchTerm, 
        key: 'search' 
      })
    }
    
    if (dateRange.start || dateRange.end) {
      let dateLabel = '기간: '
      if (dateRange.start && dateRange.end) {
        dateLabel += `${dateRange.start} ~ ${dateRange.end}`
      } else if (dateRange.start) {
        dateLabel += `${dateRange.start} 이후`
      } else if (dateRange.end) {
        dateLabel += `${dateRange.end} 이전`
      }
      filters.push({ 
        label: dateLabel, 
        value: `${dateRange.start}-${dateRange.end}`, 
        key: 'date' 
      })
    }
    
    return filters
  }

  const clearFilter = (key: string) => {
    switch (key) {
      case 'site':
        setSelectedSite('all')
        break
      case 'status':
        setSelectedStatus('all')
        break
      case 'search':
        setSearchTerm('')
        break
      case 'date':
        setDateRange({ start: '', end: '' })
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Compact Filters - Mobile Optimized (Matching Site Manager's Design) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        {/* Filter Header with Active Filters */}
        <div className="p-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <Filter className="w-4 h-4" />
              필터
              {!showFilters && getActiveFilters().length > 0 && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-1.5 py-0.5 rounded-full">
                  {getActiveFilters().length}
                </span>
              )}
            </button>
            
            {/* Active Filters Display when collapsed */}
            {!showFilters && getActiveFilters().length > 0 && (
              <div className="flex flex-wrap gap-1">
                {getActiveFilters().map((filter, index) => (
                  <div
                    key={`${filter.key}-${index}`}
                    className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs border border-blue-200 dark:border-blue-700"
                  >
                    <span>{filter.label}</span>
                    <button
                      onClick={() => clearFilter(filter.key)}
                      className="hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Filter Controls */}
        {showFilters && (
          <div className="p-3 space-y-2">
            {/* 현장선택 - 첫번째 */}
            <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
              <CustomSelectTrigger className="w-full h-10">
                <CustomSelectValue placeholder="현장 선택" />
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
            
            {/* 상태선택 - 두번째 */}
            <CustomSelect value={selectedStatus} onValueChange={setSelectedStatus}>
              <CustomSelectTrigger className="w-full h-10">
                <CustomSelectValue placeholder="상태 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">전체 상태</CustomSelectItem>
                <CustomSelectItem value="draft">임시저장</CustomSelectItem>
                <CustomSelectItem value="submitted">제출됨</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>

            {/* 기간 선택 - 세번째 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>기간 선택</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="text-sm px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  placeholder="시작일"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="text-sm px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                  placeholder="종료일"
                />
              </div>
              
              {/* Quick Date Presets */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => {
                    const today = new Date()
                    const oneWeekAgo = new Date(today)
                    oneWeekAgo.setDate(today.getDate() - 7)
                    setDateRange({
                      start: oneWeekAgo.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  최근 7일
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    const oneMonthAgo = new Date(today)
                    oneMonthAgo.setMonth(today.getMonth() - 1)
                    setDateRange({
                      start: oneMonthAgo.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  최근 1개월
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                    setDateRange({
                      start: startOfMonth.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                >
                  이번달
                </button>
                <button
                  onClick={() => setDateRange({ start: '', end: '' })}
                  className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 검색어 입력 - 네번째 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="부재명, 공정, 특이사항으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-between">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <RefreshCw className="w-3 h-3" />
                새로고침
              </button>
            </div>
          </div>
        )}
      </div>

      {/* High-Density Report List (Matching Site Manager's Design) */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400 text-sm">작업일지를 불러오는 중...</p>
        </div>
      ) : filteredWorkLogs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <FileText className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">작업일지가 없습니다.</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs">선택한 조건에 맞는 작업일지가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredWorkLogs.map((log) => {
              const statusConfig = {
                draft: { label: '임시저장', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
                submitted: { label: '제출됨', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
              }
              const status = statusConfig[log.status as keyof typeof statusConfig] || statusConfig.draft
              const siteName = sites.find(s => s.id === log.siteId)?.name || log.siteName || '미지정'

              return (
                <div key={log.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {format(new Date(log.date), 'yyyy.MM.dd', { locale: ko })}
                        </p>
                        <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          {siteName}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {log.totalWorkers}명
                        </span>
                        {log.npc1000Used && (
                          <span className="flex items-center">
                            <Package className="w-3 h-3 mr-1" />
                            {Math.round(log.npc1000Used)}kg
                          </span>
                        )}
                      </div>
                      {log.mainWork && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {log.mainWork}
                        </p>
                      )}
                      {log.issues && (
                        <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 line-clamp-1">
                          특이사항: {log.issues}
                        </p>
                      )}
                    </div>
                    <div className="ml-3 flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetail(log)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
                        title="상세보기"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Work Log Detail Modal */}
      <WorkLogDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedLog(null)
        }}
        workLog={selectedLog}
      />
    </div>
  )
}