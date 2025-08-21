'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, MapPin, Phone, Calendar, Users, 
  FileText, FolderOpen, DollarSign, Camera,
  CheckSquare, FileSignature, Map, X, Clock,
  Copy, ExternalLink, ClipboardList
} from 'lucide-react'
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

  return (
    <div className="space-y-4">
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

      {/* Site Participation History - Matching Screenshot */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            현장 참여 목록
            <span className="ml-2 text-sm font-normal text-gray-500">
              5개 현장
            </span>
          </h2>
        </div>
        
        <div className="p-5 space-y-1">
          {/* First Site - Selected with blue bar */}
          <button
            onClick={() => setSelectedSite(sites[0]?.id || '1')}
            className={`w-full text-left p-4 rounded-lg transition-all relative ${
              selectedSite === (sites[0]?.id || '1')
                ? 'bg-gray-50 dark:bg-gray-700/50' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            {selectedSite === (sites[0]?.id || '1') && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
            )}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    강남 A현장
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    현재
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    현장관리자
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  서울시 강남구 테헤란로 456
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  슬라브 타설 • 지하 1층
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  25. 08. 17.
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  진행중
                </div>
              </div>
            </div>
          </button>
          
          {/* Second Site */}
          <button
            onClick={() => setSelectedSite('site-2')}
            className={`w-full text-left p-4 rounded-lg transition-all relative ${
              selectedSite === 'site-2'
                ? 'bg-gray-50 dark:bg-gray-700/50' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            {selectedSite === 'site-2' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
            )}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    송파 C현장
                  </span>
                  <span className="text-xs text-gray-500">
                    작업자
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  서울시 송파구 올림픽로...
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  25. 08. 10. ~ 25. 08. 17.
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  진행중
                </div>
              </div>
            </div>
          </button>
          
          {/* Third Site */}
          <button
            onClick={() => setSelectedSite('site-3')}
            className={`w-full text-left p-4 rounded-lg transition-all relative ${
              selectedSite === 'site-3'
                ? 'bg-gray-50 dark:bg-gray-700/50' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            {selectedSite === 'site-3' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
            )}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    강남 A...
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    현장관리자
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  25. 08. 07. ~ 25. 08. 17.
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  진행중
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Selected Site Details - Matching Screenshot */}
      {selectedSite && selectedSite !== 'all' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                현장 상세정보
                <span className="ml-2 text-sm font-normal text-blue-600">
                  강남 A현장
                </span>
              </h2>
              <button
                onClick={() => setSelectedSite('all')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">현장 주소</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    서울시 강남구 테헤란로 456
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button className="p-1">
                      <Copy className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="p-1">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Period */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">참여 기간</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      2025. 8. 17.
                    </span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      현재 참여중
                    </span>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">담당 역할</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    현장관리자
                  </div>
                </div>
              </div>

              {/* Work Info */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">작업 내용</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    슬라브 타설 • 지하 1층
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">현장 상태</div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      진행중
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Documents Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-sm">기성청구함</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {billingDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg
                      hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {doc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {getDocumentTypeName(doc.type)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {doc.uploadDate}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}