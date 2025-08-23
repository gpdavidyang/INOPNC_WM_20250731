'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  SharedDocument, 
  DocumentFilters, 
  DocumentSortOptions,
  FILE_TYPE_ICONS,
  formatFileSize
} from '@/types/shared-documents'
import {
  Search, Filter, Upload, Download, Eye, Edit, Trash2, Share2,
  FileText, MoreVertical, Calendar, User, Building2, Tag,
  FolderOpen, ChevronDown, X, CheckCircle
} from 'lucide-react'
import DocumentCard from './DocumentCard'
import DocumentFiltersPanel from './DocumentFilters'
import DocumentUploadModal from './DocumentUploadModal'
import DocumentPermissionsModal from './DocumentPermissionsModal'
import DocumentPreviewModal from './DocumentPreviewModal'

export default function SharedDocumentsList() {
  const [documents, setDocuments] = useState<SharedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DocumentFilters>({})
  const [sortOptions, setSortOptions] = useState<DocumentSortOptions>({
    field: 'created_at',
    direction: 'desc'
  })
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // 모달 상태
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null)
  
  const supabase = createClient()

  // 문서 목록 로드
  const loadDocuments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('v_shared_documents_with_permissions')
        .select('*')
        .eq('is_deleted', false)

      // 필터 적용
      if (filters.site_id) {
        query = query.eq('site_id', filters.site_id)
      }
      if (filters.uploaded_by) {
        query = query.eq('uploaded_by', filters.uploaded_by)
      }
      if (filters.organization_id) {
        query = query.eq('organization_id', filters.organization_id)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.file_type) {
        query = query.eq('file_type', filters.file_type)
      }
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      // 정렬 적용
      query = query.order(sortOptions.field, { ascending: sortOptions.direction === 'asc' })

      const { data, error } = await query

      if (error) throw error

      setDocuments(data || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [filters, sortOptions, searchTerm])

  // 문서 삭제 (Soft Delete)
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('shared_documents')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', documentId)

      if (error) throw error

      await loadDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('문서 삭제에 실패했습니다.')
    }
  }

  // 문서 다운로드
  const handleDownloadDocument = async (document: SharedDocument) => {
    try {
      // 다운로드 로그 기록
      await supabase.from('document_access_logs').insert({
        document_id: document.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'download'
      })

      // 파일 다운로드
      const link = document.createElement('a')
      link.href = document.file_url
      link.download = document.file_name
      link.click()
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  // 일괄 작업
  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) {
      alert('삭제할 문서를 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedDocuments.size}개의 문서를 삭제하시겠습니까?`)) return

    try {
      const { error } = await supabase
        .from('shared_documents')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: (await supabase.auth.getUser()).data.user?.id
        })
        .in('id', Array.from(selectedDocuments))

      if (error) throw error

      setSelectedDocuments(new Set())
      await loadDocuments()
    } catch (error) {
      console.error('Failed to delete documents:', error)
      alert('문서 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">공유문서함</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            현장별 문서를 관리하고 권한을 설정합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocuments.size > 0 && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDocuments.size}개 선택됨
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
              >
                일괄 삭제
              </button>
              <button
                onClick={() => setSelectedDocuments(new Set())}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                선택 해제
              </button>
            </>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            문서 업로드
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="문서명 또는 설명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border rounded-md transition-colors ${
              showFilters 
                ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            필터
            {Object.keys(filters).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </button>

          {/* Sort */}
          <select
            value={`${sortOptions.field}-${sortOptions.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-')
              setSortOptions({
                field: field as DocumentSortOptions['field'],
                direction: direction as DocumentSortOptions['direction']
              })
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="created_at-desc">최신순</option>
            <option value="created_at-asc">오래된순</option>
            <option value="title-asc">이름순 (가-하)</option>
            <option value="title-desc">이름순 (하-가)</option>
            <option value="file_size-desc">크기 큰순</option>
            <option value="file_size-asc">크기 작은순</option>
            <option value="view_count-desc">조회수 많은순</option>
            <option value="download_count-desc">다운로드 많은순</option>
          </select>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <DocumentFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {searchTerm || Object.keys(filters).length > 0
              ? '검색 결과가 없습니다'
              : '공유된 문서가 없습니다'}
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {searchTerm || Object.keys(filters).length > 0
              ? '다른 검색 조건을 시도해보세요'
              : '문서를 업로드하여 팀과 공유하세요'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Upload className="h-4 w-4 mr-2" />
            첫 문서 업로드
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              isSelected={selectedDocuments.has(document.id)}
              onSelect={(selected) => {
                const newSelection = new Set(selectedDocuments)
                if (selected) {
                  newSelection.add(document.id)
                } else {
                  newSelection.delete(document.id)
                }
                setSelectedDocuments(newSelection)
              }}
              onView={() => {
                setSelectedDocument(document)
                setShowPreviewModal(true)
              }}
              onEdit={() => {
                setSelectedDocument(document)
                setShowUploadModal(true)
              }}
              onShare={() => {
                setSelectedDocument(document)
                setShowPermissionsModal(true)
              }}
              onDownload={() => handleDownloadDocument(document)}
              onDelete={() => handleDeleteDocument(document.id)}
            />
          ))}
        </div>
      )}

      {/* Summary Statistics */}
      {!loading && documents.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {documents.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">전체 문서</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 용량</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {documents.reduce((sum, doc) => sum + (doc.view_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 조회수</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {documents.reduce((sum, doc) => sum + (doc.download_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">총 다운로드</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <DocumentUploadModal
          document={selectedDocument}
          onClose={() => {
            setShowUploadModal(false)
            setSelectedDocument(null)
          }}
          onSuccess={() => {
            setShowUploadModal(false)
            setSelectedDocument(null)
            loadDocuments()
          }}
        />
      )}

      {showPermissionsModal && selectedDocument && (
        <DocumentPermissionsModal
          document={selectedDocument}
          onClose={() => {
            setShowPermissionsModal(false)
            setSelectedDocument(null)
          }}
          onSuccess={() => {
            setShowPermissionsModal(false)
            setSelectedDocument(null)
            loadDocuments()
          }}
        />
      )}

      {showPreviewModal && selectedDocument && (
        <DocumentPreviewModal
          document={selectedDocument}
          onClose={() => {
            setShowPreviewModal(false)
            setSelectedDocument(null)
          }}
        />
      )}
    </div>
  )
}