'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FolderOpen, FileText, Download, Upload, Eye,
  Search, Grid, List, MoreVertical, Share2, Trash2,
  Check, Building2, Calendar, User
} from 'lucide-react'

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
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isSelecting, setIsSelecting] = useState(false)

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

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const documents = getDocuments()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          문서함
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          개인 및 공유 문서를 관리합니다
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-1 border-b-2 font-medium text-xs transition-colors
              ${activeTab === 'personal'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            내문서함
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`py-2 px-1 border-b-2 font-medium text-xs transition-colors
              ${activeTab === 'shared'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            공유문서함
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2 px-1 border-b-2 font-medium text-xs transition-colors
              ${activeTab === 'billing'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            기성청구함
          </button>
        </nav>
      </div>

      {/* Search and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left controls */}
            <div className="flex items-center gap-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                {activeTab === 'personal' ? '내문서함' : activeTab === 'shared' ? '공유문서함' : '기성청구함'}
              </h3>
              
              <button
                onClick={() => setIsSelecting(!isSelecting)}
                className={`px-3 py-1.5 rounded-lg border transition-colors text-xs
                  ${isSelecting 
                    ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {isSelecting ? '선택 완료' : '선택'}
              </button>

              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                flex items-center gap-1 text-xs">
                <Upload className="h-4 w-4" />
                업로드
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
              {/* Site selector for shared/billing tabs */}
              {activeTab !== 'personal' && (
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-800 text-xs"
                >
                  <option value="all">전체 현장</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.name}>{site.name}</option>
                  ))}
                </select>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="파일명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                    bg-white dark:bg-gray-800 text-xs w-48"
                />
              </div>

              {/* Sort toggle */}
              <button
                onClick={() => setSortBy(sortBy === 'date' ? 'name' : 'date')}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                  hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
              >
                {sortBy === 'date' ? '날짜' : '이름'}
              </button>

              {/* Sort order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 border border-gray-300 dark:border-gray-600 rounded-lg
                  hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>

              {/* View mode toggle */}
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 ${viewMode === 'list' 
                    ? 'bg-gray-200 dark:bg-gray-700' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 ${viewMode === 'grid' 
                    ? 'bg-gray-200 dark:bg-gray-700' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List/Grid */}
      <Card>
        <CardContent className="p-4">
          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              문서가 없습니다
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border
                    border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isSelecting && (
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(doc.id)}
                        onChange={() => toggleFileSelection(doc.id)}
                        className="w-4 h-4"
                      />
                    )}
                    <span className="text-2xl">{getFileIcon(doc.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{doc.size}</span>
                        <span>{doc.uploadDate}</span>
                        {doc.uploader && <span>작성자: {doc.uploader}</span>}
                        {doc.site && <span>{doc.site}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Download className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Share2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg
                    hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  {isSelecting && (
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(doc.id)}
                      onChange={() => toggleFileSelection(doc.id)}
                      className="w-4 h-4 mb-2"
                    />
                  )}
                  <div className="text-4xl text-center mb-2">{getFileIcon(doc.type)}</div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{doc.size}</p>
                  <p className="text-xs text-gray-400">{doc.uploadDate}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}