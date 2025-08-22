'use client'

import { useState, useRef } from 'react'
import { Profile } from '@/types'
import { 
  Upload, File, Download, Eye, Share2, Trash2,
  Search, Grid, List, ChevronUp, CheckCircle,
  Shield, FileText, Archive, Image
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'

interface PartnerDocumentsTabProps {
  profile: Profile
  sites: any[]
}

interface Document {
  id: string
  name: string
  type: 'pdf' | 'excel' | 'word' | 'image'
  size: string
  uploadDate: string
  uploader?: string
  site?: string
}

export default function PartnerDocumentsTab({ profile, sites }: PartnerDocumentsTabProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'shared' | 'billing'>('personal')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock documents for each tab
  const personalDocuments: Document[] = [
    { id: '1', name: '작업계획서_2024.pdf', type: 'pdf', size: '2.3 MB', uploadDate: '2024-03-18' },
    { id: '2', name: '개인메모_현장정리.docx', type: 'word', size: '156 KB', uploadDate: '2024-03-17' },
    { id: '3', name: '참고자료_안전교육.pdf', type: 'pdf', size: '4.2 MB', uploadDate: '2024-03-15' }
  ]

  const sharedDocuments: Document[] = [
    { id: '4', name: '안전관리계획서_v2.pdf', type: 'pdf', size: '3.1 MB', uploadDate: '2024-03-18', uploader: '김관리', site: '강남 A현장' },
    { id: '5', name: '작업지시서_0318.pdf', type: 'pdf', size: '892 KB', uploadDate: '2024-03-17', uploader: '이소장', site: '송파 B현장' },
    { id: '6', name: '품질검사보고서.xlsx', type: 'excel', size: '1.5 MB', uploadDate: '2024-03-16', uploader: '박품질', site: '강남 A현장' }
  ]

  const billingDocuments: Document[] = [
    { id: '7', name: '견적서_강남A현장_202403.pdf', type: 'pdf', size: '2.8 MB', uploadDate: '2024-03-18', site: '강남 A현장' },
    { id: '8', name: '계약서_송파B현장.pdf', type: 'pdf', size: '5.2 MB', uploadDate: '2024-03-15', site: '송파 B현장' },
    { id: '9', name: '시공계획서_강남A.pdf', type: 'pdf', size: '8.7 MB', uploadDate: '2024-03-10', site: '강남 A현장' },
    { id: '10', name: '전자세금계산서_202403.pdf', type: 'pdf', size: '423 KB', uploadDate: '2024-03-18', site: '강남 A현장' },
    { id: '11', name: '사진대지문서_3월.pdf', type: 'pdf', size: '12.3 MB', uploadDate: '2024-03-17', site: '송파 B현장' },
    { id: '12', name: '작업완료확인서_3월2주.pdf', type: 'pdf', size: '1.1 MB', uploadDate: '2024-03-14', site: '강남 A현장' },
    { id: '13', name: '진행도면_v3.pdf', type: 'pdf', size: '6.5 MB', uploadDate: '2024-03-12', site: '서초 C현장' }
  ]

  const getDocuments = () => {
    let docs: Document[] = []
    
    switch (activeTab) {
      case 'personal':
        docs = personalDocuments
        break
      case 'shared':
        docs = sharedDocuments
        break
      case 'billing':
        docs = billingDocuments
        break
    }

    // Filter by site (for shared and billing tabs)
    if (selectedSite !== 'all' && activeTab !== 'personal') {
      docs = docs.filter(doc => doc.site === selectedSite)
    }

    // Filter by search term
    if (searchTerm) {
      docs = docs.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort documents
    docs.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.uploadDate).getTime()
        const dateB = new Date(b.uploadDate).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      } else {
        return sortOrder === 'desc' 
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name)
      }
    })

    return docs
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄'
      case 'excel': return '📊'
      case 'word': return '📝'
      case 'image': return '🖼️'
      default: return '📁'
    }
  }

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(documents.map(doc => doc.id))
    }
  }

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
        alert('카카오톡 공유 기능은 준비 중입니다.')
        break
      case 'link':
        navigator.clipboard.writeText(shareText)
        alert('링크가 클립보드에 복사되었습니다.')
        break
    }
    setShowShareModal(false)
    setIsSelectionMode(false)
    setSelectedDocuments([])
  }

  const documents = getDocuments()

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'personal'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            내문서함
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'shared'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            공유문서함
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'billing'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          >
            기성청구함
          </button>
        </nav>
      </div>

      {/* Header and Controls - Modern Compact Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {activeTab === 'personal' ? '내문서함' : activeTab === 'shared' ? '공유문서함' : '기성청구함'}
            </h2>
            {isSelectionMode && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {selectedDocuments.length}개 선택됨
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isSelectionMode ? (
              <>
                <button
                  onClick={() => {
                    setIsSelectionMode(false)
                    setSelectedDocuments([])
                  }}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  disabled={selectedDocuments.length === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors"
                >
                  <Share2 className="h-3 w-3" />
                  공유
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <CheckCircle className="h-3 w-3" />
                  선택
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors touch-manipulation"
                >
                  <Upload className="h-3 w-3" />
                  업로드
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters - Compact Design */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="파일명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {/* Site selector for shared/billing tabs */}
            {activeTab !== 'personal' && (
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-[100px] h-7 px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="현장" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                  <SelectItem 
                    value="all"
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400 cursor-pointer"
                  >
                    전체 현장
                  </SelectItem>
                  {sites.map(site => (
                    <SelectItem 
                      key={site.id} 
                      value={site.name}
                      className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400 cursor-pointer"
                    >
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <button
                onClick={() => setSortBy('date')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  sortBy === 'date' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                날짜
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  sortBy === 'name' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                이름
              </button>
            </div>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
            >
              <ChevronUp className={`h-3 w-3 transition-transform text-gray-700 dark:text-gray-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title="리스트 보기"
              >
                <List className="h-3 w-3" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
                title="그리드 보기"
              >
                <Grid className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={() => {
          // Handle file upload
          alert('파일 업로드 기능은 준비 중입니다.')
        }}
      />

      {/* Documents List/Grid - Modern Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4">
          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">문서가 없습니다</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
              >
                첫 문서 업로드
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-1">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between p-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => toggleDocumentSelection(doc.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-lg">{getFileIcon(doc.type)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{doc.size}</span>
                        <span>{doc.uploadDate}</span>
                        {doc.uploader && <span>{doc.uploader}</span>}
                        {doc.site && (
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {doc.site}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="미리보기"
                    >
                      <Eye className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="다운로드"
                    >
                      <Download className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="공유"
                    >
                      <Share2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button 
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="group relative p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
                >
                  {isSelectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => toggleDocumentSelection(doc.id)}
                      className="absolute top-2 left-2 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 z-10"
                    />
                  )}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 mb-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                      <span className="text-3xl">{getFileIcon(doc.type)}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white text-center line-clamp-2">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{doc.size}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{doc.uploadDate}</p>
                    {doc.site && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate max-w-full">
                        {doc.site}
                      </p>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-1 bg-white dark:bg-gray-800 rounded shadow-sm hover:shadow-md transition-shadow"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle actions
                      }}
                    >
                      <Download className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full mx-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              문서 공유 방법 선택
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleShare('email')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                이메일로 공유
              </button>
              <button
                onClick={() => handleShare('sms')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                SMS로 공유
              </button>
              <button
                onClick={() => handleShare('kakao')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                카카오톡으로 공유
              </button>
              <button
                onClick={() => handleShare('link')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                링크 복사
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-3 w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm rounded-md transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}