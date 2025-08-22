'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Navigation } from 'lucide-react'
import { 
  Building2, Building, MapPin, Phone, Calendar, Users, 
  FileText, FolderOpen, DollarSign, Camera,
  CheckSquare, FileSignature, Map, X, Clock,
  Copy, ExternalLink, ClipboardList, Eye, Download, Share2, MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  CustomSelect,
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'

interface PartnerSiteInfoTabProps {
  profile: Profile
  sites: any[]
}

interface BillingDocument {
  id: string
  type: string
  name: string
  uploadDate: string
  icon: React.ReactNode
}

export default function PartnerSiteInfoTab({ profile, sites }: PartnerSiteInfoTabProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current_month')
  const [previewDocument, setPreviewDocument] = useState<BillingDocument | null>(null)
  
  // Mock site details
  const siteDetails = {
    id: selectedSite,
    name: sites.find(s => s.id === selectedSite)?.name || '강남 A현장',
    address: sites.find(s => s.id === selectedSite)?.address || '서울특별시 강남구 테헤란로 123',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    progress: 65,
    manager: {
      name: '김현장',
      phone: '010-1234-5678'
    },
    safetyManager: {
      name: '이안전',
      phone: '010-2345-6789'
    },
    workerCount: 24,
    contractAmount: '5.2억',
    currentSpent: '3.4억'
  }

  // Mock billing documents
  const billingDocuments: BillingDocument[] = [
    {
      id: '1',
      type: 'estimate',
      name: '견적서_2024년3월.pdf',
      uploadDate: '2024-03-15',
      icon: <DollarSign className="h-5 w-5 text-green-500" />
    },
    {
      id: '2', 
      type: 'construction_plan',
      name: '시공계획서_강남A현장.pdf',
      uploadDate: '2024-01-10',
      icon: <FileText className="h-5 w-5 text-blue-500" />
    },
    {
      id: '3',
      type: 'tax_invoice',
      name: '전자세금계산서_202403.pdf',
      uploadDate: '2024-03-18',
      icon: <FileSignature className="h-5 w-5 text-purple-500" />
    },
    {
      id: '4',
      type: 'photo_document',
      name: '사진대지문서_3월.pdf',
      uploadDate: '2024-03-17',
      icon: <Camera className="h-5 w-5 text-orange-500" />
    },
    {
      id: '5',
      type: 'contract',
      name: '계약서_강남A현장.pdf',
      uploadDate: '2024-01-05',
      icon: <FileSignature className="h-5 w-5 text-red-500" />
    },
    {
      id: '6',
      type: 'completion',
      name: '작업완료확인서_3월2주차.pdf',
      uploadDate: '2024-03-14',
      icon: <CheckSquare className="h-5 w-5 text-green-500" />
    },
    {
      id: '7',
      type: 'blueprint',
      name: '진행도면_v2.pdf',
      uploadDate: '2024-03-10',
      icon: <Map className="h-5 w-5 text-indigo-500" />
    }
  ]

  const getDocumentTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      estimate: '견적서',
      construction_plan: '시공계획서',
      tax_invoice: '전자세금계산서',
      photo_document: '사진대지문서',
      contract: '계약서',
      completion: '작업완료확인서',
      blueprint: '진행도면'
    }
    return types[type] || type
  }

  const handlePreview = (doc: BillingDocument) => {
    setPreviewDocument(doc)
  }

  const handleDownload = async (doc: BillingDocument) => {
    try {
      // Mock download - in real implementation, this would download from actual URL
      const link = document.createElement('a')
      link.href = `/api/documents/download/${doc.id}` // Mock URL
      link.download = doc.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`${doc.name} 다운로드를 시작합니다.`)
    } catch (error) {
      toast.error('다운로드 중 오류가 발생했습니다.')
    }
  }

  const handleShare = async (doc: BillingDocument) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: doc.name,
          text: `${getDocumentTypeName(doc.type)} - ${doc.name}`,
          url: window.location.href
        })
      } else {
        // Fallback - copy link to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/documents/${doc.id}`)
        toast.success('문서 링크가 클립보드에 복사되었습니다.')
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('공유 중 오류가 발생했습니다.')
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Site Selector Dropdown - Enhanced Size */}
      <div className="relative">
        <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
          <CustomSelectTrigger className="w-full pl-10 pr-4 py-2 h-10 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <CustomSelectValue placeholder="전체 현장" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="all">전체 현장</CustomSelectItem>
            {sites.map((site) => (
              <CustomSelectItem key={site.id} value={site.id}>
                {site.name}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
        <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>

      {/* Period Selector Dropdown - Enhanced Size */}
      <div className="relative">
        <CustomSelect value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <CustomSelectTrigger className="w-full pl-10 pr-4 py-2 h-10 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <CustomSelectValue placeholder="금월" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="current_month">금월</CustomSelectItem>
            <CustomSelectItem value="recent_3">최근 3개월</CustomSelectItem>
            <CustomSelectItem value="recent_6">최근 6개월</CustomSelectItem>
            <CustomSelectItem value="recent_12">최근 12개월</CustomSelectItem>
            <CustomSelectItem value="recent_24">최근 24개월</CustomSelectItem>
            <CustomSelectItem value="all">전체 기간</CustomSelectItem>
          </CustomSelectContent>
        </CustomSelect>
        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>

      {/* Site Participation History - Enhanced UI matching Site Manager */}
      <Card elevation="sm" className="theme-transition overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 참여 목록</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">총 5개 현장</span>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {/* First Site - Enhanced UI with proper font sizes */}
          <div 
            className={cn(
              "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors",
              selectedSite === (sites[0]?.id || '1') && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500"
            )}
            onClick={() => setSelectedSite(sites[0]?.id || '1')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    강남 A현장
                  </h4>
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] rounded-full inline-flex items-center",
                    "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  )}>
                    현재
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] rounded-full inline-flex items-center",
                    "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  )}>
                    현장관리자
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">서울시 강남구 테헤란로 456</p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  <span>슬라브 타설</span>
                  <span className="mx-1">•</span>
                  <span>지하 1층</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  25. 08. 17.
                </div>
                <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                  진행중
                </div>
              </div>
            </div>
          </div>
          
          {/* Second Site */}
          <div 
            className={cn(
              "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors",
              selectedSite === 'site-2' && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500"
            )}
            onClick={() => setSelectedSite('site-2')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    송파 C현장
                  </h4>
                  <span className="text-xs text-gray-500">
                    작업자
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">서울시 송파구 올림픽로 300</p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  <span>철골 조립</span>
                  <span className="mx-1">•</span>
                  <span>지상 3층</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  25. 08. 10. ~ 25. 08. 17.
                </div>
                <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                  진행중
                </div>
              </div>
            </div>
          </div>
          
          {/* Third Site */}
          <div 
            className={cn(
              "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors",
              selectedSite === 'site-3' && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500"
            )}
            onClick={() => setSelectedSite('site-3')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    서초 B현장
                  </h4>
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] rounded-full inline-flex items-center",
                    "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                  )}>
                    현장관리자
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">서울시 서초구 서초대로 789</p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  <span>배관 설치</span>
                  <span className="mx-1">•</span>
                  <span>지하 2층</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  25. 08. 07. ~ 25. 08. 17.
                </div>
                <div className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                  완료
                </div>
              </div>
            </div>
          </div>

          {/* Fourth Site */}
          <div 
            className={cn(
              "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors",
              selectedSite === 'site-4' && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500"
            )}
            onClick={() => setSelectedSite('site-4')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    성남 D현장
                  </h4>
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] rounded-full inline-flex items-center",
                    "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                  )}>
                    감독관
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">경기도 성남시 분당구 판교로 234</p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  <span>전기 배선</span>
                  <span className="mx-1">•</span>
                  <span>지상 5층</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  25. 07. 20. ~ 25. 08. 05.
                </div>
                <div className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  중지
                </div>
              </div>
            </div>
          </div>

          {/* Fifth Site */}
          <div 
            className={cn(
              "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors",
              selectedSite === 'site-5' && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500"
            )}
            onClick={() => setSelectedSite('site-5')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    용인 E현장
                  </h4>
                  <span className="text-xs text-gray-500">
                    작업자
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">경기도 용인시 수지구 용구대로 567</p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  <span>마감 공사</span>
                  <span className="mx-1">•</span>
                  <span>지상 1층</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  25. 06. 01. ~ 25. 07. 15.
                </div>
                <div className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                  완료
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Selected Site Details - Enhanced UI */}
      {selectedSite && selectedSite !== 'all' && (
        <>
          <Card elevation="sm" className="theme-transition overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 상세정보</h3>
                  <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                    {selectedSite === 'site-2' ? '송파 C현장' : 
                     selectedSite === 'site-3' ? '서초 B현장' :
                     selectedSite === 'site-4' ? '성남 D현장' :
                     selectedSite === 'site-5' ? '용인 E현장' : '강남 A현장'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSite('all')}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800">
              <div className="space-y-2.5">
              {/* Location */}
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">현장 주소</span>
                <p className="text-sm text-gray-900 dark:text-gray-100 break-words flex-1 min-w-0">
                  {selectedSite === 'site-2' ? '서울시 송파구 올림픽로 300' : 
                   selectedSite === 'site-3' ? '서울시 서초구 서초대로 789' :
                   selectedSite === 'site-4' ? '경기도 성남시 분당구 판교로 234' :
                   selectedSite === 'site-5' ? '경기도 용인시 수지구 용구대로 567' : 
                   '서울시 강남구 테헤란로 456'}
                </p>
                <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0" 
                  onClick={() => {
                    const address = selectedSite === 'site-2' ? '서울시 송파구 올림픽로 300' : 
                                   selectedSite === 'site-3' ? '서울시 서초구 서초대로 789' :
                                   selectedSite === 'site-4' ? '경기도 성남시 분당구 판교로 234' :
                                   selectedSite === 'site-5' ? '경기도 용인시 수지구 용구대로 567' : 
                                   '서울시 강남구 테헤란로 456';
                    navigator.clipboard.writeText(address);
                  }}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0 text-blue-600" 
                  onClick={() => {
                    const address = selectedSite === 'site-2' ? '서울시 송파구 올림픽로 300' : 
                                   selectedSite === 'site-3' ? '서울시 서초구 서초대로 789' :
                                   selectedSite === 'site-4' ? '경기도 성남시 분당구 판교로 234' :
                                   selectedSite === 'site-5' ? '경기도 용인시 수지구 용구대로 567' : 
                                   '서울시 강남구 테헤란로 456';
                    window.open(`https://tmapapi.sktelecom.com/main.html#weblink/search?query=${encodeURIComponent(address)}`);
                  }}>
                  <Navigation className="h-3 w-3" />
                </Button>
              </div>

              {/* Period */}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">참여 기간</span>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {selectedSite === 'site-2' ? '2025.08.10 ~ 2025.08.17' : 
                   selectedSite === 'site-3' ? '2025.08.07 ~ 2025.08.17' :
                   selectedSite === 'site-4' ? '2025.07.20 ~ 2025.08.05' :
                   selectedSite === 'site-5' ? '2025.06.01 ~ 2025.07.15' : 
                   '2025.08.17'}
                  {(selectedSite === (sites[0]?.id || '1') || selectedSite === 'site-2') && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                      현재 참여중
                    </span>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">담당 역할</span>
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  (selectedSite === (sites[0]?.id || '1') || selectedSite === 'site-3') 
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : selectedSite === 'site-4'
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                )}>
                  {(selectedSite === (sites[0]?.id || '1') || selectedSite === 'site-3') ? '현장관리자' : 
                   selectedSite === 'site-4' ? '감독관' : '작업자'}
                </span>
              </div>

              {/* Work Info */}
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">작업 내용</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {selectedSite === 'site-2' ? '철골 조립 • 지상 3층' : 
                     selectedSite === 'site-3' ? '배관 설치 • 지하 2층' :
                     selectedSite === 'site-4' ? '전기 배선 • 지상 5층' :
                     selectedSite === 'site-5' ? '마감 공사 • 지상 1층' : 
                     '슬라브 타설 • 지하 1층'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">현장 상태</span>
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  (selectedSite === (sites[0]?.id || '1') || selectedSite === 'site-2') 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : (selectedSite === 'site-3' || selectedSite === 'site-5')
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                )}>
                  {(selectedSite === (sites[0]?.id || '1') || selectedSite === 'site-2') ? '진행중' :
                   (selectedSite === 'site-3' || selectedSite === 'site-5') ? '완료' : '중지'}
                </span>
              </div>
              </div>
            </div>
          </Card>

          {/* Billing Documents Section - Optimized for Mobile */}
          <Card className="mt-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm">기성청구함</CardTitle>
                </div>
                <span className="text-xs text-gray-500">
                  총 {billingDocuments.length}개 문서
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {billingDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
                      hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    {/* Document Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">
                        {doc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getDocumentTypeName(doc.type)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {doc.uploadDate}
                        </p>
                      </div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePreview(doc)}
                        title="미리보기"
                      >
                        <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="sr-only">미리보기</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(doc)}
                        title="다운로드"
                      >
                        <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="sr-only">다운로드</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleShare(doc)}
                        title="공유"
                      >
                        <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="sr-only">공유</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Document Preview Modal */}
          {previewDocument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewDocument(null)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {previewDocument.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {getDocumentTypeName(previewDocument.type)}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {previewDocument.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(previewDocument)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      다운로드
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(previewDocument)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      공유
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPreviewDocument(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Document Preview Content */}
                <div className="p-8 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {previewDocument.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        문서 미리보기가 여기에 표시됩니다
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
                        실제 구현시 PDF Viewer 또는 이미지 뷰어가 표시됩니다
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}