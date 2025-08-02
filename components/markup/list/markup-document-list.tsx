'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select-new'
import { getFullTypographyClass } from '@/contexts/FontSizeContext'
import { MarkupDocument } from '@/types'
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Share2, 
  Calendar,
  User,
  Building2,
  Eye
} from 'lucide-react'

interface MarkupDocumentListProps {
  onCreateNew: () => void
  onOpenDocument: (document: MarkupDocument) => void
  onEditDocument: (document: MarkupDocument) => void
  isLargeFont?: boolean
  touchMode?: string
}

interface DocumentsResponse {
  success: boolean
  data: MarkupDocument[]
  error?: string
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function MarkupDocumentList({ 
  onCreateNew, 
  onOpenDocument,
  onEditDocument,
  isLargeFont = false,
  touchMode = 'normal' 
}: MarkupDocumentListProps) {
  const [documents, setDocuments] = useState<MarkupDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState<'personal' | 'shared'>('personal')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        location,
        page: currentPage.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`/api/markup-documents?${params}`)
      const result: DocumentsResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch documents')
      }

      if (result.success) {
        setDocuments(result.data)
        setTotalPages(result.pagination.totalPages)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [location, currentPage, searchQuery])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('이 마킹 도면을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/markup-documents/${documentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete document')
      }

      // 목록 새로고침
      fetchDocuments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred while deleting')
    }
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

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 헤더 - 모바일 최적화 */}
      <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${
        touchMode === 'glove' ? 'p-5 md:p-6' : touchMode === 'precision' ? 'p-2.5 md:p-3' : 'p-3 md:p-4'
      }`}>
        <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <h1 className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} md:${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>마킹 도면 관리</h1>
          <Button 
            onClick={onCreateNew} 
            className={`${
              touchMode === 'glove' ? 'min-h-[60px]' : touchMode === 'precision' ? 'min-h-[44px]' : 'min-h-[48px]'
            } flex items-center justify-center gap-2 w-full md:w-auto`}
            size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
          >
            <Plus className="h-5 w-5" />
            <span className="md:inline">새 마킹 도구</span>
          </Button>
        </div>

        {/* 필터 및 검색 - 모바일 우선 레이아웃 */}
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:gap-3 mt-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="도면 제목으로 검색..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className={`pl-10 ${
                  touchMode === 'glove' ? 'min-h-[60px] text-lg' : 
                  touchMode === 'precision' ? 'min-h-[40px] text-sm' : 
                  'min-h-[48px] text-base'
                } md:${getFullTypographyClass('body', 'sm', isLargeFont)}`}
              />
            </div>
          </div>
          <Select 
            value={location} 
            onValueChange={(value) => setLocation(value as 'personal' | 'shared')}
          >
            <SelectTrigger className={`${
              touchMode === 'glove' ? 'min-h-[60px]' : touchMode === 'precision' ? 'min-h-[40px]' : 'min-h-[48px]'
            } w-full md:w-48`}>
              <SelectValue placeholder="문서함 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">내 문서함</SelectItem>
              <SelectItem value="shared">공유 문서함</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 콘텐츠 - 모바일 최적화된 여백 */}
      <div className={`flex-1 ${
        touchMode === 'glove' ? 'p-5 md:p-6' : touchMode === 'precision' ? 'p-2.5 md:p-3' : 'p-3 md:p-4'
      } overflow-y-auto`}>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
            <p className={`text-red-800 dark:text-red-200 ${getFullTypographyClass('body', 'sm', isLargeFont)}`}>{error}</p>
            <Button 
              variant="outline" 
              size="compact" 
              onClick={fetchDocuments}
              className={`mt-2 ${
                touchMode === 'glove' ? 'min-h-[48px]' : touchMode === 'precision' ? 'min-h-[36px]' : 'min-h-[40px]'
              }`}
            >
              다시 시도
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-3 animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-28 md:h-32 rounded mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-1.5"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded mb-1.5"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-3 rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className={`${getFullTypographyClass('body', 'base', isLargeFont)} md:${getFullTypographyClass('heading', 'lg', isLargeFont)} font-medium text-gray-900 dark:text-gray-100 mb-2`}>
              {searchQuery ? '검색 결과가 없습니다' : '저장된 마킹 도면이 없습니다'}
            </h3>
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} md:${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600 dark:text-gray-400 mb-4 px-4`}>
              {searchQuery 
                ? '다른 검색어로 시도해보세요' 
                : '새로운 도면을 업로드하고 마킹을 시작해보세요'
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={onCreateNew}
                size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
                className={`${
                  touchMode === 'glove' ? 'min-h-[60px]' : touchMode === 'precision' ? 'min-h-[44px]' : 'min-h-[48px]'
                }`}
              >
                <Plus className="h-5 w-5 mr-2" />
                첫 번째 마킹 도면 만들기
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* 문서 그리드 - 모바일 최적화 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 mb-4">
              {documents.map((doc: any) => (
                <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800">
                  {/* 미리보기 이미지 */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {doc.preview_image_url ? (
                      <img 
                        src={doc.preview_image_url} 
                        alt={doc.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>

                  {/* 문서 정보 - 모바일 최적화 여백 */}
                  <div className={`${
                    touchMode === 'glove' ? 'p-4' : touchMode === 'precision' ? 'p-2.5' : 'p-3'
                  }`}>
                    <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate ${getFullTypographyClass('body', 'sm', isLargeFont)} md:${getFullTypographyClass('body', 'base', isLargeFont)}`} title={doc.title}>
                      {doc.title}
                    </h3>
                    
                    {doc.description && (
                      <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} md:${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400 mb-2 line-clamp-2`}>
                        {doc.description}
                      </p>
                    )}

                    <div className={`flex items-center gap-3 ${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mb-3 flex-wrap`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{formatDate(doc.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        {doc.markup_count}개
                      </div>
                    </div>

                    {/* 액션 버튼 - 모바일 터치 최적화 */}
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                        onClick={() => onOpenDocument(doc)}
                        className={`flex-1 ${
                          touchMode === 'glove' ? 'min-h-[48px]' : touchMode === 'precision' ? 'min-h-[36px]' : 'min-h-[40px]'
                        } ${getFullTypographyClass('caption', 'xs', isLargeFont)} md:${getFullTypographyClass('body', 'sm', isLargeFont)}`}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">열기</span>
                        <span className="sm:hidden">열기</span>
                      </Button>
                      <Button
                        variant="outline"
                        size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                        onClick={() => onEditDocument(doc)}
                        className={`${
                          touchMode === 'glove' ? 'min-h-[48px] min-w-[48px]' : 
                          touchMode === 'precision' ? 'min-h-[36px] min-w-[36px]' : 
                          'min-h-[40px] min-w-[40px]'
                        }`}
                        title="편집"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                        onClick={() => handleDelete(doc.id)}
                        className={`text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ${
                          touchMode === 'glove' ? 'min-h-[48px] min-w-[48px]' : 
                          touchMode === 'precision' ? 'min-h-[36px] min-w-[36px]' : 
                          'min-h-[40px] min-w-[40px]'
                        }`}
                        title="삭제"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* 페이지네이션 - 모바일 터치 최적화 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`${
                    touchMode === 'glove' ? 'min-h-[52px] min-w-[80px]' : 
                    touchMode === 'precision' ? 'min-h-[40px] min-w-[50px]' : 
                    'min-h-[44px] min-w-[60px]'
                  }`}
                >
                  이전
                </Button>
                <span className={`flex items-center px-3 py-2 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400 ${
                  touchMode === 'glove' ? 'min-h-[52px]' : touchMode === 'precision' ? 'min-h-[40px]' : 'min-h-[44px]'
                }`}>
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`${
                    touchMode === 'glove' ? 'min-h-[52px] min-w-[80px]' : 
                    touchMode === 'precision' ? 'min-h-[40px] min-w-[50px]' : 
                    'min-h-[44px] min-w-[60px]'
                  }`}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}