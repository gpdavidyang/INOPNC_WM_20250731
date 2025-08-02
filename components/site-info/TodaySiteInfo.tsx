'use client'

import { useState, useEffect } from 'react'
import {
  MapPin, Home, Wrench, Copy, Navigation,
  ChevronDown, ChevronUp, Check, ExternalLink
} from 'lucide-react'
import { SiteInfo, AccommodationAddress, ProcessInfo } from '@/types/site-info'
import ManagerContacts from './ManagerContacts'
import { TMap } from '@/lib/external-apps'
import { useFontSize, getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface TodaySiteInfoProps {
  siteInfo: SiteInfo | null
  loading?: boolean
  error?: Error | null
}

interface SectionState {
  address: boolean
  accommodation: boolean
  process: boolean
  managers: boolean
}

const SECTION_STORAGE_KEY = 'site-info-sections'

export default function TodaySiteInfo({ siteInfo, loading, error }: TodaySiteInfoProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [expandedSections, setExpandedSections] = useState<SectionState>({
    address: true,
    accommodation: true,
    process: true,
    managers: true
  })
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Load saved preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SECTION_STORAGE_KEY)
    if (saved) {
      try {
        setExpandedSections(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load section preferences:', e)
      }
    }
  }, [])

  // Save preferences to localStorage
  const toggleSection = (section: keyof SectionState) => {
    const newState = {
      ...expandedSections,
      [section]: !expandedSections[section]
    }
    setExpandedSections(newState)
    localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(newState))
  }

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

  // Open T-Map navigation using the external-apps utility
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


  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${
        touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
      }`}>
        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-red-800 dark:text-red-200`}>
          현장 정보를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    )
  }

  if (!siteInfo) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg ${
        touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
      }`}>
        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>
          현재 배정된 현장이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className={`${
        touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
      } border-b border-gray-200 dark:border-gray-700`}>
        <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
          오늘의 현장 정보
        </h3>
        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400 mt-1`}>
          {siteInfo.name}
        </p>
      </div>

      {/* Site Address Section */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('address')}
          className={`w-full ${
            touchMode === 'glove' ? 'px-6 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
          } flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation`}
        >
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>현장 주소</span>
          </div>
          {expandedSections.address ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.address && (
          <div className={`${
            touchMode === 'glove' ? 'px-6 pb-6' : touchMode === 'precision' ? 'px-3 pb-3' : 'px-4 pb-4'
          } animate-in slide-in-from-top-1 duration-200`}>
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300 mb-3`}>
              {siteInfo.address.full_address}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(siteInfo.address.full_address, 'address')}
                className={`flex items-center gap-2 ${
                  touchMode === 'glove' ? 'px-5 py-3 min-h-[56px]' : 
                  touchMode === 'precision' ? 'px-3 py-1.5 min-h-[44px]' : 
                  'px-4 py-2 min-h-[48px]'
                } ${getFullTypographyClass('button', 'sm', isLargeFont)} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation`}
              >
                {copiedField === 'address' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>복사</span>
              </button>
              <button
                onClick={() => openTMap(siteInfo.address.full_address, siteInfo.name)}
                className={`flex items-center gap-2 ${
                  touchMode === 'glove' ? 'px-5 py-3 min-h-[56px]' : 
                  touchMode === 'precision' ? 'px-3 py-1.5 min-h-[44px]' : 
                  'px-4 py-2 min-h-[48px]'
                } ${getFullTypographyClass('button', 'sm', isLargeFont)} bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded-lg transition-colors touch-manipulation`}
              >
                <Navigation className="h-4 w-4" />
                <span>T-Map</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Accommodation Section */}
      {siteInfo.accommodation && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('accommodation')}
            className={`w-full ${
            touchMode === 'glove' ? 'px-6 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
          } flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation`}
          >
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>숙소 주소</span>
            </div>
            {expandedSections.accommodation ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.accommodation && (
            <div className={`${
              touchMode === 'glove' ? 'px-6 pb-6' : touchMode === 'precision' ? 'px-3 pb-3' : 'px-4 pb-4'
            } animate-in slide-in-from-top-1 duration-200`}>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 mb-1`}>
                {siteInfo.accommodation.accommodation_name}
              </p>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400 mb-3`}>
                {siteInfo.accommodation.full_address}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(siteInfo.accommodation!.full_address, 'accommodation')}
                  className={`flex items-center gap-2 ${
                  touchMode === 'glove' ? 'px-5 py-3 min-h-[56px]' : 
                  touchMode === 'precision' ? 'px-3 py-1.5 min-h-[44px]' : 
                  'px-4 py-2 min-h-[48px]'
                } ${getFullTypographyClass('button', 'sm', isLargeFont)} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors touch-manipulation`}
                >
                  {copiedField === 'accommodation' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>복사</span>
                </button>
                <button
                  onClick={() => openTMap(siteInfo.accommodation!.full_address, siteInfo.accommodation!.accommodation_name)}
                  className={`flex items-center gap-2 ${
                  touchMode === 'glove' ? 'px-5 py-3 min-h-[56px]' : 
                  touchMode === 'precision' ? 'px-3 py-1.5 min-h-[44px]' : 
                  'px-4 py-2 min-h-[48px]'
                } ${getFullTypographyClass('button', 'sm', isLargeFont)} bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded-lg transition-colors touch-manipulation`}
                >
                  <Navigation className="h-4 w-4" />
                  <span>T-Map</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Process Information Section */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => toggleSection('process')}
          className={`w-full ${
            touchMode === 'glove' ? 'px-6 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
          } flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation`}
        >
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>작업 공정</span>
          </div>
          {expandedSections.process ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.process && (
          <div className={`${
            touchMode === 'glove' ? 'px-6 pb-6' : touchMode === 'precision' ? 'px-3 pb-3' : 'px-4 pb-4'
          } animate-in slide-in-from-top-1 duration-200`}>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>부재:</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                  {siteInfo.process.member_name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>공정:</span>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                  {siteInfo.process.work_process}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>구간:</span>
                <div className="flex items-center gap-2">
                  <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
                    {siteInfo.process.work_section}
                  </span>
                  {siteInfo.process.drawing_id && (
                    <button
                      className={`p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors touch-manipulation ${
                        touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
                        touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
                        'min-w-[48px] min-h-[48px]'
                      } flex items-center justify-center`}
                      title="도면 보기"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manager Contacts Section */}
      <div className="mt-4">
        <ManagerContacts 
          managers={siteInfo.managers}
          expanded={expandedSections.managers}
          onExpandedChange={(expanded) => {
            const newState = {
              ...expandedSections,
              managers: expanded
            }
            setExpandedSections(newState)
            localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(newState))
          }}
        />
      </div>
    </div>
  )
}


// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
      </div>
      {[1, 2, 3, 4].map((i: any) => (
        <div key={i} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}