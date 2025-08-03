'use client'

import { useState, useEffect } from 'react'
import {
  MapPin, Home, Wrench, Copy, Navigation, User, Phone,
  ChevronDown, ChevronUp, Check, ExternalLink, ShieldCheck, Building2,
  FileText, Map, Download, X, Eye
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
  const [showBlueprintModal, setShowBlueprintModal] = useState(false)
  const [showPTWModal, setShowPTWModal] = useState(false)

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
                T맵
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
              T맵
            </button>
          </div>
        )}

        {/* Work Details with Blueprint Icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Wrench className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span>
              {siteInfo.process.member_name} / 
              {siteInfo.process.work_process} / 
              {siteInfo.process.work_section}
            </span>
          </div>
          <button
            onClick={() => setShowBlueprintModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="도면 보기"
          >
            <Map className="h-3 w-3" />
            <span>도면</span>
          </button>
        </div>

        {/* PTW Document Preview */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-2">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span>PTW (작업허가서)</span>
          </div>
          <button
            onClick={() => setShowPTWModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
            title="작업허가서 보기"
          >
            <Eye className="h-3 w-3" />
            <span>미리보기</span>
          </button>
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

      {/* Blueprint Modal - Mobile Optimized */}
      {showBlueprintModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm pb-16 sm:pb-0">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-slide-up sm:animate-none">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                도면 - {siteInfo.name}
              </h3>
              <button
                onClick={() => setShowBlueprintModal(false)}
                className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-140px)] sm:max-h-[calc(90vh-140px)]">
              {/* Blueprint Image */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                <img 
                  src="/docs/샘플도면5.png" 
                  alt={`${siteInfo.process.work_section} 구간 도면`}
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {siteInfo.process.work_section} 구간 시공 도면
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  도면을 핀치하여 확대/축소할 수 있습니다
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => {
                  // Download blueprint image
                  const link = document.createElement('a')
                  link.href = '/docs/샘플도면5.png'
                  link.download = `${siteInfo.name}_${siteInfo.process.work_section}_도면.png`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
              >
                <Download className="h-4 w-4" />
                <span>다운로드</span>
              </button>
              <button
                onClick={() => setShowBlueprintModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PTW Modal - Mobile Optimized */}
      {showPTWModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm pb-16 sm:pb-0">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-slide-up sm:animate-none">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                PTW 작업허가서
              </h3>
              <button
                onClick={() => setShowPTWModal(false)}
                className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-140px)] sm:max-h-[calc(90vh-140px)]">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                      작업허가서 (Permit To Work)
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      문서번호: PTW-2025-{siteInfo.id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">작업장소</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                        {siteInfo.name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">작업일자</p>
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                        {new Date().toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">작업내용</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                      {siteInfo.process.work_process} - {siteInfo.process.work_section}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">작업자</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                      {siteInfo.process.member_name}
                    </p>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* PTW PDF Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <FileText className="h-4 w-4" />
                        <span>PTW 양식 문서</span>
                      </div>
                      <iframe 
                        src="/docs/[양식]PTW양식_이노피앤씨.pdf"
                        className="w-full h-[400px] mt-2 rounded border border-gray-200 dark:border-gray-700"
                        title="PTW 문서"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => {
                  // Download PTW PDF
                  const link = document.createElement('a')
                  link.href = '/docs/[양식]PTW양식_이노피앤씨.pdf'
                  link.download = `PTW_${siteInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors font-medium"
              >
                <Download className="h-4 w-4" />
                <span>다운로드</span>
              </button>
              <button
                onClick={() => setShowPTWModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors font-medium"
              >
                닫기
              </button>
            </div>
          </div>
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