'use client'

import { useState, useEffect } from 'react'
import { Site, Profile, SiteAssignment } from '@/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Building2, Edit, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getSiteAssignments } from '@/app/actions/admin/sites'

interface SiteUnifiedManagementProps {
  site: Site
  onBack: () => void
  onSiteUpdate: (updatedSite: Site) => void
  onRefresh: () => void
}

interface SiteUnifiedManagementState {
  activeTab: 'info' | 'edit' | 'workers'
  assignments: SiteAssignment[]
  availableUsers: Profile[]
  isLoading: boolean
}

export default function SiteUnifiedManagement({
  site,
  onBack,
  onSiteUpdate,
  onRefresh
}: SiteUnifiedManagementProps) {
  const [state, setState] = useState<SiteUnifiedManagementState>({
    activeTab: 'info',
    assignments: [],
    availableUsers: [],
    isLoading: false
  })

  const updateState = (updates: Partial<SiteUnifiedManagementState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // Load site assignments when switching to workers tab
  const loadSiteAssignments = async () => {
    if (state.activeTab !== 'workers') return

    updateState({ isLoading: true })
    try {
      const result = await getSiteAssignments(site.id)
      if (result.success) {
        updateState({ assignments: result.data || [] })
      } else {
        toast({
          title: '오류',
          description: result.error || '현장 배정 정보를 불러오지 못했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading site assignments:', error)
      toast({
        title: '오류',
        description: '현장 배정 정보를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      updateState({ isLoading: false })
    }
  }

  // Handle tab changes
  const handleTabChange = (value: string) => {
    const tabValue = value as 'info' | 'edit' | 'workers'
    updateState({ activeTab: tabValue })
  }

  // Load assignments when tab changes to workers
  useEffect(() => {
    if (state.activeTab === 'workers') {
      loadSiteAssignments()
    }
  }, [state.activeTab])

  return (
    <div className="h-full flex flex-col">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            현장 목록으로
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{site.name}</h1>
            <p className="text-sm text-muted-foreground">{site.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            site.status === 'active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : site.status === 'inactive'
              ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {site.status === 'active' ? '활성' : site.status === 'inactive' ? '비활성' : '완료'}
          </span>
        </div>
      </div>

      {/* Main content with tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs 
          value={state.activeTab} 
          onValueChange={handleTabChange}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-6">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              현장 정보
            </TabsTrigger>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              정보 수정
            </TabsTrigger>
            <TabsTrigger value="workers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              작업자 배정
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="info" className="h-full mt-0">
              <SiteInfoTab 
                site={site}
                onRefresh={onRefresh}
              />
            </TabsContent>

            <TabsContent value="edit" className="h-full mt-0">
              <SiteEditTab 
                site={site}
                onSiteUpdate={onSiteUpdate}
                onRefresh={onRefresh}
              />
            </TabsContent>

            <TabsContent value="workers" className="h-full mt-0">
              <WorkerAssignmentTab 
                site={site}
                assignments={state.assignments}
                availableUsers={state.availableUsers}
                isLoading={state.isLoading}
                onRefresh={loadSiteAssignments}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

// Placeholder components to be implemented in subsequent phases
function SiteInfoTab({ site, onRefresh }: { site: Site; onRefresh: () => void }) {
  return (
    <div className="p-6 space-y-8">
      <div className="max-w-4xl">
        {/* Basic Site Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            기본 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">현장명</label>
                <p className="text-sm mt-1 font-medium">{site.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">주소</label>
                <p className="text-sm mt-1">{site.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">상태</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    site.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : site.status === 'inactive'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {site.status === 'active' ? '활성' : site.status === 'inactive' ? '비활성' : '완료'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">시작일</label>
                <p className="text-sm mt-1">
                  {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">종료일</label>
                <p className="text-sm mt-1">
                  {site.end_date ? new Date(site.end_date).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">생성일</label>
                <p className="text-sm mt-1">
                  {site.created_at ? new Date(site.created_at).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Management Information */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            관리자 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">현장관리자</label>
                <p className="text-sm mt-1 font-medium">{site.manager_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">건설관리자 연락처</label>
                <p className="text-sm mt-1">{site.construction_manager_phone || '-'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">안전관리자</label>
                <p className="text-sm mt-1 font-medium">{site.safety_manager_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">안전관리자 연락처</label>
                <p className="text-sm mt-1">{site.safety_manager_phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Accommodation Information */}
        {(site.accommodation_name || site.accommodation_address) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              숙소 정보
            </h2>
            <div className="bg-card p-6 rounded-lg border space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">숙소명</label>
                <p className="text-sm mt-1 font-medium">{site.accommodation_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">숙소 주소</label>
                <p className="text-sm mt-1">{site.accommodation_address || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Work Information */}
        {(site.work_process || site.work_section || site.component_name) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              작업 정보
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card p-6 rounded-lg border">
              <div>
                <label className="text-sm font-medium text-muted-foreground">작업공정</label>
                <p className="text-sm mt-1">{site.work_process || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">작업구간</label>
                <p className="text-sm mt-1">{site.work_section || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">부품명</label>
                <p className="text-sm mt-1">{site.component_name || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {site.description && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">설명</h2>
            <div className="bg-card p-6 rounded-lg border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{site.description}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onRefresh} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>
    </div>
  )
}

function SiteEditTab({ 
  site, 
  onSiteUpdate, 
  onRefresh 
}: { 
  site: Site; 
  onSiteUpdate: (site: Site) => void; 
  onRefresh: () => void 
}) {
  const [formData, setFormData] = useState({
    name: site.name || '',
    address: site.address || '',
    description: site.description || '',
    status: site.status || 'active',
    start_date: site.start_date ? new Date(site.start_date).toISOString().split('T')[0] : '',
    end_date: site.end_date ? new Date(site.end_date).toISOString().split('T')[0] : '',
    manager_name: site.manager_name || '',
    construction_manager_phone: site.construction_manager_phone || '',
    safety_manager_name: site.safety_manager_name || '',
    safety_manager_phone: site.safety_manager_phone || '',
    accommodation_name: site.accommodation_name || '',
    accommodation_address: site.accommodation_address || '',
    work_process: site.work_process || '',
    work_section: site.work_section || '',
    component_name: site.component_name || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { updateSite } = await import('@/app/actions/admin/sites')
      const result = await updateSite({
        id: site.id,
        ...formData
      })

      if (result.success && result.data) {
        onSiteUpdate(result.data)
        setHasChanges(false)
        toast({
          title: '성공',
          description: result.message || '현장 정보가 성공적으로 업데이트되었습니다.',
          variant: 'default'
        })
      } else {
        toast({
          title: '오류',
          description: result.error || '현장 정보 업데이트에 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Site update error:', error)
      toast({
        title: '오류',
        description: '현장 정보 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: site.name || '',
      address: site.address || '',
      description: site.description || '',
      status: site.status || 'active',
      start_date: site.start_date ? new Date(site.start_date).toISOString().split('T')[0] : '',
      end_date: site.end_date ? new Date(site.end_date).toISOString().split('T')[0] : '',
      manager_name: site.manager_name || '',
      construction_manager_phone: site.construction_manager_phone || '',
      safety_manager_name: site.safety_manager_name || '',
      safety_manager_phone: site.safety_manager_phone || '',
      accommodation_name: site.accommodation_name || '',
      accommodation_address: site.accommodation_address || '',
      work_process: site.work_process || '',
      work_section: site.work_section || '',
      component_name: site.component_name || ''
    })
    setHasChanges(false)
  }

  return (
    <div className="p-6 space-y-8">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            현장 정보 수정
          </h2>
          {hasChanges && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              변경사항 있음
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">현장명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="completed">완료</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">주소 *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">시작일 *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">종료일</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="현장에 대한 추가 설명을 입력하세요..."
                />
              </div>
            </div>
          </div>

          {/* Management Information */}
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              관리자 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">현장관리자</label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => handleInputChange('manager_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="현장관리자 이름"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">건설관리자 연락처</label>
                <input
                  type="tel"
                  value={formData.construction_manager_phone}
                  onChange={(e) => handleInputChange('construction_manager_phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="010-0000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">안전관리자</label>
                <input
                  type="text"
                  value={formData.safety_manager_name}
                  onChange={(e) => handleInputChange('safety_manager_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="안전관리자 이름"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">안전관리자 연락처</label>
                <input
                  type="tel"
                  value={formData.safety_manager_phone}
                  onChange={(e) => handleInputChange('safety_manager_phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
          </div>

          {/* Accommodation Information */}
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              숙소 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">숙소명</label>
                <input
                  type="text"
                  value={formData.accommodation_name}
                  onChange={(e) => handleInputChange('accommodation_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="숙소 이름"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">숙소 주소</label>
                <input
                  type="text"
                  value={formData.accommodation_address}
                  onChange={(e) => handleInputChange('accommodation_address', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="숙소 주소"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-card p-6 rounded-lg border space-y-6">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              작업 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">작업공정</label>
                <input
                  type="text"
                  value={formData.work_process}
                  onChange={(e) => handleInputChange('work_process', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="작업 공정"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">작업구간</label>
                <input
                  type="text"
                  value={formData.work_section}
                  onChange={(e) => handleInputChange('work_section', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="작업 구간"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">부품명</label>
                <input
                  type="text"
                  value={formData.component_name}
                  onChange={(e) => handleInputChange('component_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="부품명"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleReset}
              disabled={isSubmitting || !hasChanges}
            >
              초기화
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onRefresh}
              disabled={isSubmitting}
            >
              새로고침
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !hasChanges}
              className="min-w-24"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WorkerAssignmentTab({ 
  site, 
  assignments, 
  availableUsers, 
  isLoading, 
  onRefresh 
}: { 
  site: Site; 
  assignments: SiteAssignment[]; 
  availableUsers: Profile[]; 
  isLoading: boolean; 
  onRefresh: () => void 
}) {
  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">작업자 배정 관리</h2>
          <Button onClick={onRefresh} disabled={isLoading} size="sm">
            {isLoading ? '로딩 중...' : '새로고침'}
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">배정 정보를 불러오는 중...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">배정된 작업자가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              총 {assignments.length}명의 작업자가 배정되어 있습니다.
            </p>
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <div 
                  key={assignment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{assignment.profile?.full_name || '이름 없음'}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.profile?.email} • {assignment.role}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.assigned_date && (
                      <p>배정일: {new Date(assignment.assigned_date).toLocaleDateString('ko-KR')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            작업자 배정/해제 기능이 여기에 구현됩니다. (Phase 3에서 구현 예정)
          </p>
        </div>
      </div>
    </div>
  )
}