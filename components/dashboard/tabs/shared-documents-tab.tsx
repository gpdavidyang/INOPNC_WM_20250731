'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, File, Folder, Search, Filter, Download, Eye, 
  Share2, MoreHorizontal, FolderOpen, FileText, Image, 
  Archive, Grid, List, ChevronRight, ChevronDown, Plus,
  Users, Clock, Star, Bell, Activity, Shield, Lock,
  AlertCircle, CheckCircle, Settings, History, X, Pen
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SharedDocumentsTabProps {
  profile: Profile
}

interface SharedDocument {
  id: string
  name: string
  type: string
  size: number
  category: string
  uploadedAt: string
  uploadedBy: string
  lastModified: string
  version: number
  permissions: 'read' | 'write' | 'admin'
  isStarred: boolean
  url?: string
  thumbnail?: string
  sharedWith: string[]
  versionHistory: DocumentVersion[]
}

interface DocumentVersion {
  version: number
  uploadedAt: string
  uploadedBy: string
  changes: string
  size: number
}

interface DocumentCategory {
  id: string
  name: string
  icon: any
  description: string
  count: number
  permissions: {
    view: string[]
    upload: string[]
  }
}

interface ActivityItem {
  id: string
  type: 'upload' | 'update' | 'share' | 'download' | 'delete'
  documentName: string
  userName: string
  timestamp: string
  details: string
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'safety',
    name: '안전관리문서',
    icon: Shield,
    description: '안전 교육, 점검표, 사고 보고서',
    count: 0,
    permissions: {
      view: ['worker', 'site_manager', 'admin', 'system_admin'],
      upload: ['admin', 'system_admin']
    }
  },
  {
    id: 'construction-standards',
    name: '시공기준문서',
    icon: FileText,
    description: '시공 표준, 품질 기준, 기술 지침',
    count: 0,
    permissions: {
      view: ['worker', 'site_manager', 'admin', 'system_admin'],
      upload: ['site_manager', 'admin', 'system_admin']
    }
  },
  {
    id: 'company-regulations',
    name: '사규집',
    icon: Archive,
    description: '회사 규정, 정책, 절차서',
    count: 0,
    permissions: {
      view: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin'],
      upload: ['admin', 'system_admin']
    }
  },
  {
    id: 'education',
    name: '교육자료',
    icon: CheckCircle,
    description: '교육 과정, 매뉴얼, 가이드',
    count: 0,
    permissions: {
      view: ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin'],
      upload: ['admin', 'system_admin', 'trainer']
    }
  },
  {
    id: 'drawings',
    name: '도면',
    icon: Image,
    description: '설계 도면, 시공 도면, 상세도',
    count: 0,
    permissions: {
      view: ['site_manager', 'admin', 'system_admin'],
      upload: ['site_manager', 'admin', 'system_admin']
    }
  }
]

