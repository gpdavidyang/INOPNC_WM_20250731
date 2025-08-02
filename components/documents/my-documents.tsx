'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Folder,
  Eye,
  Trash2,
  Share2,
  Clock,
  User
} from 'lucide-react'
import { getMyDocuments, uploadDocument, deleteDocument } from '@/app/actions/documents'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useFontSize,  getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface MyDocumentsProps {
  profile: any
}

interface Document {
  id: string
  category: string
  name: string
  size: number
  uploadDate: string
  lastModified: string
  uploadedBy: string
  fileType: string
  url?: string
}


export function MyDocuments({ profile }: MyDocumentsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [selectedCategory, setSelectedCategory] = useState<string | null>('all')
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (selectedCategory) {
      loadDocuments()
    }
  }, [selectedCategory])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getMyDocuments({
        category: selectedCategory === 'all' ? undefined : selectedCategory!,
        userId: profile.id
      })
      
      if (result.success && result.data) {
        setDocuments(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('title', selectedFile.name)
    formData.append('description', selectedFile.name)
    formData.append('document_type', 'other')
    formData.append('folder_path', 'personal')
    formData.append('site_id', profile.site_id || '')
    formData.append('is_public', 'false')
    
    const result = await uploadDocument(formData)
    
    if (result.success) {
      setUploadModalOpen(false)
      setSelectedFile(null)
      loadDocuments()
    }
  }

  const handleDelete = async (documentId: string) => {
    if (confirm('이 문서를 삭제하시겠습니까?')) {
      const result = await deleteDocument(documentId)
      if (result.success) {
        loadDocuments()
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Document List View - 바로 보여주기
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-semibold`}>내문서함</h2>
        </div>
        <Button 
          onClick={() => setUploadModalOpen(true)}
          size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
        >
          <Upload className="h-4 w-4 mr-2" />
          파일 업로드
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="문서 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 ${
              touchMode === 'glove' ? 'h-14 text-lg' : 
              touchMode === 'precision' ? 'h-9 text-sm' : 
              'h-10 text-base'
            }`}
          />
        </div>
        <Button 
          variant="outline"
          size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
        >
          <Filter className="h-4 w-4 mr-2" />
          필터
        </Button>
      </div>

      {/* Document List */}
      {loading ? (
        <div className={`text-center py-12 ${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500`}>
          문서를 불러오는 중...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className={`${
          touchMode === 'glove' ? 'p-16' : touchMode === 'precision' ? 'p-8' : 'p-12'
        } text-center`}>
          <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-500`}>
            {searchTerm ? '검색 결과가 없습니다.' : '아직 업로드된 문서가 없습니다.'}
          </p>
          {!searchTerm && (
            <Button
              className="mt-4"
              onClick={() => setUploadModalOpen(true)}
              size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
            >
              첫 문서 업로드하기
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc: any) => (
            <Card
              key={doc.id}
              className={`${
                touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
              } hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium text-gray-900`}>{doc.name}</h4>
                    <div className={`flex items-center gap-4 mt-1 ${getFullTypographyClass('caption', 'sm', isLargeFont)} text-gray-500`}>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(doc.uploadDate), 'yyyy.MM.dd', { locale: ko })}
                      </span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {doc.uploadedBy}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                    onClick={() => {}}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className={`w-full max-w-md ${
            touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
          }`}>
            <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>문서 업로드</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 mb-2`}>
                  파일 선택
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className={`w-full ${
                    touchMode === 'glove' ? 'p-3' : touchMode === 'precision' ? 'p-1.5' : 'p-2'
                  } border border-gray-300 rounded-md`}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </div>
              
              {selectedFile && (
                <div className={`${
                  touchMode === 'glove' ? 'p-4' : touchMode === 'precision' ? 'p-2' : 'p-3'
                } bg-gray-50 rounded-md`}>
                  <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>{selectedFile.name}</p>
                  <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadModalOpen(false)
                  setSelectedFile(null)
                }}
                size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
              >
                취소
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile}
                size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
              >
                업로드
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}