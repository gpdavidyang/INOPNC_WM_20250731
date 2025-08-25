'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Site } from '@/types'
import { PlusIcon, BuildingOfficeIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline'
import SiteUnifiedManagement from './SiteUnifiedManagement'

export default function SiteManagementList() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchSites = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      setSites(data || [])
    } catch (err) {
      console.error('Error fetching sites:', err)
      setError('현장 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  const handleSiteSelect = (site: Site) => {
    setSelectedSite(site)
  }

  const handleBack = () => {
    setSelectedSite(null)
    fetchSites() // Refresh list when returning
  }

  const handleSiteUpdate = (updatedSite: Site) => {
    setSites(prevSites => 
      prevSites.map(site => site.id === updatedSite.id ? updatedSite : site)
    )
    setSelectedSite(updatedSite)
  }

  const handleRefresh = () => {
    fetchSites()
  }

  // If a site is selected, show the unified management component
  if (selectedSite) {
    return (
      <SiteUnifiedManagement
        site={selectedSite}
        onBack={handleBack}
        onSiteUpdate={handleSiteUpdate}
        onRefresh={handleRefresh}
      />
    )
  }

  // Otherwise, show the site list
  return (
    <div>
      {/* Header with create button */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">전체 현장 목록</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            총 {sites.length}개의 현장이 등록되어 있습니다.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            새 현장 등록
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">로딩 중...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-8 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Site grid */}
      {!loading && !error && (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <div
              key={site.id}
              onClick={() => handleSiteSelect(site)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {site.name}
                    </h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPinIcon className="mr-1 h-4 w-4" />
                      {site.address || '주소 미등록'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="mr-1 h-4 w-4" />
                    {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '시작일 미정'}
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    site.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : site.status === 'completed'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {site.status === 'active' ? '진행중' : site.status === 'completed' ? '완료' : '준비중'}
                  </span>
                </div>

                {site.description && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {site.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sites.length === 0 && (
        <div className="mt-8 text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">현장이 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">새 현장을 등록하여 시작하세요.</p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              새 현장 등록
            </button>
          </div>
        </div>
      )}
    </div>
  )
}