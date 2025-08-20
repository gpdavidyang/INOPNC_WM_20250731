'use client'

import { useState, useEffect } from 'react'
import {
  MapPin, Home, Wrench, Copy, Navigation, User, Phone,
  ChevronDown, ChevronUp, Check, ExternalLink, ShieldCheck, Building2,
  FileText, Map, Download, X, Eye
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SiteInfo, AccommodationAddress, ProcessInfo } from '@/types/site-info'
import ManagerContacts from './ManagerContacts'
import { TMap } from '@/lib/external-apps'
import { getSiteDocumentsPTWAndBlueprint, SiteDocument } from '@/app/actions/site-documents'

interface TodaySiteInfoProps {
  siteInfo: SiteInfo | null
  loading?: boolean
  error?: Error | null
}

export default function TodaySiteInfo({ siteInfo, loading, error }: TodaySiteInfoProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showBlueprintModal, setShowBlueprintModal] = useState(false)
  const [showPTWModal, setShowPTWModal] = useState(false)
  const [pdfLoadError, setPdfLoadError] = useState(false)
  const [pdfTimeout, setPdfTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Dynamic document state
  const [siteDocuments, setSiteDocuments] = useState<{
    ptw_document: SiteDocument | null
    blueprint_document: SiteDocument | null
  } | null>(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)

  // Fetch documents when siteInfo changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!siteInfo?.id) {
        setSiteDocuments(null)
        return
      }

      setDocumentsLoading(true)
      try {
        const result = await getSiteDocumentsPTWAndBlueprint(siteInfo.id)
        if (result.success && result.data) {
          setSiteDocuments(result.data)
        } else {
          console.error('Failed to fetch site documents:', result.error)
          setSiteDocuments(null)
        }
      } catch (error) {
        console.error('Error fetching site documents:', error)
        setSiteDocuments(null)
      } finally {
        setDocumentsLoading(false)
      }
    }

    fetchDocuments()
  }, [siteInfo?.id])

  // Reset PDF load error when modal is opened
  useEffect(() => {
    if (showPTWModal) {
      setPdfLoadError(false)
      // Set timeout to detect PDF loading failure
      const timeout = setTimeout(() => {
        setPdfLoadError(true)
      }, 5000) // 5 seconds timeout
      setPdfTimeout(timeout)
    } else {
      // Clean up timeout when modal is closed
      if (pdfTimeout) {
        clearTimeout(pdfTimeout)
        setPdfTimeout(null)
      }
    }
    
    return () => {
      if (pdfTimeout) {
        clearTimeout(pdfTimeout)
      }
    }
  }, [showPTWModal])

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
      <Card elevation="sm" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 theme-transition">
        <CardContent>
          <p className="text-sm text-red-800 dark:text-red-200">
            현장 정보를 불러오는 중 오류가 발생했습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!siteInfo) {
    return (
      <Card elevation="sm" className="theme-transition border border-gray-200 dark:border-gray-700 shadow-md bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50">
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            현재 배정된 현장이 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      variant="elevated"
      elevation="md"
      className="overflow-hidden transition-all duration-200"
      aria-labelledby="site-info-section"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 id="site-info-section" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              오늘의 현장 정보
            </h2>
            <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-medium">
              {siteInfo.name}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">{/* 내용이 펼쳐질 때만 보이도록 */}
        
        <div className="space-y-3">
          {/* Site Address */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100">현장 주소</span>
              <div className="flex-1"></div>
              <button
                onClick={() => copyToClipboard(siteInfo.address.full_address, '현장주소')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="주소 복사"
              >
                <Copy className="h-3.5 w-3.5 text-gray-400" />
              </button>
              <button
                onClick={() => openTMap(siteInfo.address.full_address, siteInfo.name)}
                className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                T맵
              </button>
            </div>
            <div className="pl-6 text-[11px] text-gray-600 dark:text-gray-400">
              {siteInfo.address.full_address}
            </div>
          </div>

          {/* Accommodation if exists */}
          {siteInfo.accommodation && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">숙소</span>
                <div className="flex-1"></div>
                <button
                  onClick={() => copyToClipboard(siteInfo.accommodation!.full_address, '숙소주소')}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  title="주소 복사"
                >
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <button
                  onClick={() => openTMap(siteInfo.accommodation!.full_address, '숙소')}
                  className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  T맵
                </button>
              </div>
              <div className="pl-6 text-[11px] text-gray-600 dark:text-gray-400">
                {siteInfo.accommodation.full_address}
              </div>
            </div>
          )}

          {/* Manager Contacts */}
          {siteInfo.managers && siteInfo.managers.length > 0 && (
            <>
              {/* Construction Manager first */}
              {siteInfo.managers.filter((manager: any) => manager.role === 'construction_manager').map((manager: any, index: number) => (
                <div key={index} className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">건축관리자</span>
                    <div className="flex-1"></div>
                    <button
                      onClick={() => copyToClipboard(manager.phone, '전화번호')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="전화번호 복사"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => makePhoneCall(manager.phone)}
                      className="p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      title="전화"
                    >
                      <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </button>
                  </div>
                  <div className="pl-6 text-[11px] text-gray-600 dark:text-gray-400">
                    {manager.name} • {manager.phone}
                  </div>
                </div>
              ))}
              {/* Safety Manager second */}
              {siteInfo.managers.filter((manager: any) => manager.role === 'safety_manager').map((manager: any, index: number) => (
                <div key={index} className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">안전관리자</span>
                    <div className="flex-1"></div>
                    <button
                      onClick={() => copyToClipboard(manager.phone, '전화번호')}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="전화번호 복사"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                    <button
                      onClick={() => makePhoneCall(manager.phone)}
                      className="p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      title="전화"
                    >
                      <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </button>
                  </div>
                  <div className="pl-6 text-[11px] text-gray-600 dark:text-gray-400">
                    {manager.name} • {manager.phone}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Work Details */}
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">작업내용</span>
            <span className="text-[11px] text-gray-600 dark:text-gray-400 flex-1 ml-2">
              {siteInfo.process.work_process} • {siteInfo.process.work_section}
            </span>
          </div>

          {/* Blueprint Document */}
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">현장 공도면</span>
            <div className="flex-1"></div>
            <button
              onClick={() => setShowBlueprintModal(true)}
              className="px-2 py-1 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="도면 보기"
            >
              미리보기
            </button>
          </div>

          {/* PTW Document Preview */}
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">PTW (작업허가서)</span>
            <div className="flex-1"></div>
            <button
              onClick={() => setShowPTWModal(true)}
              className="px-2 py-1 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="작업허가서 보기"
            >
              미리보기
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Blueprint Modal - Mobile Optimized */}
      {showBlueprintModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm pb-16 sm:pb-0">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-slide-up sm:animate-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                도면 - 강남 A현장
              </h3>
              <button
                onClick={() => setShowBlueprintModal(false)}
                className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-140px)] sm:max-h-[calc(90vh-140px)]">
              {/* Document Info Card */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Map className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      지하 1층 구간 도면
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      도면번호: BP-2025-{siteInfo.id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
                
                {/* Document Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">작업장소</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {siteInfo.name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">작업일자</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date().toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">작업내용</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {siteInfo.process.work_process} - {siteInfo.process.work_section}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">작업자</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {siteInfo.process.member_name}
                    </p>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Blueprint Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <Map className="h-4 w-4" />
                        <span>도면 미리보기</span>
                      </div>
                      {siteInfo.blueprint_document ? (
                        <img 
                          src={siteInfo.blueprint_document.file_url} 
                          alt={siteInfo.blueprint_document.title || "현장 도면"}
                          className="w-full h-auto rounded border border-gray-200 dark:border-gray-700"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/docs/샘플도면5.png'; // Fallback image
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">도면이 등록되지 않았습니다</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Actions */}
            <div className="flex gap-3 p-4 sm:p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = siteInfo.blueprint_document?.file_url || '/docs/샘플도면5.png'
                  link.download = siteInfo.blueprint_document?.file_name || `도면_${siteInfo.name}_${new Date().toISOString().split('T')[0]}.png`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 active:bg-gray-800 transition-colors font-medium shadow-sm"
                disabled={!siteInfo.blueprint_document}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                PTW 작업허가서
              </h3>
              <button
                onClick={() => setShowPTWModal(false)}
                className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-140px)] sm:max-h-[calc(90vh-140px)]">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      작업허가서 (Permit To Work)
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      문서번호: PTW-2025-{siteInfo.id?.slice(0, 8)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">작업장소</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {siteInfo.name}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">작업일자</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {new Date().toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">작업내용</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {siteInfo.process.work_process} - {siteInfo.process.work_section}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">작업자</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {siteInfo.process.member_name}
                    </p>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* PTW Document Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <FileText className="h-4 w-4" />
                        <span>PTW 문서 미리보기</span>
                      </div>
                      
                      {/* Enhanced PDF Viewer - Using browser native PDF support */}
                      <div className="w-full h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
                        {/* Primary: Use iframe with browser PDF viewer */}
                        {!pdfLoadError && siteInfo.ptw_document && (
                          <iframe
                            src={`${siteInfo.ptw_document.file_url}#view=FitH&toolbar=1&navpanes=0&scrollbar=1`}
                            className="w-full h-full"
                            title={siteInfo.ptw_document.title || "PTW 작업허가서"}
                            style={{
                              border: 'none',
                              background: '#f9fafb'
                            }}
                            onLoad={() => {
                              // PDF loaded successfully
                              setPdfLoadError(false)
                              if (pdfTimeout) {
                                clearTimeout(pdfTimeout)
                                setPdfTimeout(null)
                              }
                            }}
                            onError={() => {
                              // Show fallback on error
                              setPdfLoadError(true)
                            }}
                          />
                        )}
                        
                        {/* Fallback: PDF Document Thumbnail or No Document Message */}
                        <div 
                          className={`w-full h-full flex-col items-center justify-center space-y-4 p-6 bg-white dark:bg-gray-800 ${(pdfLoadError || !siteInfo.ptw_document) ? 'flex' : 'hidden'} absolute inset-0`}
                        >
                          {/* Enhanced PDF Thumbnail Simulation */}
                          <div className="w-full max-w-xs h-48 bg-gradient-to-b from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden relative">
                            {/* PDF Header */}
                            <div className="bg-gray-600 text-white text-xs px-2 py-1.5 font-semibold">
                              작업허가서(PTW) - INOPNC
                            </div>
                            
                            {/* PDF Content Preview */}
                            <div className="p-2.5 space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">업체명:</span>
                                <span className="text-gray-800 dark:text-gray-200">H서비스 남부팀</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">작성자:</span>
                                <span className="text-gray-800 dark:text-gray-200">김재형</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">현장명:</span>
                                <span className="text-gray-800 dark:text-gray-200">{siteInfo.name}</span>
                              </div>
                              <div className="h-px bg-gray-200 dark:bg-gray-600 my-2"></div>
                              
                              {/* Table simulation */}
                              <div className="space-y-1">
                                <div className="bg-blue-100 dark:bg-blue-900/40 rounded text-xs p-1.5 text-center font-semibold text-blue-800 dark:text-blue-200">
                                  작업허가서 승인 현황
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  <div className="bg-green-50 dark:bg-green-900/30 p-1.5 text-center rounded border border-green-200 dark:border-green-700">
                                    <div className="font-medium text-green-800 dark:text-green-200">허가</div>
                                  </div>
                                  <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 text-center rounded border border-blue-200 dark:border-blue-700">
                                    <div className="font-medium text-blue-800 dark:text-blue-200">검토완료</div>
                                  </div>
                                </div>
                                <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                                  {new Date().toLocaleDateString('ko-KR')} 승인
                                </div>
                              </div>
                            </div>
                            
                            {/* PDF Footer */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-700 text-xs text-center py-1 text-gray-600 dark:text-gray-400 font-medium">
                              PTW-2025-{siteInfo.id?.slice(0, 8)} • Page 1
                            </div>
                          </div>
                          
                          <div className="text-center space-y-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {siteInfo.ptw_document ? 'PTW 작업허가서' : 'PTW 문서 없음'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {siteInfo.ptw_document ? '이노피앤씨 표준 양식 • PDF 문서' : 'PTW 문서가 등록되지 않았습니다'}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="font-medium">승인 완료</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => {
                                setPdfLoadError(false)
                                window.location.reload()
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors shadow-sm"
                            >
                              <Eye className="h-4 w-4" />
                              다시 시도
                            </button>
                            <button
                              onClick={() => window.open(siteInfo.ptw_document?.file_url || '/docs/PTW.pdf', '_blank')}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors shadow-sm"
                              disabled={!siteInfo.ptw_document}
                            >
                              <ExternalLink className="h-4 w-4" />
                              새 창에서 보기
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>문서번호: PTW-2025-{siteInfo.id?.slice(0, 8)}</span>
                        {siteInfo.ptw_document && (
                          <button
                            onClick={() => window.open(siteInfo.ptw_document!.file_url, '_blank')}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                          >
                            새 창에서 열기
                          </button>
                        )}
                      </div>
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
                  link.href = siteInfo.ptw_document?.file_url || '/docs/PTW.pdf'
                  link.download = siteInfo.ptw_document?.file_name || `PTW_${siteInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 active:bg-gray-800 transition-colors font-medium shadow-sm"
                disabled={!siteInfo.ptw_document}
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
    </Card>
  )
}


// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse" />
        <div className="h-3.5 w-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
      </div>
    </div>
  )
}