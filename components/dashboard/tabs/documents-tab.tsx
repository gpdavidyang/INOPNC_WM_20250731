'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, File, Folder, Search, Download, Eye, 
  Trash2, FileText, Image, 
  Grid, List, CheckCircle, X, AlertCircle,
  Clock, Share2, Mail, MessageSquare, Link2,
  Camera, FileCheck, ChevronUp, ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import ShareDialog from '@/components/documents/share-dialog'

interface DocumentsTabProps {
  profile: Profile
}

interface Document {
  id: string
  name: string
  type: string
  size: number
  category: string
  uploadedAt: string
  uploadedBy: string
  url?: string
  thumbnail?: string
  status?: 'completed' | 'pending' | 'processing' | 'review'
  isRequired?: boolean
  documentType?: string
  site?: string
  siteAddress?: string
}

interface RequiredDocument {
  id: string
  name: string
  description: string
  category: string
  isRequired: boolean
  uploadedDocument?: Document
  example?: string
  acceptedFormats?: string[]
  maxSize?: number
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

const MAX_FILE_SIZE_MB = 10
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export default function DocumentsTab({ profile }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isRequiredDocsExpanded, setIsRequiredDocsExpanded] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [documentToShare, setDocumentToShare] = useState<Document | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // 필수 서류 목록 정의
  const requiredDocuments: RequiredDocument[] = [
    {
      id: 'pre-work-medical',
      name: '배치전 검진 서류',
      description: '작업 배치 전 건강검진 결과서',
      category: 'medical',
      isRequired: true,
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: 5
    },
    {
      id: 'safety-education',
      name: '기초안전보건교육이수',
      description: '건설업 기초안전보건교육 이수증',
      category: 'certificate',
      isRequired: true,
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: 5
    },
    {
      id: 'vehicle-insurance',
      name: '차량보험증',
      description: '개인 차량 보험증명서',
      category: 'vehicle',
      isRequired: true,
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: 5
    },
    {
      id: 'vehicle-registration',
      name: '차량등록증',
      description: '차량 등록증 사본',
      category: 'vehicle',
      isRequired: true,
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: 5
    },
    {
      id: 'bank-account',
      name: '통장사본',
      description: '급여 입금용 통장 사본',
      category: 'financial',
      isRequired: true,
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: 5
    },
    {
      id: 'id-card',
      name: '신분증',
      description: '주민등록증 또는 운전면허증',
      category: 'personal',
      isRequired: true,
      acceptedFormats: ['image/jpeg', 'image/png'],
      maxSize: 5
    },
    {
      id: 'senior-docs',
      name: '고령자 서류',
      description: '만 60세 이상 근로자 추가 서류',
      category: 'special',
      isRequired: false,
      acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
      maxSize: 5
    }
  ]

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      // Fetch markup documents
      const markupResponse = await fetch('/api/markup-documents?location=personal')
      const markupResult = await markupResponse.json()
      
      const markupDocuments: Document[] = []
      
      if (markupResult.success && markupResult.data) {
        markupResult.data.forEach((doc: any) => {
          markupDocuments.push({
            id: doc.id,
            name: doc.title,
            type: 'markup-document',
            size: doc.file_size || 1024000, // Default 1MB if not specified
            category: 'construction-docs',
            uploadedAt: doc.created_at,
            uploadedBy: doc.created_by_name || profile.full_name,
            url: `/dashboard/markup?open=${doc.id}`
          })
        })
      }

      // Mock data for demo - in real implementation, this would fetch from Supabase
      // API에서 실제 데이터 가져오기
      const response = await fetch('/api/documents?type=personal')
      const result = await response.json()
      
      let mockDocuments: Document[] = []
      
