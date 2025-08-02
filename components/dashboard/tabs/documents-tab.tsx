'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, File, Folder, Search, Download, Eye, 
  Trash2, FileText, Image, 
  Grid, List, CheckCircle, X
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

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
      const mockDocuments: Document[] = [
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
        case 'size':
          comparison = a.size - b.size
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

  const uploadFile = async (file: File, category: string = 'misc') => {
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
        uploadedBy: profile.full_name
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
    
    setUploading(true)
    Array.from(files).forEach(file => {
      uploadFile(file, selectedCategory === 'all' ? 'misc' : selectedCategory)
    })
    setUploading(false)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [selectedCategory])

  const deleteDocument = async (documentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    const doc = documents.find(d => d.id === documentId)
    if (!doc) return

    setDocuments(prev => prev.filter(d => d.id !== documentId))
  }

  const handleViewDocument = (document: Document) => {
    if (document.type === 'markup-document') {
      // Open markup document in markup editor
      router.push(`/dashboard/markup?open=${document.id}`)
    } else if (document.url) {
      // For other documents, open in new tab
      window.open(document.url, '_blank')
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
        const link = document.createElement('a')
        link.href = document.url
        link.download = document.name
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">내문서함</h2>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
          >
            <Upload className="h-4 w-4" />
            파일 업로드
          </button>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">날짜순</option>
              <option value="name">이름순</option>
              <option value="size">크기순</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
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

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed transition-colors ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600'
            } p-6 mb-4`}
          >
            <div className="text-center">
              <Upload className={`mx-auto h-8 w-8 mb-3 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDragOver ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                파일을 드래그하여 업로드하거나{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  파일 선택
                </button>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PDF, DOC, XLS, JPG, PNG 파일 지원 (최대 {MAX_FILE_SIZE_MB}MB)
              </p>
            </div>
          </div>

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
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
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
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        {/* Badge Only */}
                        <div className="flex-shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-md ${getFileTypeColor(document.type)}`}>
                            {getFileTypeDisplay(document.type)}
                          </span>
                        </div>
                        
                        {/* File Info - Simplified Layout */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                                {document.name}
                              </h4>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(document.uploadedAt).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
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
    </div>
  )
}