export default function SharedDocumentsTab({ profile }: SharedDocumentsTabProps) {
  const [documents, setDocuments] = useState<SharedDocument[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>(DOCUMENT_CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<SharedDocument | null>(null)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([])

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadDocuments()
    loadActivityLog()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      // Mock data for demo - in real implementation, this would fetch from Supabase
      const mockDocuments: SharedDocument[] = [
        {
          id: '1',
          name: '안전관리지침_2024.pdf',
          type: 'application/pdf',
          size: 3145728, // 3MB
          category: 'safety',
          uploadedAt: '2024-08-01T09:00:00Z',
          uploadedBy: '안전관리자',
          lastModified: '2024-08-01T09:00:00Z',
          version: 2,
          permissions: 'read',
          isStarred: true,
          sharedWith: ['전체 사용자'],
          versionHistory: [
            {
              version: 2,
              uploadedAt: '2024-08-01T09:00:00Z',
              uploadedBy: '안전관리자',
              changes: '여름철 안전 수칙 추가',
              size: 3145728
            },
            {
              version: 1,
              uploadedAt: '2024-06-01T09:00:00Z',
              uploadedBy: '안전관리자',
              changes: '초기 업로드',
              size: 2097152
            }
          ]
        },
        {
          id: '2',
          name: '콘크리트 시공기준_KCS.pdf',
          type: 'application/pdf',
          size: 5242880, // 5MB
          category: 'construction-standards',
          uploadedAt: '2024-07-30T14:30:00Z',
          uploadedBy: '기술팀장',
          lastModified: '2024-07-30T14:30:00Z',
          version: 1,
          permissions: 'read',
          isStarred: false,
          sharedWith: ['작업자', '현장관리자'],
          versionHistory: [
            {
              version: 1,
              uploadedAt: '2024-07-30T14:30:00Z',
              uploadedBy: '기술팀장',
              changes: '2024년 개정판 업로드',
              size: 5242880
            }
          ]
        },
        {
          id: '3',
          name: '인사규정_개정판.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1048576, // 1MB
          category: 'company-regulations',
          uploadedAt: '2024-07-25T10:00:00Z',
          uploadedBy: '인사팀',
          lastModified: '2024-07-28T15:30:00Z',
          version: 3,
          permissions: 'read',
          isStarred: false,
          sharedWith: ['전체 사용자'],
          versionHistory: [
            {
              version: 3,
              uploadedAt: '2024-07-28T15:30:00Z',
              uploadedBy: '인사팀',
              changes: '휴가 규정 수정',
              size: 1048576
            },
            {
              version: 2,
              uploadedAt: '2024-07-26T10:00:00Z',
              uploadedBy: '인사팀',
              changes: '복리후생 항목 추가',
              size: 1024000
            }
          ]
        },
        {
          id: '4',
          name: '신입사원 교육과정.pptx',
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: 10485760, // 10MB
          category: 'education',
          uploadedAt: '2024-07-20T11:00:00Z',
          uploadedBy: '교육담당자',
          lastModified: '2024-07-20T11:00:00Z',
          version: 1,
          permissions: 'read',
          isStarred: true,
          sharedWith: ['작업자', '현장관리자'],
          versionHistory: [
            {
              version: 1,
              uploadedAt: '2024-07-20T11:00:00Z',
              uploadedBy: '교육담당자',
              changes: '2024년 교육과정 제작',
              size: 10485760
            }
          ]
        }
      ]

      // Filter documents based on user role permissions
      const accessibleDocuments = mockDocuments.filter(doc => {
        const category = categories.find(cat => cat.id === doc.category)
        return category?.permissions.view.includes(profile.role) || false
      })

      setDocuments(accessibleDocuments)
      
      // Update category counts
      const updatedCategories = categories.map(category => ({
        ...category,
        count: accessibleDocuments.filter(doc => doc.category === category.id).length
      }))
      setCategories(updatedCategories)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivityLog = async () => {
    try {
      // Mock activity log data
      const mockActivity: ActivityItem[] = [
        {
          id: '1',
          type: 'upload',
          documentName: '안전관리지침_2024.pdf',
          userName: '안전관리자',
          timestamp: '2024-08-01T09:00:00Z',
          details: '새 버전 업로드 (v2)'
        },
        {
          id: '2',
          type: 'download',
          documentName: '콘크리트 시공기준_KCS.pdf',
          userName: profile.full_name,
          timestamp: '2024-07-31T14:30:00Z',
          details: '문서 다운로드'
        },
        {
          id: '3',
          type: 'share',
          documentName: '인사규정_개정판.docx',
          userName: '인사팀',
          timestamp: '2024-07-28T15:30:00Z',
          details: '전체 사용자와 공유'
        },
        {
          id: '4',
          type: 'update',
          documentName: '신입사원 교육과정.pptx',
          userName: '교육담당자',
          timestamp: '2024-07-20T11:00:00Z',
          details: '즐겨찾기에 추가'
        }
      ]
      setActivityLog(mockActivity)
    } catch (error) {
      console.error('Error loading activity log:', error)
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
          comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
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
    if (type.startsWith('image/')) return Image
    if (type.includes('pdf')) return FileText
    if (type.includes('word')) return FileText
    if (type.includes('excel')) return FileText
    return File
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return Upload
      case 'update': return Settings
      case 'share': return Share2
      case 'download': return Download
      case 'delete': return AlertCircle
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload': return 'text-green-600'
      case 'update': return 'text-blue-600'
      case 'share': return 'text-purple-600'
      case 'download': return 'text-orange-600'
      case 'delete': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const toggleStar = (documentId: string) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, isStarred: !doc.isStarred }
          : doc
      )
    )
  }

  const canUpload = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category?.permissions.upload.includes(profile.role) || false
  }

  const getPermissionBadge = (permission: string) => {
    switch (permission) {
      case 'read':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">읽기</span>
      case 'write':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">편집</span>
      case 'admin':
        return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">관리</span>
      default:
        return null
    }
  }

  const isBlueprint = (document: SharedDocument) => {
    const blueprintExtensions = ['.dwg', '.dxf', '.pdf']
    const extension = document.name.toLowerCase().substr(document.name.lastIndexOf('.'))
    return document.category === 'drawings' || blueprintExtensions.includes(extension)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">공유문서를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">공유문서함</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              팀 전체가 공유하는 문서 | {documents.length}개 파일
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowActivityLog(!showActivityLog)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">활동 로그</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/markup')}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="도면 마킹 도구"
            >
              <Pen className="h-4 w-4" />
              <span className="hidden sm:inline">도면 마킹</span>
            </button>
            {(profile.role === 'admin' || profile.role === 'system_admin') && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors touch-manipulation">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">문서 업로드</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters - Mobile Optimized */}
        <div className="flex flex-col gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="문서 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            />
          </div>
          <div className="flex gap-2 justify-between sm:justify-start">
            <div className="flex gap-2 flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 sm:flex-initial px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="date">수정일순</option>
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
            </div>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                title="리스트 보기"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                title="그리드 보기"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Categories Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">문서 카테고리</h3>
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
                const hasAccess = category.permissions.view.includes(profile.role)
                return (
                  <li key={category.id}>
                    <button
                      onClick={() => hasAccess && setSelectedCategory(category.id)}
                      disabled={!hasAccess}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : hasAccess 
                          ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">{category.name}</div>
                          <div className="text-xs opacity-75">{category.description}</div>
                        </div>
                        {!hasAccess && <Lock className="h-3 w-3" />}
                      </div>
                      <span className="text-xs">{category.count}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Activity Log Sidebar */}
          {showActivityLog && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">최근 활동</h3>
              <div className="space-y-3">
                {activityLog.slice(0, 5).map((activity: any) => {
                  const ActivityIcon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start gap-2">
                      <ActivityIcon className={`h-4 w-4 mt-0.5 ${getActivityColor(activity.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          <span className="font-medium">{activity.userName}</span>이(가){' '}
                          <span className="font-medium">{activity.documentName}</span>{' '}
                          {activity.details}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Category Selector */}
        <div className="block lg:hidden">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">전체 문서 ({documents.length})</option>
            {categories.map((category: any) => {
              const hasAccess = category.permissions.view.includes(profile.role)
              return (
                <option 
                  key={category.id} 
                  value={category.id}
                  disabled={!hasAccess}
                >
                  {category.name} ({category.count}){!hasAccess ? ' 🔒' : ''}
                </option>
              )
            })}
          </select>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Documents Grid/List - Mobile Optimized */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredAndSortedDocuments.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">문서가 없습니다</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? '검색 조건에 맞는 문서가 없습니다.' : '아직 공유된 문서가 없습니다.'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredAndSortedDocuments.map((document: any) => {
                  const FileIcon = getFileIcon(document.type)
                  return (
                    <div
                      key={document.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                          <div className="flex items-center gap-1 ml-2">
                            {document.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                            {getPermissionBadge(document.permissions)}
                          </div>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                          {document.name}
                        </h4>
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p>버전 {document.version} | {formatFileSize(document.size)}</p>
                          <p className="truncate">{formatDate(document.lastModified)}</p>
                          <p className="truncate">업로드: {document.uploadedBy}</p>
                        </div>
                        <div className="flex gap-1 mt-3">
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors touch-manipulation"
                            title="보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors touch-manipulation"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleStar(document.id)}
                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors touch-manipulation"
                            title="즐겨찾기"
                          >
                            <Star className={`h-4 w-4 ${document.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => setSelectedDocument(document)}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors touch-manipulation"
                            title="버전 기록"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {isBlueprint(document) && (
                            <button
                              onClick={() => router.push(`/dashboard/markup?file=${document.id}`)}
                              className="p-2 text-gray-400 hover:text-orange-600 transition-colors touch-manipulation"
                              title="도면 마킹"
                            >
                              <Pen className="h-4 w-4" />
                            </button>
                          )}
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
                      {/* Mobile View */}
                      <div className="block sm:hidden">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                                  {document.name}
                                </h4>
                                {document.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0 mt-0.5" />}
                              </div>
                              {getPermissionBadge(document.permissions)}
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  버전 {document.version} | {formatFileSize(document.size)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(document.lastModified)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  업로드: {document.uploadedBy}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pl-11">
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors touch-manipulation"
                            title="보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors touch-manipulation"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleStar(document.id)}
                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors touch-manipulation"
                            title="즐겨찾기"
                          >
                            <Star className={`h-4 w-4 ${document.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => setSelectedDocument(document)}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors touch-manipulation"
                            title="버전 기록"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {isBlueprint(document) && (
                            <button
                              onClick={() => router.push(`/dashboard/markup?file=${document.id}`)}
                              className="p-2 text-gray-400 hover:text-orange-600 transition-colors touch-manipulation"
                              title="도면 마킹"
                            >
                              <Pen className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Desktop View */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {document.name}
                              </h4>
                              {document.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
                              {getPermissionBadge(document.permissions)}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>버전 {document.version}</span>
                              <span>{formatFileSize(document.size)}</span>
                              <span className="hidden md:inline">{formatDate(document.lastModified)}</span>
                              <span className="hidden lg:inline">업로드: {document.uploadedBy}</span>
                              <span className="hidden xl:inline">공유: {document.sharedWith.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
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
                            onClick={() => toggleStar(document.id)}
                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                            title="즐겨찾기"
                          >
                            <Star className={`h-4 w-4 ${document.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => setSelectedDocument(document)}
                            className="p-2 text-gray-400 hover:text-purple-600 transition-colors hidden sm:block"
                            title="버전 기록"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {isBlueprint(document) && (
                            <button
                              onClick={() => router.push(`/dashboard/markup?file=${document.id}`)}
                              className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                              title="도면 마킹"
                            >
                              <Pen className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors hidden lg:block"
                            title="더보기"
                          >
                            <MoreHorizontal className="h-4 w-4" />
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

      {/* Version History Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  버전 기록 - {selectedDocument.name}
                </h3>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {selectedDocument.versionHistory.map((version: any) => (
                  <div
                    key={version.version}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          버전 {version.version}
                        </span>
                        {version.version === selectedDocument.version && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">현재</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {version.changes}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatDate(version.uploadedAt)}</span>
                        <span>{version.uploadedBy}</span>
                        <span>{formatFileSize(version.size)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}