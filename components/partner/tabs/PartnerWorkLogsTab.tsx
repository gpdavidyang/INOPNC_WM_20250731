'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, Calendar, Building2, Search, 
  Eye, CheckCircle, Filter,
  ChevronDown, ChevronUp
} from 'lucide-react'

interface PartnerWorkLogsTabProps {
  profile: Profile
  sites: any[]
}

interface WorkLog {
  id: string
  date: string
  site_name: string
  site_id: string
  title: string
  status: 'submitted'
  author: string
  weather: string
  worker_count: number
}

export default function PartnerWorkLogsTab({ profile, sites }: PartnerWorkLogsTabProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadWorkLogs()
  }, [selectedSite, dateRange])

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
      
      // Mock data for demonstration - only showing submitted logs with recent dates
      const mockLogs: WorkLog[] = [
        {
          id: '1',
          date: getRecentDate(2), // 2 days ago
          site_name: '강남 A현장',
          site_id: '1',
          title: '기초 콘크리트 타설 작업',
          status: 'submitted',
          author: '김작업',
          weather: '맑음',
          worker_count: 12
        },
        {
          id: '2',
          date: getRecentDate(3), // 3 days ago
          site_name: '송파 B현장',
          site_id: '2',
          title: '철골 조립 작업',
          status: 'submitted',
          author: '이작업',
          weather: '흐림',
          worker_count: 8
        },
        {
          id: '3',
          date: getRecentDate(5), // 5 days ago
          site_name: '강남 A현장',
          site_id: '1',
          title: '방수 작업 진행',
          status: 'submitted',
          author: '박작업',
          weather: '비',
          worker_count: 5
        },
        {
          id: '4',
          date: getRecentDate(7), // 1 week ago
          site_name: '서초 C현장',
          site_id: '3',
          title: '내부 마감 작업',
          status: 'submitted',
          author: '최작업',
          weather: '맑음',
          worker_count: 15
        },
        {
          id: '5',
          date: getRecentDate(10), // 10 days ago
          site_name: '송파 B현장',
          site_id: '2',
          title: '전기 배선 작업',
          status: 'submitted',
          author: '정전기',
          weather: '흐림',
          worker_count: 6
        },
        {
          id: '6',
          date: getRecentDate(12), // 12 days ago
          site_name: '강남 A현장',
          site_id: '1',
          title: '슬라브 타설 작업',
          status: 'submitted',
          author: '김현장',
          weather: '맑음',
          worker_count: 18
        },
        {
          id: '7',
          date: getRecentDate(15), // 15 days ago
          site_name: '강남 A현장',
          site_id: '1',
          title: '지하층 골조 작업',
          status: 'submitted',
          author: '이작업',
          weather: '흐림',
          worker_count: 20
        },
        {
          id: '8',
          date: getRecentDate(18), // 18 days ago
          site_name: '송파 B현장',
          site_id: '2',
          title: '외벽 미장 작업',
          status: 'submitted',
          author: '박미장',
          weather: '맑음',
          worker_count: 10
        },
        {
          id: '9',
          date: getRecentDate(20), // 20 days ago
          site_name: '강남 A현장',
          site_id: '1',
          title: '배관 설치 작업',
          status: 'submitted',
          author: '최배관',
          weather: '비',
          worker_count: 8
        },
        {
          id: '10',
          date: getRecentDate(25), // 25 days ago
          site_name: '서초 C현장',
          site_id: '3',
          title: '천장 마감 작업',
          status: 'submitted',
          author: '정마감',
          weather: '맑음',
          worker_count: 12
        }
      ]
      
      // Filter by site
      let filtered = selectedSite === 'all' 
        ? mockLogs 
        : mockLogs.filter(log => log.site_id === selectedSite)
      
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
          log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.site_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      setWorkLogs(filtered)
    } catch (error) {
      console.error('Error loading work logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadWorkLogs()
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section - Matching Manager's Style */}
      <section 
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
        aria-labelledby="work-logs-heading"
      >
        {/* Search and Quick Filters - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-2" role="search" aria-label="검색 및 필터">
          <div className="flex-1 relative">
            <label htmlFor="search-input" className="sr-only">작업일지 검색</label>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              id="search-input"
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[36px]"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              작업일지 내용, 현장명, 작성자명으로 검색할 수 있습니다
            </div>
          </div>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center justify-start gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[36px] text-xs"
            aria-expanded={filtersExpanded}
            aria-controls="filter-panel"
            aria-label={filtersExpanded ? "상세 필터 숨기기" : "상세 필터 표시"}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span>필터</span>
            {filtersExpanded ? 
              <ChevronUp className="h-4 w-4" aria-hidden="true" /> : 
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            }
          </button>
        </div>

        {/* Expanded Filters */}
        {filtersExpanded && (
          <div 
            id="filter-panel"
            className="mt-3"
            role="region"
            aria-label="필터 옵션"
          >
            {/* 현장 선택 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
              <button
                onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
                className="w-full flex items-center justify-between text-left p-3"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {selectedSite === 'all' ? '전체 현장' : sites.find(s => s.id === selectedSite)?.name || '전체 현장'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${siteDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {siteDropdownOpen && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setSelectedSite('all')
                      setSiteDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedSite === 'all' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    전체 현장
                  </button>
                  {sites.map(site => (
                    <button
                      key={site.id}
                      onClick={() => {
                        setSelectedSite(site.id)
                        setSiteDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedSite === site.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {site.name}
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* 기간 선택 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">기간 선택</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">시작일</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">종료일</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick date selection buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    const today = new Date()
                    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                    setDateRange({
                      start: lastWeek.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  최근 7일
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                    setDateRange({
                      start: lastMonth.toISOString().split('T')[0],
                      end: today.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  최근 1개월
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                    setDateRange({
                      start: firstDayOfMonth.toISOString().split('T')[0],
                      end: lastDayOfMonth.toISOString().split('T')[0]
                    })
                  }}
                  className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  이번달
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    setDateRange({
                      start: '',
                      end: ''
                    })
                  }}
                  className="px-2.5 py-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* Work Logs List - Matching Manager Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-sm text-gray-500">데이터를 불러오는 중...</div>
            </div>
          ) : workLogs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">작업일지가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                선택한 조건에 맞는 작업일지가 없습니다
              </p>
            </div>
          ) : (
            workLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {log.date}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full border border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        제출됨
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-medium">{log.site_name}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {log.title}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>작성자: {log.author}</span>
                      <span>인원: {log.worker_count}명</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="보기"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  현장명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업내용
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">
                  작성자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : workLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">작업일지가 없습니다</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      선택한 조건에 맞는 작업일지가 없습니다
                    </p>
                  </td>
                </tr>
              ) : (
                workLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {log.date}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="block truncate max-w-[150px]" title={log.site_name}>
                        {log.site_name}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="block truncate max-w-[200px] lg:max-w-[300px]" title={log.title}>
                        {log.title}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="px-2 py-1 text-xs font-medium rounded-full border border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                          제출됨
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 hidden xl:table-cell">
                      {log.author}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="보기"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}