      if (result.success && result.data.length > 0) {
        // API 데이터를 Document 형식으로 변환
        mockDocuments = result.data.map((doc: any) => ({
          id: doc.id,
          name: doc.title,
          type: doc.mime_type,
          size: doc.file_size || 1024000,
          category: doc.document_type || 'personal',
          uploadedAt: doc.created_at,
          uploadedBy: doc.owner?.full_name || doc.owner_name || profile.full_name,
          url: doc.file_url,
          site: doc.site?.name || doc.site_name,
          siteAddress: doc.site?.address || doc.site_address
        }))
      } else {
        // Fallback 데이터
        mockDocuments = [
          {
            id: '1',
            name: '2024년 7월 작업일지.pdf',
            type: 'application/pdf',
            size: 2048576, // 2MB
            category: 'work-reports',
            uploadedAt: '2024-08-01T10:30:00Z',
            uploadedBy: profile.full_name,
            url: '/documents/sample.pdf'
          },
        {
          id: '2',
          name: '안전점검표_8월.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024000, // 1MB
          category: 'safety-docs',
          uploadedAt: '2024-07-30T14:20:00Z',
          uploadedBy: profile.full_name
        },
        {
          id: '3',
          name: '현장사진_슬라브타설.jpg',
          type: 'image/jpeg',
          size: 3145728, // 3MB
          category: 'photos',
          uploadedAt: '2024-07-29T16:45:00Z',
          uploadedBy: profile.full_name,
          thumbnail: '/images/construction-site.jpg'
        },
        {
          id: '4',
          name: '시공계획서_최종.pdf',
          type: 'application/pdf',
          size: 5242880, // 5MB
          category: 'construction-docs',
          uploadedAt: '2024-07-28T09:15:00Z',
          uploadedBy: profile.full_name
        },
        {
          id: '5',
          name: '건설기술자격증.pdf',
          type: 'application/pdf',
          size: 512000, // 500KB
          category: 'certificates',
          uploadedAt: '2024-07-25T11:00:00Z',
          uploadedBy: profile.full_name
        }
      ]
      }

      // Combine markup documents with mock documents
      const allDocuments = [...markupDocuments, ...mockDocuments]
      
