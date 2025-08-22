'use client'

import { useState, useEffect } from 'react'
import { Profile, Site, SiteStatus } from '@/types'
import AdminDataTable from './AdminDataTable'
import BulkActionBar, { commonBulkActions } from './BulkActionBar'
import { 
  getSites, 
  createSite, 
  updateSite, 
  deleteSites, 
  updateSiteStatus,
  CreateSiteData,
  UpdateSiteData 
} from '@/app/actions/admin/sites'
import { Plus, Search, Filter, Eye, Edit, MapPin, Calendar, Phone, Users, FileText } from 'lucide-react'

interface SiteManagementProps {
  profile: Profile
}

export default function SiteManagement({ profile }: SiteManagementProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SiteStatus | ''>('')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)

  // Load sites data
  const loadSites = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getSites(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter || undefined
      )
      
      if (result.success && result.data) {
        setSites(result.data.sites)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setError(result.error || '현장 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setError('현장 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and when filters change
  useEffect(() => {
    loadSites()
  }, [currentPage, searchTerm, statusFilter])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle status filter
  const handleStatusFilter = (status: SiteStatus | '') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  // Handle bulk delete
  const handleBulkDelete = async (siteIds: string[]) => {
    try {
      const result = await deleteSites(siteIds)
      if (result.success) {
        await loadSites()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  // Handle bulk status update
  const handleBulkStatusUpdate = (status: SiteStatus) => async (siteIds: string[]) => {
    try {
      const result = await updateSiteStatus(siteIds, status)
      if (result.success) {
        await loadSites()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('상태 업데이트 중 오류가 발생했습니다.')
    }
  }

  // Handle create site
  const handleCreateSite = () => {
    setShowCreateModal(true)
  }

  // Handle edit site
  const handleEditSite = (site: Site) => {
    setEditingSite(site)
    setShowEditModal(true)
  }

  // Handle view site
  const handleViewSite = (site: Site) => {
    // TODO: Implement site detail view
    alert(`현장 상세 정보: ${site.name}`)
  }

  // Handle document management navigation
  const handleDocumentManagement = (site: Site) => {
    window.location.href = `/dashboard/admin/sites/${site.id}/documents`
  }

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: '현장명',
      sortable: true,
      filterable: true,
      render: (value: string, site: Site) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 text-gray-400 mr-2" />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {site.address}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: '상태',
      render: (value: SiteStatus) => {
        const statusConfig = {
          active: { text: '활성', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
          inactive: { text: '비활성', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
          completed: { text: '완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' }
        }
        
        const config = statusConfig[value] || statusConfig.inactive
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'start_date',
      label: '시작일',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4 mr-1" />
          {new Date(value).toLocaleDateString('ko-KR')}
        </div>
      )
    },
    {
      key: 'manager_name',
      label: '담당자',
      render: (value: string, site: Site) => (
        <div className="text-sm">
          {value ? (
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
              {site.construction_manager_phone && (
                <div className="text-gray-500 dark:text-gray-400 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {site.construction_manager_phone}
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">미지정</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: '생성일',
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    }
  ]

  // Define bulk actions
  const bulkActions = [
    commonBulkActions.delete(handleBulkDelete),
    {
      id: 'activate',
      label: '활성화',
      icon: Users,
      onClick: handleBulkStatusUpdate('active')
    },
    {
      id: 'deactivate',
      label: '비활성화',
      icon: Users,
      variant: 'secondary' as const,
      onClick: handleBulkStatusUpdate('inactive')
    },
    {
      id: 'complete',
      label: '완료처리',
      icon: Users,
      variant: 'secondary' as const,
      onClick: handleBulkStatusUpdate('completed')
    }
  ]

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
        <div className="space-y-3">
          {/* Header with search and filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="현장명 또는 주소로 검색..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-row gap-2 flex-shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value as SiteStatus | '')}
                className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">모든 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="completed">완료</option>
              </select>
              
              <button
                onClick={handleCreateSite}
                className="inline-flex items-center whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 현장
              </button>
            </div>
          </div>

          {/* Sites table */}
          <AdminDataTable
            data={sites}
            columns={columns}
            loading={loading}
            error={error}
            selectable={true}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            getRowId={(site: Site) => site.id}
            onView={handleViewSite}
            onEdit={handleEditSite}
            customActions={[
              {
                icon: FileText,
                label: '문서 관리',
                onClick: handleDocumentManagement,
                variant: 'default' as const
              }
            ]}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            totalCount={totalCount}
            emptyMessage="현장이 없습니다"
            emptyDescription="새 현장을 추가하여 시작하세요."
          />

          {/* Bulk action bar */}
          <BulkActionBar
            selectedIds={selectedIds}
            totalCount={totalCount}
            actions={bulkActions}
            onClearSelection={() => setSelectedIds([])}
          />

          {/* Modals */}
          {showCreateModal && (
            <SiteCreateEditModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false)
                loadSites()
              }}
            />
          )}
          
          {showEditModal && editingSite && (
            <SiteCreateEditModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false)
                setEditingSite(null)
              }}
              onSuccess={() => {
                setShowEditModal(false)
                setEditingSite(null)
                loadSites()
              }}
              site={editingSite}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Site Create/Edit Modal Component
interface SiteCreateEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  site?: Site
}

function SiteCreateEditModal({ isOpen, onClose, onSuccess, site }: SiteCreateEditModalProps) {
  const [formData, setFormData] = useState<CreateSiteData>({
    name: '',
    address: '',
    description: '',
    start_date: '',
    end_date: '',
    construction_manager_phone: '',
    safety_manager_phone: '',
    accommodation_name: '',
    accommodation_address: '',
    work_process: '',
    work_section: '',
    component_name: '',
    manager_name: '',
    safety_manager_name: '',
    status: 'active'
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!site

  // Initialize form data when editing
  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        address: site.address,
        description: site.description || '',
        start_date: site.start_date,
        end_date: site.end_date || '',
        construction_manager_phone: site.construction_manager_phone || '',
        safety_manager_phone: site.safety_manager_phone || '',
        accommodation_name: site.accommodation_name || '',
        accommodation_address: site.accommodation_address || '',
        work_process: site.work_process || '',
        work_section: site.work_section || '',
        component_name: site.component_name || '',
        manager_name: site.manager_name || '',
        safety_manager_name: site.safety_manager_name || '',
        status: site.status || 'active'
      })
    }
  }, [site])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      let result
      if (isEditing) {
        result = await updateSite({ id: site.id, ...formData } as UpdateSiteData)
      } else {
        result = await createSite(formData)
      }

      if (result.success) {
        alert(result.message)
        onSuccess()
      } else {
        if (result.error) {
          alert(result.error)
        }
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {isEditing ? '현장 편집' : '새 현장 추가'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  기본 정보
                </h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  현장명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  상태
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SiteStatus }))}
                  className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="completed">완료</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  주소 *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  시작일 *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  종료일
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Manager Information */}
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  담당자 정보
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  건축 담당자명
                </label>
                <input
                  type="text"
                  value={formData.manager_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  건축 담당자 전화번호
                </label>
                <input
                  type="tel"
                  value={formData.construction_manager_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, construction_manager_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  안전 담당자명
                </label>
                <input
                  type="text"
                  value={formData.safety_manager_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, safety_manager_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  안전 담당자 전화번호
                </label>
                <input
                  type="tel"
                  value={formData.safety_manager_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, safety_manager_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '저장 중...' : isEditing ? '수정' : '생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}