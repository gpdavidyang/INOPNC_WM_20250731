'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  MapPin, 
  Users,
  Building,
  Clock,
  FileText,
  Download,
  ExternalLink,
  Package,
  Search,
  ChevronUp,
  ChevronDown,
  Copy,
  Phone
} from 'lucide-react'
import { CurrentUserSite, UserSiteHistory, Profile } from '@/types'
import { selectUserSite } from '@/app/actions/site-info'
import { MaterialManagementSimplified } from '@/components/materials/material-management-simplified'
import { getMaterials, getMaterialCategories, getMaterialInventory } from '@/app/actions/materials'
import { PageContainer, LoadingState, EmptyState } from '@/components/dashboard/page-layout'

interface SiteInfoPageNewProps {
  initialCurrentSite: CurrentUserSite | null
  initialSiteHistory: UserSiteHistory[]
  currentUser: Profile
}

export default function SiteInfoPageNew({
  initialCurrentSite,
  initialSiteHistory,
  currentUser
}: SiteInfoPageNewProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // State
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSite, setSelectedSite] = useState<CurrentUserSite | null>(initialCurrentSite)
  const [siteHistory] = useState<UserSiteHistory[]>(initialSiteHistory)
  const [loading, setLoading] = useState(false)
  const [siteHistoryExpanded, setSiteHistoryExpanded] = useState(true)
  
  // Materials data for NPC-1000 tab
  const [materials, setMaterials] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)

  // Auto-select first site if none selected
  useEffect(() => {
    if (!selectedSite && siteHistory.length > 0) {
      const firstSite = siteHistory[0]
      handleSiteSelect(firstSite.site_id)
    }
  }, [selectedSite, siteHistory])

  // Load materials data when NPC-1000 tab is activated or site changes
  useEffect(() => {
    if (activeTab === 'materials' && selectedSite) {
      loadMaterialsData()
    }
  }, [activeTab, selectedSite])

  const loadMaterialsData = async () => {
    if (!selectedSite) return
    
    setMaterialsLoading(true)
    try {
      const [materialsResult, categoriesResult] = await Promise.all([
        getMaterials(),
        getMaterialCategories()
      ])

      if (materialsResult.success) setMaterials(materialsResult.data || [])
      if (categoriesResult.success) setCategories(categoriesResult.data || [])

      // Get inventory for selected site
      const inventoryResult = await getMaterialInventory(selectedSite.site_id)
      if (inventoryResult.success) setInventory(inventoryResult.data || [])
      
    } catch (error) {
      console.error('Error loading materials data:', error)
    } finally {
      setMaterialsLoading(false)
    }
  }

  const handleSiteSelect = async (siteId: string) => {
    const targetSite = siteHistory.find(site => site.site_id === siteId)
    if (!targetSite) return

    setLoading(true)
    try {
      const result = await selectUserSite(siteId)
      
      if (result.success) {
        // Create CurrentUserSite from history data
        const currentSite: CurrentUserSite = {
          site_id: targetSite.site_id,
          site_name: targetSite.site_name,
          site_address: targetSite.site_address,
          site_status: targetSite.site_status,
          start_date: targetSite.start_date,
          end_date: targetSite.end_date,
          assigned_date: targetSite.assigned_date,
          user_role: targetSite.user_role,
          work_process: targetSite.work_process,
          work_section: targetSite.work_section,
          component_name: null,
          manager_name: null,
          construction_manager_phone: null,
          safety_manager_name: null,
          safety_manager_phone: null,
          accommodation_name: null,
          accommodation_address: null,
          // Documents 
          ptw_document_id: null,
          ptw_document_title: 'PTW (작업허가서)',
          ptw_document_url: '/docs/PTW.pdf',
          ptw_document_filename: 'PTW.pdf',
          ptw_document_mime_type: 'application/pdf',
          blueprint_document_id: null,
          blueprint_document_title: '현장 공도면',
          blueprint_document_url: '/docs/샘플도면3.jpeg',
          blueprint_document_filename: '샘플도면3.jpeg',
          blueprint_document_mime_type: 'image/jpeg'
        }
        setSelectedSite(currentSite)
      }
    } catch (error) {
      console.error('Site selection failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // UI 크기 계산 - UI Guidelines 기준
  const getTabHeight = () => {
    if (touchMode === 'glove') return 'min-h-[60px]' // Construction field standard
    if (touchMode === 'precision') return 'min-h-[44px]' // Dense layout
    return 'min-h-[48px]' // Standard mobile
  }

  const getButtonHeight = () => {
    if (touchMode === 'glove') return 'h-[60px]' // Construction field
    if (touchMode === 'precision') return 'h-[44px]' // Dense layout
    return 'h-[48px]' // Standard
  }

  const getCardPadding = () => {
    if (touchMode === 'glove') return 'p-4'
    return 'p-3'
  }

  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field' // 60px height
    if (touchMode === 'precision') return 'compact' // 44px height  
    return isLargeFont ? 'standard' : 'compact' // 48px standard
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '미정'
    return new Date(dateStr).toLocaleDateString('ko-KR')
  }

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '연락처 없음'
    return phone
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const makePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`)
  }

  if (loading) {
    return (
      <PageContainer>
        <LoadingState message="현장 정보를 불러오는 중..." />
      </PageContainer>
    )
  }


  return (
    <PageContainer className="px-px sm:px-6 lg:px-8">
      
      {/* Tabs - Compact Layout - Moved to top */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-1">
        <TabsList className={`grid w-full grid-cols-2 ${getTabHeight()} gap-1 mb-4`}>
          <TabsTrigger 
            value="overview" 
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 ${getTabHeight()}`}
          >
            <MapPin className={getIconSize()} />
            <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} sm:text-sm text-center`}>
              현장 개요
            </span>
          </TabsTrigger>
          <TabsTrigger 
            value="materials" 
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 ${getTabHeight()}`}
          >
            <Package className={getIconSize()} />
            <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} sm:text-sm text-center`}>
              NPC-1000 관리
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Site Selection Dropdown - Moved below tabs */}
        <div className="mb-20">
          <Select value={selectedSite?.site_id || ''} onValueChange={handleSiteSelect}>
            <SelectTrigger className={`
              w-full sm:w-[300px] 
              ${touchMode === 'glove' ? 'min-h-[60px]' : 
                touchMode === 'precision' ? 'min-h-[44px]' : 
                'min-h-[48px]'
              }
              ${getFullTypographyClass('body', 'sm', isLargeFont)}
            `}>
              <SelectValue placeholder="현장을 선택하세요" />
            </SelectTrigger>
            <SelectContent 
              className={`
                ${touchMode === 'glove' ? 'p-2' : 'p-1'}
                max-w-[90vw] sm:max-w-none
                bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700
                shadow-lg backdrop-blur-sm
                z-50
              `}
              sideOffset={4}
            >
              {siteHistory.map((site) => (
                <SelectItem 
                  key={site.site_id} 
                  value={site.site_id}
                  className={`
                    ${touchMode === 'glove' ? 'min-h-[56px] px-4 py-3' : 
                      touchMode === 'precision' ? 'min-h-[40px] px-3 py-2' : 
                      'min-h-[44px] px-3 py-2'
                    }
                    ${getFullTypographyClass('body', 'sm', isLargeFont)}
                  `}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1 truncate">{site.site_name}</span>
                    {site.is_active && (
                      <span className={`
                        px-1.5 py-0.5 bg-green-100 text-green-700 rounded
                        ${getFullTypographyClass('caption', 'xs', isLargeFont)}
                      `}>
                        현재
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Contents */}
        <TabsContent value="overview" className="space-y-3 mt-6">
          {selectedSite ? (
            <>
              {/* 오늘의 현장 정보 - 1번 이미지 스타일로 개선 */}
              <Card elevation="sm" className="theme-transition overflow-hidden">
                <button
                  onClick={() => setSiteHistoryExpanded(!siteHistoryExpanded)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors theme-transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">오늘의 현장</h3>
                      <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">{selectedSite.site_name}</span>
                    </div>
                    {siteHistoryExpanded ? (
                      <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </button>
                
                {siteHistoryExpanded && (
                  <div className="p-3 bg-white dark:bg-gray-800">
                    {/* 현장 기본 정보 - 컴팩트한 레이아웃 */}
                    <div className="space-y-1">
                      
                      {/* 현장 주소 */}
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">현장</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 break-words flex-1 min-w-0">
                          {selectedSite.site_address}
                        </p>
                        <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0" onClick={() => copyToClipboard(selectedSite.site_address)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0 text-blue-600" onClick={() => window.open(`https://tmapapi.sktelecom.com/main.html#weblink/search?query=${encodeURIComponent(selectedSite.site_address)}`)}>
                          <Navigation className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* 숙소 정보 */}
                      {selectedSite.accommodation_address && (
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">숙소</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100 break-words flex-1 min-w-0">
                            {selectedSite.accommodation_address}
                          </p>
                          <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0" onClick={() => copyToClipboard(selectedSite.accommodation_address!)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0 text-blue-600" onClick={() => window.open(`https://tmapapi.sktelecom.com/main.html#weblink/search?query=${encodeURIComponent(selectedSite.accommodation_address!)}`)}>
                            <Navigation className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* 구분선 */}
                      <div className="border-t border-gray-100 dark:border-gray-700 my-3" />

                      {/* 담당자 연락처 */}
                      {(selectedSite.construction_manager_phone || selectedSite.safety_manager_phone) && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">담당자 연락처</span>
                          </div>
                          <div className="space-y-1 pl-6">
                            {selectedSite.construction_manager_phone && (
                              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                                <div className="flex-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block">건축관리자</span>
                                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                    {selectedSite.construction_manager_phone}
                                  </span>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0" onClick={() => copyToClipboard(selectedSite.construction_manager_phone!)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 text-green-600" onClick={() => makePhoneCall(selectedSite.construction_manager_phone!)}>
                                    <Phone className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {selectedSite.safety_manager_phone && (
                              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                                <div className="flex-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 block">안전관리자</span>
                                  <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                                    {selectedSite.safety_manager_phone}
                                  </span>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0" onClick={() => copyToClipboard(selectedSite.safety_manager_phone!)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 text-green-600" onClick={() => makePhoneCall(selectedSite.safety_manager_phone!)}>
                                    <Phone className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 구분선 */}
                      <div className="border-t border-gray-100 dark:border-gray-700 my-3" />

                      {/* 작업 정보 */}
                      {(selectedSite.work_process || selectedSite.work_section) && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">작업내용</span>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {selectedSite.work_process}{selectedSite.work_process && selectedSite.work_section && ' • '}{selectedSite.work_section}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 현장 공도면 */}
                      {selectedSite.blueprint_document_url && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">현장 공도면</span>
                            <Button 
                              variant="ghost" 
                              size="compact" 
                              className="text-blue-600 dark:text-blue-400 p-0 h-auto min-h-0 text-sm hover:underline"
                              onClick={() => selectedSite.blueprint_document_url && window.open(selectedSite.blueprint_document_url)}
                            >
                              미리보기
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* PTW */}
                      {selectedSite.ptw_document_url && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">PTW (작업허가서)</span>
                            <Button 
                              variant="ghost" 
                              size="compact" 
                              className="text-blue-600 dark:text-blue-400 p-0 h-auto min-h-0 text-sm hover:underline"
                              onClick={() => selectedSite.ptw_document_url && window.open(selectedSite.ptw_document_url)}
                            >
                              미리보기
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* 현장 참여 이력 */}
              <Card elevation="sm" className="theme-transition overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 참여 이력</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{siteHistory.length}개 현장</span>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                  {siteHistory.map((site, index) => (
                    <div
                      key={`${site.site_id}-${index}`} 
                      className="p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {site.site_name}
                            </h4>
                            {site.is_active && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                현재
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
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
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{site.site_address}</p>
                          
                          {/* Work details if available */}
                          {(site.work_process || site.work_section) && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                              {site.work_process && <span>{site.work_process}</span>}
                              {site.work_process && site.work_section && <span className="mx-1">•</span>}
                              {site.work_section && <span>{site.work_section}</span>}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(site.assigned_date).toLocaleDateString('ko-KR', {
                              year: '2-digit',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                            {site.unassigned_date && !site.is_active && (
                              <>
                                <span className="mx-1">~</span>
                                {new Date(site.unassigned_date).toLocaleDateString('ko-KR', {
                                  year: '2-digit',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </>
                            )}
                          </div>
                          <div className={`text-xs mt-1 ${
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
                </div>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={<MapPin className="h-8 w-8" />}
              title="현장을 선택하세요"
              description="상단의 드롭다운에서 현장을 선택하면 상세 정보를 확인할 수 있습니다."
            />
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-3 mt-6">
          {selectedSite ? (
            materialsLoading ? (
              <LoadingState message="자재 정보를 불러오는 중..." />
            ) : (
              <MaterialManagementSimplified 
                materials={materials}
                categories={categories}
                initialInventory={inventory}
                currentUser={currentUser}
                currentSite={selectedSite}
              />
            )
          ) : (
            <EmptyState
              icon={<Package className="h-10 w-10" />}
              title="현장을 선택하여 자재 현황을 확인하세요"
              description="상단의 드롭다운에서 현장을 선택하면 자재 현황을 확인할 수 있습니다."
              action={
                <Button 
                  size={getButtonSize()}
                  className="gap-2"
                  onClick={() => {}} // TODO: Implement site selection
                >
                  <Search className={getIconSize()} />
                  현장 선택
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}