      setDocuments(allDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (type: string) => {
    if (type === 'markup-document') return FileText
    if (type.startsWith('image/')) return Image
    if (type.includes('pdf')) return FileText
    if (type.includes('word')) return FileText
    if (type.includes('excel')) return FileText
    return File
  }

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다.'
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `파일 크기가 ${MAX_FILE_SIZE_MB}MB를 초과합니다.`
    }
    return null
  }

  const uploadFile = async (file: File, category: string = 'misc', documentType?: string) => {
    const validation = validateFile(file)
    if (validation) {
      setUploadProgress(prev => [...prev, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: validation
      }])
      return
    }

    const progressItem: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }
    
    setUploadProgress(prev => [...prev, progressItem])

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadProgress(prev => 
          prev.map(item => 
            item.fileName === file.name 
              ? { ...item, progress }
              : item
          )
        )
      }

      // Mock successful upload
      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        category: category,
        uploadedAt: new Date().toISOString(),
        uploadedBy: profile.full_name,
        status: 'completed',
        documentType: documentType,
        isRequired: documentType ? requiredDocuments.find(doc => doc.id === documentType)?.isRequired : false
      }

      setDocuments(prev => [newDocument, ...prev])

      setUploadProgress(prev => 
        prev.map(item => 
          item.fileName === file.name 
            ? { ...item, progress: 100, status: 'completed' }
            : item
        )
      )

      // Remove completed upload after 3 seconds
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(item => item.fileName !== file.name))
      }, 3000)

    } catch (error) {
      setUploadProgress(prev => 
        prev.map(item => 
          item.fileName === file.name 
            ? { ...item, status: 'error', error: '업로드 실패' }
            : item
        )
      )
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const documentType = fileInputRef.current?.getAttribute('data-document-type')
    
    setUploading(true)
    Array.from(files).forEach(file => {
      uploadFile(file, selectedCategory === 'all' ? 'misc' : selectedCategory, documentType || undefined)
    })
    setUploading(false)
    
    // Reset the document type attribute
    fileInputRef.current?.removeAttribute('data-document-type')
  }


  const deleteDocument = async (documentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    const doc = documents.find(d => d.id === documentId)
    if (!doc) return

    setDocuments(prev => prev.filter(d => d.id !== documentId))
  }

  const handleShareDocument = (document: Document) => {
    setDocumentToShare(document)
    setShareDialogOpen(true)
  }

  const generateShareUrl = (document: Document) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/dashboard/documents/shared/${document.id}?token=${generateShareToken(document.id)}`
  }

  const generateShareToken = (documentId: string) => {
    // Generate a simple share token (in production, this should be more secure)
    return btoa(`${documentId}-${Date.now()}`).substring(0, 16)
  }

  const handleViewDocument = (document: Document) => {
    if (!document) {
      console.error('Document not found')
      alert('문서를 찾을 수 없습니다.')
      return
    }
    
    if (document.type === 'markup-document') {
      // Open markup document in markup editor
      router.push(`/dashboard/markup?open=${document.id}`)
    } else if (document.url) {
      // For other documents, open in new tab
      window.open(document.url, '_blank')
    } else {
      console.error('Document URL not found')
      alert('문서 URL을 찾을 수 없습니다.')
    }
  }

  const handleDownloadDocument = async (document: Document) => {
    try {
      if (document.type === 'markup-document') {
        // For markup documents, we could export as PDF or image
        alert('마킹 도면 다운로드 기능은 준비 중입니다.')
        return
      }

      if (document.url) {
        // Create a temporary link and click it to download
        const link = window.document.createElement('a')
        link.href = document.url
        link.download = document.name
        link.style.display = 'none'
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
      } else {
        // For mock documents without actual URLs
        alert('다운로드할 수 있는 파일이 없습니다.')
      }
    } catch (error) {
      console.error('Download failed:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">문서를 불러오는 중...</p>
      </div>
    )
  }

  // 필수 서류 업로드 상태 계산
  const uploadedRequiredDocs = requiredDocuments.filter(reqDoc => 
    documents.some(doc => doc.documentType === reqDoc.id && doc.status === 'completed')
  ).length
  const totalRequiredDocs = requiredDocuments.filter(doc => doc.isRequired).length

  // 선택된 문서 공유 함수
  const handleShare = (method: 'sms' | 'email' | 'kakao' | 'link') => {
    if (selectedDocuments.length === 0) {
      alert('공유할 문서를 선택해주세요.')
      return
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
    const shareText = `선택한 문서 ${selectedDocs.length}개:\n${selectedDocs.map(doc => doc.name).join('\n')}`

    switch (method) {
      case 'sms':
        window.location.href = `sms:?body=${encodeURIComponent(shareText)}`
        break
      case 'email':
        window.location.href = `mailto:?subject=문서 공유&body=${encodeURIComponent(shareText)}`
        break
      case 'kakao':
        // 카카오톡 공유 API 연동 필요
        alert('카카오톡 공유 기능은 준비 중입니다.')
        break
      case 'link':
        // 공유 링크 생성 로직
        navigator.clipboard.writeText(shareText)
        alert('링크가 클립보드에 복사되었습니다.')
        break
    }
    setShowShareModal(false)
    setIsSelectionMode(false)
    setSelectedDocuments([])
  }

  // 문서 선택 토글
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Selection Mode */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        {/* 헤더와 통합된 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">내문서함</h2>
            {isSelectionMode && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-md">
                {selectedDocuments.length}개 선택됨
              </span>
            )}
          </div>
          
          {/* 액션 버튼 그룹 */}
          <div className="flex items-center gap-2">
            {isSelectionMode ? (
              <>
                <button
                  onClick={() => {
                    setIsSelectionMode(false)
                    setSelectedDocuments([])
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  disabled={selectedDocuments.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  선택 공유
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  선택
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
                >
                  <Upload className="h-4 w-4" />
                  파일 업로드
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="파일명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setSortBy('date')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  sortBy === 'date' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                날짜순
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  sortBy === 'name' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                이름순
              </button>
            </div>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
            >
              <ChevronUp className={`h-4 w-4 transition-transform text-gray-700 dark:text-gray-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title="리스트 보기"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title="그리드 보기"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* 필수 서류 체크리스트 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            필수 제출 서류 ({uploadedRequiredDocs}/{totalRequiredDocs}개 완료)
          </h3>
          <button
            onClick={() => setIsRequiredDocsExpanded(!isRequiredDocsExpanded)}
            className="p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            title={isRequiredDocsExpanded ? "접기" : "펼치기"}
          >
            {isRequiredDocsExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
        </div>
        

        {/* 필수 서류 목록 - 펼쳐진 경우에만 표시 */}
        {isRequiredDocsExpanded && (
          <div className="grid gap-3">
            {requiredDocuments.map((reqDoc) => {
              const uploadedDoc = documents.find(doc => doc.documentType === reqDoc.id)
              const isUploaded = uploadedDoc?.status === 'completed'
              const isProcessing = uploadedDoc?.status === 'processing'
              const needsReview = uploadedDoc?.status === 'review'
              
              return (
                <div key={reqDoc.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {isUploaded ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : isProcessing ? (
                          <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
                        ) : needsReview ? (
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {reqDoc.name}
                          {!reqDoc.isRequired && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(선택)</span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{reqDoc.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {isUploaded ? (
                        <>
                          <button
                            onClick={() => handleViewDocument(uploadedDoc)}
                            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            미리보기
                          </button>
                          <button
                            onClick={() => deleteDocument(uploadedDoc.id)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            fileInputRef.current?.setAttribute('data-document-type', reqDoc.id)
                            fileInputRef.current?.click()
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                        >
                          업로드하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}
      </div>


      <div>
        {/* Main Content */}
        <div>
          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">업로드 진행상황</h4>
              <div className="space-y-2">
                {uploadProgress.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {item.fileName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.status === 'completed' ? '완료' : 
                           item.status === 'error' ? '실패' : 
                           `${item.progress}%`}
                        </span>
                      </div>
                      {item.status === 'uploading' && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{item.error}</p>
                      )}
                    </div>
                    {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {item.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Documents Grid/List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredAndSortedDocuments.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">문서가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? '검색 조건에 맞는 문서가 없습니다.' : '새로운 문서를 업로드해보세요.'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {filteredAndSortedDocuments.map((document: any) => {
                  const getFileTypeDisplay = (type: string) => {
                    if (type === 'markup-document') return '도면'
                    if (type.includes('pdf')) return 'PDF'
                    if (type.includes('word')) return 'DOC'
                    if (type.includes('excel')) return 'XLS'
                    if (type.startsWith('image/')) return 'IMG'
                    return 'FILE'
                  }
                  
                  const getFileTypeColor = (type: string) => {
                    if (type === 'markup-document') return 'bg-purple-100 text-purple-700 border-purple-200'
                    if (type.includes('pdf')) return 'bg-red-100 text-red-700 border-red-200'
                    if (type.includes('word')) return 'bg-blue-100 text-blue-700 border-blue-200'
                    if (type.includes('excel')) return 'bg-green-100 text-green-700 border-green-200'
                    if (type.startsWith('image/')) return 'bg-orange-100 text-orange-700 border-orange-200'
                    return 'bg-gray-100 text-gray-700 border-gray-200'
                  }

                  return (
                    <div
                      key={document.id}
                      className={`relative border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                        isSelectionMode && selectedDocuments.includes(document.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                      onClick={() => isSelectionMode && toggleDocumentSelection(document.id)}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(document.id)}
                            onChange={() => toggleDocumentSelection(document.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center text-center">
                        {/* File Type Badge */}
                        <div className="mb-3">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-md ${getFileTypeColor(document.type)}`}>
                            {getFileTypeDisplay(document.type)}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                          {document.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatFileSize(document.size)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                          {formatDate(document.uploadedAt)}
                        </p>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShareDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="공유하기"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(document.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAndSortedDocuments.map((document: any) => {
                  const FileIcon = getFileIcon(document.type)
                  const getFileTypeDisplay = (type: string) => {
                    if (type === 'markup-document') return '도면'
                    if (type.includes('pdf')) return 'PDF'
                    if (type.includes('word')) return 'DOC'
                    if (type.includes('excel')) return 'XLS'
                    if (type.startsWith('image/')) return 'IMG'
                    return 'FILE'
                  }
                  
                  const getFileTypeColor = (type: string) => {
                    if (type === 'markup-document') return 'bg-purple-100 text-purple-700 border-purple-200'
                    if (type.includes('pdf')) return 'bg-red-100 text-red-700 border-red-200'
                    if (type.includes('word')) return 'bg-blue-100 text-blue-700 border-blue-200'
                    if (type.includes('excel')) return 'bg-green-100 text-green-700 border-green-200'
                    if (type.startsWith('image/')) return 'bg-orange-100 text-orange-700 border-orange-200'
                    return 'bg-gray-100 text-gray-700 border-gray-200'
                  }

                  return (
                    <div
                      key={document.id}
                      className={`bg-white dark:bg-gray-800 border rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer ${
                        isSelectionMode && selectedDocuments.includes(document.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => isSelectionMode && toggleDocumentSelection(document.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(document.id)}
                              onChange={() => toggleDocumentSelection(document.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        
                        {/* Badge Only */}
                        <div className="flex-shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-md ${getFileTypeColor(document.type)}`}>
                            {getFileTypeDisplay(document.type)}
                          </span>
                        </div>
                        
                        {/* File Info - Enhanced Layout with Site Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                                {document.name}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>
                                  {new Date(document.uploadedAt).toLocaleDateString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                {document.site && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-24" title={document.siteAddress}>
                                      {document.site}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                작성자: {document.uploadedBy}
                              </div>
                            </div>
                            
                            {/* Action Buttons - Compact */}
                            <div className="flex items-center gap-1 ml-3">
                              <button
                                onClick={() => handleViewDocument(document)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="보기"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(document)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="다운로드"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleShareDocument(document)}
                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                title="공유하기"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteDocument(document.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowShareModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    문서 공유하기
                  </h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  선택한 {selectedDocuments.length}개의 문서를 공유합니다
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleShare('sms')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">문자</span>
                  </button>

                  <button
                    onClick={() => handleShare('email')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Mail className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">이메일</span>
                  </button>

                  <button
                    onClick={() => handleShare('kakao')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-6 w-6 mb-2 text-yellow-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">카카오톡</span>
                  </button>

                  <button
                    onClick={() => handleShare('link')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Link2 className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">링크 복사</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Document Share Dialog */}
      {shareDialogOpen && documentToShare && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false)
            setDocumentToShare(null)
          }}
          document={documentToShare}
          shareUrl={generateShareUrl(documentToShare)}
        />
      )}
    </div>
  )
}