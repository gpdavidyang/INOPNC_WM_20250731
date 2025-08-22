'use client'

import { useState, useRef } from 'react'
import { Profile } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Upload, File, Download, Eye, Share2, Trash2,
  Search, Grid, List, ChevronUp, CheckCircle,
  Shield, FileText, Archive, Image, LayoutGrid, LayoutList,
  FileX2, FileSpreadsheet, FileType
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
      case 'pdf': 
        return <FileText className="h-5 w-5 text-red-500" />
      case 'excel': 
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      case 'word': 
        return <FileType className="h-5 w-5 text-blue-500" />
      case 'image': 
        return <Image className="h-5 w-5 text-purple-500" />
      default: 
        return <File className="h-5 w-5 text-gray-500" />
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

  const VIEW_MODES = [
    { id: 'list', icon: LayoutList, label: '리스트 보기' },
    { id: 'grid', icon: LayoutGrid, label: '그리드 보기' }
  ]

  return (
    <div className="space-y-3">
      {/* Tab Selection */}
      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === 'personal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('personal')}
          className="h-8 px-3 text-xs"
        >
          내문서함
        </Button>
        <Button
          variant={activeTab === 'shared' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('shared')}
          className="h-8 px-3 text-xs"
        >
          공유문서함
        </Button>
        <Button
          variant={activeTab === 'billing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('billing')}
          className="h-8 px-3 text-xs"
        >
          기성청구함
        </Button>
      </div>

      {/* Header and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {activeTab === 'personal' ? '내문서함' : activeTab === 'shared' ? '공유문서함' : '기성청구함'}
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              업로드
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="파일명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Site Filter */}
            {activeTab !== 'personal' && (
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-[120px] h-9 text-sm">
                  <SelectValue placeholder="현장 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 현장</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.name}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Sort Options */}
            <div className="hidden sm:flex items-center gap-1">
              <Button
                variant={sortBy === 'date' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-9 px-3 text-sm"
                onClick={() => setSortBy('date')}
              >
                날짜순
              </Button>
              <Button
                variant={sortBy === 'name' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-9 px-3 text-sm"
                onClick={() => setSortBy('name')}
              >
                이름순
              </Button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              {VIEW_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as 'list' | 'grid')}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    viewMode === mode.id
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                  title={mode.label}
                >
                  <mode.icon className="h-4 w-4" />
                </button>
              ))}
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

      {/* Document Content */}
      <div className="p-4">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              문서가 없습니다
            </p>
            <Button
              variant="link"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 dark:text-blue-400 text-sm"
            >
              첫 문서 업로드
            </Button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(doc.id)}
                  onChange={() => toggleDocumentSelection(doc.id)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                {/* File Icon */}
                <div className="mr-3">
                  {getFileIcon(doc.type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{doc.size}</span>
                    <span>{doc.uploadDate}</span>
                    {doc.site && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {doc.site}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                    {getFileIcon(doc.type)}
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