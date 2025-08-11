'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import DocumentUploadZone from './DocumentUploadZone'
import { FileText, Download, Eye, Trash2, Upload, Settings, ExternalLink, Search, Filter, CheckSquare, Square, X, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SiteDocument {
  id: string
  site_id: string
  document_type: 'ptw' | 'blueprint' | 'other'
  file_name: string
  file_url: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  is_active: boolean
  version: number
  notes: string | null
  created_at: string
  updated_at: string
  uploader?: {
    full_name: string
    email: string
  }
}

interface Site {
  id: string
  name: string
  address: string
  status: string
}

interface SiteDocumentManagementProps {
  profile: Profile
}

export default function SiteDocumentManagement({ profile }: SiteDocumentManagementProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [documents, setDocuments] = useState<SiteDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [previewDocument, setPreviewDocument] = useState<SiteDocument | null>(null)
  const [showBulkActions, setShowBulkActions] = useState(false)

  const supabase = createClient()

  // Load all sites that the user can manage
  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address, status')
        .eq('status', 'active')
        .order('name')

      if (error) throw error

      setSites(data || [])
      if (data && data.length > 0 && !selectedSite) {
        setSelectedSite(data[0].id)
      }
    } catch (err) {
      setError('사이트 목록을 불러오는데 실패했습니다.')
      console.error('Site loading error:', err)
    }
  }

  // Load documents for selected site
  const loadDocuments = async () => {
    if (!selectedSite) return

    setLoading(true)
    setError(null)
    // Clear selections when loading new site data
    setSelectedDocuments(new Set())
    setShowBulkActions(false)

    try {
      const { data, error } = await supabase
        .from('site_documents')
        .select(`
          *,
          uploader:profiles!site_documents_uploaded_by_fkey(
            full_name,
            email
          )
        `)
        .eq('site_id', selectedSite)
        .order('document_type', { ascending: true })
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setDocuments(data || [])
    } catch (err) {
      setError('문서 목록을 불러오는데 실패했습니다.')
      console.error('Document loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSites()
  }, [])

  useEffect(() => {
    if (selectedSite) {
      loadDocuments()
    }
  }, [selectedSite])

  // Handle document activation toggle
  const handleToggleActive = async (documentId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('site_documents')
        .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
        .eq('id', documentId)

      if (error) throw error

      await loadDocuments() // Refresh the list
    } catch (err) {
      alert('문서 상태 변경에 실패했습니다.')
      console.error('Document toggle error:', err)
    }
  }

  // Handle document deletion
  const handleDeleteDocument = async (documentId: string, fileName: string) => {
    if (!confirm(`"${fileName}" 문서를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('site_documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error

      await loadDocuments() // Refresh the list
      alert('문서가 삭제되었습니다.')
    } catch (err) {
      alert('문서 삭제에 실패했습니다.')
      console.error('Document deletion error:', err)
    }
  }

  // Handle document preview
  const handlePreviewDocument = (document: SiteDocument) => {
    setPreviewDocument(document)
  }

  // Close preview modal
  const closePreviewModal = () => {
    setPreviewDocument(null)
  }

  // Handle document download
  const handleDownloadDocument = (document: SiteDocument) => {
    const link = window.document.createElement('a')
    link.href = document.file_url
    link.download = document.file_name
    link.click()
  }

  // Handle bulk selection
  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }
    setSelectedDocuments(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  // Handle select all
  const handleSelectAll = () => {
    const filteredDocs = getFilteredDocuments()
    const allIds = new Set(filteredDocs.map(doc => doc.id))
    const isAllSelected = filteredDocs.every(doc => selectedDocuments.has(doc.id))
    
    if (isAllSelected) {
      setSelectedDocuments(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedDocuments(allIds)
      setShowBulkActions(true)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return
    
    const confirmMessage = `선택된 ${selectedDocuments.size}개 문서를 삭제하시겠습니까?`
    if (!confirm(confirmMessage)) return

    try {
      const { error } = await supabase
        .from('site_documents')
        .delete()
        .in('id', Array.from(selectedDocuments))

      if (error) throw error

      await loadDocuments()
      setSelectedDocuments(new Set())
      setShowBulkActions(false)
      alert(`${selectedDocuments.size}개 문서가 삭제되었습니다.`)
    } catch (err) {
      alert('문서 삭제에 실패했습니다.')
      console.error('Bulk delete error:', err)
    }
  }

  // Handle bulk activate/deactivate
  const handleBulkToggleActive = async (activate: boolean) => {
    if (selectedDocuments.size === 0) return

    try {
      const { error } = await supabase
        .from('site_documents')
        .update({ is_active: activate, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedDocuments))

      if (error) throw error

      await loadDocuments()
      setSelectedDocuments(new Set())
      setShowBulkActions(false)
      alert(`${selectedDocuments.size}개 문서가 ${activate ? '활성화' : '비활성화'}되었습니다.`)
    } catch (err) {
      alert('문서 상태 변경에 실패했습니다.')
      console.error('Bulk toggle error:', err)
    }
  }

  // Filter and search documents
  const getFilteredDocuments = () => {
    let filtered = documents

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(doc => 
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.uploader?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by document type
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === filterType)
    }

    return filtered
  }

  // Group documents by type for better display
  const groupedDocuments = getFilteredDocuments().reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = []
    }
    acc[doc.document_type].push(doc)
    return acc
  }, {} as Record<string, SiteDocument[]>)

  const documentTypeLabels = {
    ptw: 'PTW (작업허가서)',
    blueprint: '공사도면',
    other: '기타 문서'
  }

  const selectedSiteInfo = sites.find(site => site.id === selectedSite)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            현장별 문서 관리
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            각 현장의 PTW, 도면 및 기타 문서를 관리합니다
          </p>
        </div>
        
        <button
          onClick={() => setUploadMode(!uploadMode)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadMode ? '업로드 취소' : '문서 업로드'}
        </button>
      </div>

      {/* Site Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          현장 선택
        </label>
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">현장을 선택하세요</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name} - {site.address}
            </option>
          ))}
        </select>
        
        {selectedSiteInfo && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>선택된 현장:</strong> {selectedSiteInfo.name}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              {selectedSiteInfo.address}
            </p>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      {uploadMode && selectedSite && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <DocumentUploadZone
            siteId={selectedSite}
            onUploadComplete={() => {
              loadDocuments()
              setUploadMode(false)
            }}
          />
        </div>
      )}

      {/* Search and Filter */}
      {selectedSite && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="문서명, 업로더, 메모로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Filter */}
            <div className="sm:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 문서 타입</option>
                <option value="ptw">PTW (작업허가서)</option>
                <option value="blueprint">공사도면</option>
                <option value="other">기타 문서</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800 dark:text-blue-200 font-medium">
                {selectedDocuments.size}개 문서 선택됨
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkToggleActive(true)}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                일괄 활성화
              </button>
              <button
                onClick={() => handleBulkToggleActive(false)}
                className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors"
              >
                일괄 비활성화
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                일괄 삭제
              </button>
              <button
                onClick={() => {
                  setSelectedDocuments(new Set())
                  setShowBulkActions(false)
                }}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                선택 해제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document List */}
      {selectedSite && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              {/* Skeleton for each document type */}
              {['ptw', 'blueprint', 'other'].map((docType) => (
                <div key={docType} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mt-2 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                              <div className="space-y-1 mt-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {[1, 2, 3, 4].map((btn) => (
                              <div key={btn} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-red-200 dark:border-red-700 p-6">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : Object.keys(groupedDocuments).length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  이 현장에 등록된 문서가 없습니다.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  상단의 "문서 업로드" 버튼을 클릭하여 문서를 추가하세요.
                </p>
              </div>
            </div>
          ) : (
            Object.entries(groupedDocuments).map(([docType, docs]) => (
              <div key={docType} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {documentTypeLabels[docType as keyof typeof documentTypeLabels] || docType}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {docs.length}개 문서 | 활성: {docs.filter(d => d.is_active).length}개
                      </p>
                    </div>
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      {getFilteredDocuments().every(doc => selectedDocuments.has(doc.id)) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                      전체 선택
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {docs.map((document) => (
                    <div key={document.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleSelectDocument(document.id)}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              {selectedDocuments.has(document.id) ? (
                                <CheckSquare className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                            <FileText className={`h-8 w-8 flex-shrink-0 mt-1 ${
                              document.is_active ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className={`font-medium truncate ${
                                document.is_active 
                                  ? 'text-gray-900 dark:text-gray-100' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {document.file_name}
                              </p>
                              {document.is_active && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full">
                                  활성
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                              {document.file_size && (
                                <p>크기: {Math.round(document.file_size / 1024)} KB</p>
                              )}
                              <p>업로드: {new Date(document.created_at).toLocaleDateString('ko-KR')}</p>
                              {document.uploader && (
                                <p>업로더: {document.uploader.full_name}</p>
                              )}
                              {document.notes && (
                                <p className="text-gray-600 dark:text-gray-300">참고: {document.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handlePreviewDocument(document)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="미리보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDownloadDocument(document)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleToggleActive(document.id, document.is_active)}
                            className={`p-2 rounded transition-colors ${
                              document.is_active
                                ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                            title={document.is_active ? '비활성화' : '활성화'}
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteDocument(document.id, document.file_name)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!selectedSite && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              문서를 관리할 현장을 선택하세요.
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closePreviewModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {previewDocument.file_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {documentTypeLabels[previewDocument.document_type as keyof typeof documentTypeLabels]}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadDocument(previewDocument)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                  title="다운로드"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={() => window.open(previewDocument.file_url, '_blank')}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="새 창에서 열기"
                >
                  <ExternalLink className="h-5 w-5" />
                </button>
                <button
                  onClick={closePreviewModal}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              {previewDocument.mime_type?.startsWith('image/') ? (
                <div className="p-4 flex items-center justify-center h-full">
                  <img
                    src={previewDocument.file_url}
                    alt={previewDocument.file_name}
                    className="max-w-full max-h-full object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const errorDiv = document.createElement('div')
                      errorDiv.className = 'flex items-center justify-center h-64 text-gray-500'
                      errorDiv.innerHTML = '<div class="text-center"><p>이미지를 불러올 수 없습니다</p><p class="text-sm mt-2">파일이 손상되었거나 접근할 수 없습니다</p></div>'
                      target.parentNode?.appendChild(errorDiv)
                    }}
                  />
                </div>
              ) : previewDocument.mime_type === 'application/pdf' ? (
                <iframe
                  src={previewDocument.file_url}
                  className="w-full h-full border-0"
                  title={previewDocument.file_name}
                />
              ) : (
                <div className="p-8 flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      이 파일 형식은 미리보기를 지원하지 않습니다.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      다운로드 버튼을 클릭하여 파일을 다운로드하세요.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                {previewDocument.file_size && (
                  <p>파일 크기: {Math.round(previewDocument.file_size / 1024)} KB</p>
                )}
                <p>업로드 날짜: {new Date(previewDocument.created_at).toLocaleDateString('ko-KR')}</p>
                {previewDocument.uploader && (
                  <p>업로더: {previewDocument.uploader.full_name}</p>
                )}
                {previewDocument.notes && (
                  <p className="text-gray-600 dark:text-gray-300">메모: {previewDocument.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}