'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  Eye,
  Download,
  ChevronRight,
  Clock,
  User,
  FolderOpen,
  Shield,
  HardHat,
  FileSpreadsheet,
  AlertCircle,
  ClipboardList
} from 'lucide-react'
import { getSharedDocuments } from '@/app/actions/documents'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface SharedDocumentsProps {
  profile: any
}

interface SharedDocument {
  id: string
  category: string
  name: string
  size: number
  uploadDate: string
  lastModified: string
  uploadedBy: string
  fileType: string
  url?: string
  accessLevel: 'public' | 'site' | 'organization' | 'role'
  site?: { id: string; name: string }
  organization?: { id: string; name: string }
}

const sharedCategories = [
  {
    id: 'site-docs',
    name: '현장 공통 문서',
    icon: Building2,
    color: 'bg-blue-100 text-blue-700',
    description: '현장 도면, 작업 지침서, 공사 계획서',
    accessLevel: 'site'
  },
  {
    id: 'safety-docs',
    name: '안전관리 문서',
    icon: Shield,
    color: 'bg-red-100 text-red-700',
    description: '안전 규정, MSDS, 위험성 평가서',
    accessLevel: 'public'
  },
  {
    id: 'technical-specs',
    name: '기술 사양서',
    icon: FileSpreadsheet,
    color: 'bg-purple-100 text-purple-700',
    description: '자재 사양서, 시공 상세도, 품질 기준서',
    accessLevel: 'site'
  },
  {
    id: 'company-notices',
    name: '회사 공지사항',
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-700',
    description: '인사 공지, 규정 변경, 행사 안내',
    accessLevel: 'organization'
  },
  {
    id: 'forms-templates',
    name: '양식/템플릿',
    icon: ClipboardList,
    color: 'bg-green-100 text-green-700',
    description: '업무 양식, 보고서 템플릿, 신청서 양식',
    accessLevel: 'public'
  },
  {
    id: 'education-materials',
    name: '교육 자료',
    icon: HardHat,
    color: 'bg-indigo-100 text-indigo-700',
    description: '안전교육, 기술교육, 신규자 OJT',
    accessLevel: 'organization'
  }
]

export function SharedDocuments({ profile }: SharedDocumentsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [documents, setDocuments] = useState<SharedDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')

  useEffect(() => {
    if (selectedCategory) {
      loadDocuments()
    }
  }, [selectedCategory, filterRole])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getSharedDocuments({
        category: selectedCategory!,
        userId: profile.id,
        siteId: profile.site_id,
        organizationId: profile.organization_id,
        role: profile.role
      })
      
      if (result.success && result.data) {
        setDocuments(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getAccessBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case 'public':
        return <Badge variant="secondary">전체 공개</Badge>
      case 'site':
        return <Badge variant="secondary">현장 공유</Badge>
      case 'organization':
        return <Badge variant="warning">회사 내부</Badge>
      case 'role':
        return <Badge variant="default">역할 제한</Badge>
      default:
        return null
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedCategoryInfo = sharedCategories.find(cat => cat.id === selectedCategory)

  // Filter categories based on user access
  const accessibleCategories = sharedCategories.filter(category => {
    if (category.accessLevel === 'public') return true
    if (category.accessLevel === 'site' && profile.site_id) return true
    if (category.accessLevel === 'organization' && profile.organization_id) return true
    if (category.accessLevel === 'role' && ['admin', 'site_manager'].includes(profile.role)) return true
    return false
  })

  if (!selectedCategory) {
    // Category Selection View
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">
              역할과 소속에 따라 접근 가능한 문서가 다를 수 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">내 역할: </span>
            <Badge>{profile.role === 'admin' ? '관리자' : profile.role === 'site_manager' ? '현장소장' : '작업자'}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessibleCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>문서 보기</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                      {getAccessBadge(category.accessLevel)}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // Document List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            ← 뒤로
          </Button>
          {selectedCategoryInfo && (
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${selectedCategoryInfo.color}`}>
                <selectedCategoryInfo.icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">{selectedCategoryInfo.name}</h2>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="문서 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          필터
        </Button>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          문서를 불러오는 중...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '이 카테고리에 공유된 문서가 없습니다.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <Card
              key={doc.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(doc.uploadDate), 'yyyy.MM.dd', { locale: ko })}
                      </span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {doc.uploadedBy}
                      </span>
                      {doc.site && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {doc.site.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getAccessBadge(doc.accessLevel)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}