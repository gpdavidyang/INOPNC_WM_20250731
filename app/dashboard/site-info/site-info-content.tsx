'use client'

import { useState, useEffect } from 'react'
import { CurrentUserSite, UserSiteHistory, SiteInfo } from '@/types'
import { getCurrentUserSite, getUserSiteHistory } from '@/app/actions/site-info'
import TodaySiteInfo from '@/components/site-info/TodaySiteInfo'
import { RefreshCw, Clock, Search } from 'lucide-react'
import SiteSearchModal from '@/components/site-info/SiteSearchModal'
import { assignUserToSite } from '@/app/actions/site-info'
import { createClient } from '@/lib/supabase/client'
import { useFontSize, getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface SiteInfoContentProps {
  initialCurrentSite: CurrentUserSite | null
  initialSiteHistory: UserSiteHistory[]
}

export default function SiteInfoContent({ 
  initialCurrentSite, 
  initialSiteHistory 
}: SiteInfoContentProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [currentSite, setCurrentSite] = useState<CurrentUserSite | null>(initialCurrentSite)
  const [siteHistory, setSiteHistory] = useState<UserSiteHistory[]>(initialSiteHistory)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  // Convert CurrentUserSite to SiteInfo format
  const convertToSiteInfo = (site: CurrentUserSite | null): SiteInfo | null => {
    if (!site) return null

    return {
      id: site.site_id,
      name: site.site_name,
      address: {
        id: site.site_id,
        site_id: site.site_id,
        full_address: site.site_address || '주소 정보 없음',
        latitude: undefined,
        longitude: undefined,
        postal_code: undefined
      },
      accommodation: site.accommodation_address ? {
        id: site.site_id,
        site_id: site.site_id,
        accommodation_name: site.accommodation_name || '숙소',
        full_address: site.accommodation_address,
        latitude: undefined,
        longitude: undefined
      } : undefined,
      process: {
        member_name: site.component_name || '미정',
        work_process: site.work_process || '미정',
        work_section: site.work_section || '미정',
        drawing_id: undefined
      },
      managers: [
        ...(site.construction_manager_phone ? [{
          role: 'construction_manager' as const,
          name: site.manager_name || '현장 소장',
          phone: site.construction_manager_phone
        }] : []),
        ...(site.safety_manager_phone ? [{
          role: 'safety_manager' as const,
          name: site.safety_manager_name || '안전 관리자',
          phone: site.safety_manager_phone
        }] : [])
      ],
      construction_period: {
        start_date: site.start_date,
        end_date: site.end_date || ''
      },
      is_active: site.site_status === 'active'
    }
  }

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true)
    setError(null)
    
    try {
      const [currentSiteResult, historyResult] = await Promise.all([
        getCurrentUserSite(),
        getUserSiteHistory()
      ])
      
      if (currentSiteResult.success) {
        setCurrentSite(currentSiteResult.data)
      } else {
        setCurrentSite(null)
      }

      if (historyResult.success) {
        setSiteHistory(historyResult.data || [])
      } else {
        setError('현장 이력을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('Error refreshing site data:', error)
      setError('데이터를 새로고침하는데 실패했습니다.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  // Handle site selection from search modal
  const handleSelectSite = async (siteId: string) => {
    if (!userId) return
    
    try {
      setShowSearchModal(false)
      setLoading(true)
      setError(null)
      
      const result = await assignUserToSite(userId, siteId, 'worker')
      
      if (!result.success) {
        setError(result.error || '현장 변경에 실패했습니다.')
        return
      }
      
      // Refresh site info
      await refreshData()
    } catch (err) {
      console.error('Error switching site:', err)
      setError('현장 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Convert site info for display
  const siteInfo = convertToSiteInfo(currentSite)

  // Touch-responsive padding
  const getPadding = () => {
    if (touchMode === 'glove') return 'p-6 sm:p-8'
    if (touchMode === 'precision') return 'p-3 sm:p-4'
    return 'p-4 sm:p-6'
  }

  return (
    <div className={`space-y-6 ${getPadding()} max-w-7xl mx-auto`}>
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`${getFullTypographyClass('heading', isLargeFont ? '3xl' : '2xl', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>
            현장정보
          </h1>
          <p className={`mt-1 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>
            현재 배정된 현장의 정보를 확인하세요
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearchModal(true)}
            className={`flex items-center gap-2 ${
              touchMode === 'glove' ? 'px-5 py-3 min-h-[56px]' : 
              touchMode === 'precision' ? 'px-3 py-1.5 min-h-[44px]' : 
              'px-4 py-2 min-h-[48px]'
            } bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${getTypographyClass('base', isLargeFont)}`}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">현장 변경</span>
          </button>
          
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className={`flex items-center gap-2 ${
              touchMode === 'glove' ? 'px-5 py-3 min-h-[56px]' : 
              touchMode === 'precision' ? 'px-3 py-1.5 min-h-[44px]' : 
              'px-4 py-2 min-h-[48px]'
            } bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 ${getTypographyClass('base', isLargeFont)}`}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-red-800 dark:text-red-200`}>
            {error}
          </p>
        </div>
      )}

      {/* Current Site Information - Using TodaySiteInfo Component */}
      <TodaySiteInfo 
        siteInfo={siteInfo}
        loading={loading}
        error={error ? new Error(error) : null}
      />

      {/* Site History - Mobile Optimized - Always Show */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className={`${
          touchMode === 'glove' ? 'px-6 sm:px-8 py-4 sm:py-5' : 
          touchMode === 'precision' ? 'px-3 sm:px-4 py-2 sm:py-3' : 
          'px-4 sm:px-6 py-3 sm:py-4'
        } bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>현장 참여 이력</h2>
            </div>
            <span className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
              {siteHistory.length > 0 ? `${siteHistory.length}개 현장` : '0개 현장'}
            </span>
          </div>
        </div>
        
        {/* Content */}
        {loading ? (
          // Loading State
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>현장 이력을 불러오는 중...</p>
            </div>
          </div>
        ) : siteHistory.length === 0 ? (
          // Empty State
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className={`${getFullTypographyClass('heading', 'base', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                  참여한 현장이 없습니다
                </h3>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400 max-w-xs`}>
                  아직 배정된 현장이 없거나 현장 참여 이력이 없습니다.
                </p>
              </div>
              <button
                onClick={() => setShowSearchModal(true)}
                className={`flex items-center gap-2 ${
                  touchMode === 'glove' ? 'px-6 py-3 min-h-[56px]' : 
                  touchMode === 'precision' ? 'px-3 py-1.5 min-h-[44px]' : 
                  'px-4 py-2 min-h-[48px]'
                } bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${getFullTypographyClass('button', 'base', isLargeFont)} font-medium transition-colors touch-manipulation`}
              >
                <Search className="h-4 w-4" />
                현장 찾기
              </button>
            </div>
          </div>
        ) : (
          // Site History List
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {siteHistory.map((site, index) => (
              <div key={`${site.site_id}-${index}`} className={`${
                touchMode === 'glove' ? 'p-6 sm:p-8' : 
                touchMode === 'precision' ? 'p-3 sm:p-4' : 
                'p-4 sm:p-6'
              } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className={`${getFullTypographyClass('heading', 'base', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                        {site.site_name}
                      </h3>
                      {site.is_active && (
                        <span className={`px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 ${getFullTypographyClass('caption', 'xs', isLargeFont)} rounded-full`}>
                          현재
                        </span>
                      )}
                      <span className={`px-2 py-0.5 ${getFullTypographyClass('caption', 'xs', isLargeFont)} rounded-full ${
                        site.user_role === 'site_manager' 
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : site.user_role === 'supervisor'
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {site.user_role === 'site_manager' ? '현장관리자' : 
                         site.user_role === 'supervisor' ? '감독관' : '작업자'}
                      </span>
                    </div>
                    <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400 mb-2 line-clamp-2`}>{site.site_address}</p>
                    
                    {(site.work_process || site.work_section) && (
                      <div className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} text-gray-500 dark:text-gray-500`}>
                        {site.work_process && <span>{site.work_process}</span>}
                        {site.work_process && site.work_section && <span className="mx-1 sm:mx-2">•</span>}
                        {site.work_section && <span>{site.work_section}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400 mb-1`}>
                      {new Date(site.assigned_date).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                      {site.unassigned_date && !site.is_active && (
                        <>
                          <span className="mx-1 sm:mx-2">~</span>
                          {new Date(site.unassigned_date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </>
                      )}
                    </div>
                    <div className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} ${
                      site.site_status === 'active' 
                        ? 'text-green-600 dark:text-green-400'
                        : site.site_status === 'completed'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {site.site_status === 'active' ? '진행중' :
                       site.site_status === 'completed' ? '완료' : '중지'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Button (for future pagination) */}
            {siteHistory.length >= 10 && (
              <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
                <button className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors`}>
                  더 보기 ({siteHistory.length}개 중 10개 표시)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Site Search Modal */}
      <SiteSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSelectSite={handleSelectSite}
        currentSiteId={siteInfo?.id}
      />
    </div>
  )
}