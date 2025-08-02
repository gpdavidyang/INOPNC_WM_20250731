'use client'

import { useState, useEffect } from 'react'
import {
  MapPin, Home, Wrench, Copy, Navigation, User, Phone,
  ChevronDown, ChevronUp, Check, ExternalLink, ShieldCheck, Building2
} from 'lucide-react'
import { SiteInfo, AccommodationAddress, ProcessInfo } from '@/types/site-info'
import ManagerContacts from './ManagerContacts'
import { TMap } from '@/lib/external-apps'

interface TodaySiteInfoProps {
  siteInfo: SiteInfo | null
  loading?: boolean
  error?: Error | null
}

export default function TodaySiteInfo({ siteInfo, loading, error }: TodaySiteInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Open T-Map navigation
  const openTMap = async (address: string, name: string) => {
    const result = await TMap.navigate({ 
      name, 
      address,
      latitude: siteInfo?.address.latitude,
      longitude: siteInfo?.address.longitude
    })
    
    if (!result.success && result.error) {
      console.error('Failed to open T-Map:', result.error)
    }
  }

  // Make phone call
  const makePhoneCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`)
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
        <p className="text-sm text-red-800 dark:text-red-200">
          현장 정보를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    )
  }

  if (!siteInfo) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          현재 배정된 현장이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <section 
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      aria-labelledby="site-info-section"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <h2 id="site-info-section" className="text-base font-semibold text-gray-900 dark:text-gray-100">
          오늘의 현장 정보
        </h2>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-2">
        {/* Site Name & Address */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {siteInfo.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {siteInfo.address.full_address}
              </span>
              <button
                onClick={() => copyToClipboard(siteInfo.address.full_address, '현장주소')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="주소 복사"
              >
                <Copy className="h-3 w-3 text-gray-400" />
              </button>
              <button
                onClick={() => openTMap(siteInfo.address.full_address, siteInfo.name)}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                T맵지도
              </button>
            </div>
          </div>
        </div>

        {/* Accommodation if exists */}
        {siteInfo.accommodation && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Home className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span>숙소</span>
            <span className="text-gray-400">•</span>
            <span>{siteInfo.accommodation.full_address}</span>
            <button
              onClick={() => copyToClipboard(siteInfo.accommodation!.full_address, '숙소주소')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="주소 복사"
            >
              <Copy className="h-3 w-3 text-gray-400" />
            </button>
            <button
              onClick={() => openTMap(siteInfo.accommodation!.full_address, '숙소')}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              T맵지도
            </button>
          </div>
        )}

        {/* Work Details */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Wrench className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span>
            {siteInfo.process.member_name} / 
            {siteInfo.process.work_process} / 
            {siteInfo.process.work_section}
          </span>
        </div>

        {/* Manager Contacts - Reordered */}
        {siteInfo.managers && siteInfo.managers.length > 0 && (
          <div className="space-y-1">
            {/* Construction Manager first */}
            {siteInfo.managers.filter((manager: any) => manager.role === 'construction_manager').map((manager: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">건축관리자</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {manager.name || '김건축'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    {manager.phone || '010-1234-5678'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(manager.phone || '010-1234-5678', '전화번호')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="전화번호 복사"
                  >
                    <Copy className="h-3 w-3 text-gray-400" />
                  </button>
                  <button
                    onClick={() => makePhoneCall(manager.phone || '010-1234-5678')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="전화"
                  >
                    <Phone className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </button>
                </div>
              </div>
            ))}
            {/* Safety Manager second */}
            {siteInfo.managers.filter((manager: any) => manager.role === 'safety_manager').map((manager: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">안전관리자</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {manager.name || '이안전'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    {manager.phone || '010-8765-4321'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(manager.phone || '010-8765-4321', '전화번호')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="전화번호 복사"
                  >
                    <Copy className="h-3 w-3 text-gray-400" />
                  </button>
                  <button
                    onClick={() => makePhoneCall(manager.phone || '010-8765-4321')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="전화"
                  >
                    <Phone className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}
    </section>
  )
}


// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
      </div>
    </div>
  )
}