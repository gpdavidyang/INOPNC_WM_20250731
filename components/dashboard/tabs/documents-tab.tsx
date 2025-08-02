'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, File, Folder, Search, Filter, Download, Eye, 
  Trash2, MoreHorizontal, FolderOpen, FileText, Image, 
  Archive, Grid, List, ChevronRight, ChevronDown, Plus,
  HardDrive, AlertCircle, CheckCircle, X
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

interface Category {
  id: string
  name: string
  icon: any
  count: number
  expanded?: boolean
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

const CATEGORIES: Category[] = [
  { id: 'work-reports', name: '작업일지', icon: FileText, count: 0 },
  { id: 'safety-docs', name: '안전관리', icon: AlertCircle, count: 0 },
  { id: 'construction-docs', name: '시공문서', icon: File, count: 0 },
  { id: 'photos', name: '현장사진', icon: Image, count: 0 },
  { id: 'certificates', name: '자격증명서', icon: CheckCircle, count: 0 },
  { id: 'misc', name: '기타문서', icon: Archive, count: 0 }
]

const MAX_STORAGE_GB = 1
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
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [storageUsed, setStorageUsed] = useState(0) // in bytes
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
      
      // Calculate storage usage
      const totalSize = allDocuments.reduce((sum: any, doc: any) => sum + doc.size, 0)
      setStorageUsed(totalSize)
      
      // Update category counts
      const updatedCategories = categories.map(category => ({
        ...category,
        count: allDocuments.filter(doc => doc.category === category.id).length
      }))
      setCategories(updatedCategories)
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
    if (storageUsed + file.size > MAX_STORAGE_GB * 1024 * 1024 * 1024) {
      return '저장 공간이 부족합니다.'
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
      setStorageUsed(prev => prev + file.size)
      
      // Update category count
      setCategories(prev => 
        prev.map(cat => 
          cat.id === category 
            ? { ...cat, count: cat.count + 1 }
            : cat
        )
      )

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
    setStorageUsed(prev => prev - doc.size)
    
    // Update category count
    setCategories(prev => 
      prev.map(cat => 
        cat.id === doc.category 
          ? { ...cat, count: Math.max(0, cat.count - 1) }
          : cat
      )
    )
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

  const storagePercentage = (storageUsed / (MAX_STORAGE_GB * 1024 * 1024 * 1024)) * 100

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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              개인 문서 저장소 | {documents.length}개 파일
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation"
          >
            <Upload className="h-4 w-4" />
            파일 업로드
          </button>
        </div>

        {/* Storage Usage */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">저장 공간</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatFileSize(storageUsed)} / {MAX_STORAGE_GB}GB
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                storagePercentage > 90 ? 'bg-red-500' :
                storagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">카테고리</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                    selectedCategory === 'all'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    전체 문서
                  </div>
                  <span className="text-xs">{documents.length}</span>
                </button>
              </li>
              {categories.map((category: any) => {
                const IconComponent = category.icon
                return (
                  <li key={category.id}>
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {category.name}
                      </div>
                      <span className="text-xs">{category.count}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
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
                  const FileIcon = getFileIcon(document.type)
                  return (
                    <div
                      key={document.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex flex-col items-center text-center">
                        {document.thumbnail ? (
                          <img
                            src={document.thumbnail}
                            alt={document.name}
                            className="w-12 h-12 object-cover rounded mb-2"
                          />
                        ) : (
                          <FileIcon className="h-12 w-12 text-gray-400 mb-2" />
                        )}
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                          {document.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(document.size)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(document.uploadedAt)}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(document.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedDocuments.map((document: any) => {
                  const FileIcon = getFileIcon(document.type)
                  return (
                    <div
                      key={document.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {document.thumbnail ? (
                            <img
                              src={document.thumbnail}
                              alt={document.name}
                              className="w-10 h-10 object-cover rounded flex-shrink-0"
                            />
                          ) : (
                            <FileIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {document.name}
                            </h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(document.size)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(document.uploadedAt)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {document.uploadedBy}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(document.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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