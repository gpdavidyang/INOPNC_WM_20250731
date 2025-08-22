'use client'

import { useState, useEffect } from 'react'
import { Profile, DocumentCategory, DocumentWithPermissions, DocumentType } from '@/types'
import { 
  Search, Filter, Plus, FolderPlus, Users, Lock, Unlock,
  FileText, FolderOpen, Eye, Download, Edit, Trash2, Share2,
  User, Building2, DollarSign, Award, File, FileCheck, FileImage
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import DocumentCategoryCard from './DocumentCategoryCard'
import DocumentList from './DocumentList'
import DocumentPermissionManager from './DocumentPermissionManager'
import CreateFolderModal from './CreateFolderModal'
import UploadDocumentModal from './UploadDocumentModal'
import { DOCUMENT_CATEGORIES } from './SimpleDocumentCategories'

interface EnhancedDocumentManagementProps {
  profile: Profile
}

export default function EnhancedDocumentManagement({ profile }: EnhancedDocumentManagementProps) {
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  
  // Modals
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showUploadDocument, setShowUploadDocument] = useState(false)
  const [showPermissionManager, setShowPermissionManager] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithPermissions | null>(null)
  
  // Available sites for filtering
  const [availableSites, setAvailableSites] = useState<Array<{id: string, name: string}>>([])
  
  const supabase = createClient()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      loadDocuments()
    }
  }, [selectedCategory, searchTerm, selectedSiteId])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      // Use hardcoded categories until migration is applied
      setCategories(DOCUMENT_CATEGORIES as DocumentCategory[])

      // Load available sites
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      if (sitesError) throw sitesError
      setAvailableSites(sitesData || [])

    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    if (!selectedCategory) return

    setLoading(true)
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          sites(name),
          profiles!owner_id(name, email)
        `)
        .eq('document_type', selectedCategory)

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      if (selectedSiteId) {
        query = query.eq('site_id', selectedSiteId)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Transform data to include permission info
      const documentsWithPermissions: DocumentWithPermissions[] = data?.map(doc => ({
        ...doc,
        can_edit: canEditDocument(doc),
        can_delete: canDeleteDocument(doc),
        can_share: canShareDocument(doc)
      })) || []

      setDocuments(documentsWithPermissions)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const canEditDocument = (doc: any): boolean => {
    // Admin can edit everything
    if (['admin', 'system_admin'].includes(profile.role)) return true
    
    // Owner can edit their own documents
    if (doc.owner_id === profile.id) return true
    
    // Site managers can edit site documents they have access to
    if (profile.role === 'site_manager' && doc.site_id) {
      // Would need to check site_memberships, but for now assume they can
      return true
    }
    
    return false
  }

  const canDeleteDocument = (doc: any): boolean => {
    // Admin can delete everything
    if (['admin', 'system_admin'].includes(profile.role)) return true
    
    // Owner can delete their own documents
    if (doc.owner_id === profile.id) return true
    
    return false
  }

  const canShareDocument = (doc: any): boolean => {
    // Admin can share everything
    if (['admin', 'system_admin'].includes(profile.role)) return true
    
    // Owner can share their own documents
    if (doc.owner_id === profile.id) return true
    
    // Only shared documents can be shared by site members
    if (doc.document_type === 'shared' && doc.site_id) return true
    
    return false
  }

  const getCategoryIcon = (categoryName: string) => {
    const icons: Record<string, any> = {
      personal: User,
      shared: Users,
      blueprint: FileImage,
      required: FileCheck,
      progress_payment: DollarSign,
      report: FileText,
      certificate: Award,
      other: File
    }
    return icons[categoryName] || File
  }

  const getCategoryColor = (categoryName: string) => {
    const colors: Record<string, string> = {
      personal: 'blue',
      shared: 'green',
      blueprint: 'purple',
      required: 'red',
      progress_payment: 'orange',
      report: 'gray',
      certificate: 'yellow',
      other: 'gray'
    }
    return colors[categoryName] || 'gray'
  }

  const handleDocumentSelect = (documentId: string, selected: boolean) => {
    if (selected) {
      setSelectedDocuments([...selectedDocuments, documentId])
    } else {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId))
    }
  }

  const handleManagePermissions = (document: DocumentWithPermissions) => {
    setSelectedDocument(document)
    setShowPermissionManager(true)
  }

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return
    
    if (!confirm(`선택된 ${selectedDocuments.length}개 문서를 삭제하시겠습니까?`)) return

    try {
      // For now, actually delete the documents since is_deleted column might not exist
      // TODO: Change to soft delete when migration is applied
      const { error } = await supabase
        .from('documents')
        .delete()
        .in('id', selectedDocuments)

      if (error) throw error

      setSelectedDocuments([])
      await loadDocuments()
    } catch (error) {
      console.error('Failed to delete documents:', error)
      alert('문서 삭제에 실패했습니다.')
    }
  }

  const getDocumentCount = (categoryName: string): number => {
    return documents.filter(doc => doc.document_type === categoryName).length
  }

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            문서함 관리
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            카테고리별 문서 관리 및 권한 설정
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateFolder(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            폴더 생성
          </button>
          <button
            onClick={() => setShowUploadDocument(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            문서 업로드
          </button>
        </div>
      </div>

      {!selectedCategory ? (
        <>
          {/* Category Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.name)
              const color = getCategoryColor(category.name)
              const count = getDocumentCount(category.name)
              
              return (
                <DocumentCategoryCard
                  key={category.id}
                  category={category}
                  icon={Icon}
                  color={color}
                  documentCount={count}
                  onClick={() => setSelectedCategory(category.name)}
                />
              )
            })}
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              문서 현황 요약
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {categories.reduce((sum, cat) => sum + getDocumentCount(cat.name), 0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">총 문서</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getDocumentCount('shared')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">공유 문서</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {getDocumentCount('progress_payment')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">기성청구</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {getDocumentCount('required')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">필수서류</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Document List View */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← 카테고리로 돌아가기
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {categories.find(c => c.name === selectedCategory)?.display_name} 
                ({documents.length})
              </h2>
            </div>
            
            {selectedDocuments.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDocuments.length}개 선택됨
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="문서명, 설명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">전체 현장</option>
                {availableSites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document List */}
          <DocumentList
            documents={documents}
            selectedDocuments={selectedDocuments}
            onDocumentSelect={handleDocumentSelect}
            onManagePermissions={handleManagePermissions}
            loading={loading}
            profile={profile}
          />
        </>
      )}

      {/* Modals */}
      {showCreateFolder && (
        <CreateFolderModal
          category={selectedCategory || 'other'}
          sites={availableSites}
          profile={profile}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={() => {
            setShowCreateFolder(false)
            loadDocuments()
          }}
        />
      )}

      {showUploadDocument && (
        <UploadDocumentModal
          category={selectedCategory || 'other'}
          sites={availableSites}
          profile={profile}
          onClose={() => setShowUploadDocument(false)}
          onSuccess={() => {
            setShowUploadDocument(false)
            loadDocuments()
          }}
        />
      )}

      {showPermissionManager && selectedDocument && (
        <DocumentPermissionManager
          document={selectedDocument}
          profile={profile}
          onClose={() => {
            setShowPermissionManager(false)
            setSelectedDocument(null)
          }}
          onSuccess={() => {
            setShowPermissionManager(false)
            setSelectedDocument(null)
            loadDocuments()
          }}
        />
      )}
    </div>
  )
}