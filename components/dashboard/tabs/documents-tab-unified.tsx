'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { FolderOpen, Share2, Edit3 } from 'lucide-react'
import DocumentsTab from './documents-tab'
import SharedDocumentsTab from './shared-documents-tab'
import { MarkupEditor } from '@/components/markup/markup-editor'

interface DocumentsTabUnifiedProps {
  profile: Profile
  initialTab?: 'personal' | 'shared' | 'markup'
  initialSearch?: string
}

export default function DocumentsTabUnified({ profile, initialTab = 'personal', initialSearch }: DocumentsTabUnifiedProps) {
  // If initialSearch is for blueprints, default to shared tab
  const defaultTab = initialSearch === '공도면' ? 'shared' : initialTab
  const [activeTab, setActiveTab] = useState<'personal' | 'shared' | 'markup'>(defaultTab)

  // Update active tab when initialTab prop changes
  useEffect(() => {
    const newTab = initialSearch === '공도면' ? 'shared' : initialTab
    setActiveTab(newTab)
  }, [initialTab, initialSearch])

  return (
    <div className="space-y-4">
      {/* Button Navigation - Consistent with Attendance/Site Info Pages */}
      <div className="flex flex-col gap-3">
        {/* First Row: 내문서함, 공유문서함 */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FolderOpen className="h-5 w-5" />
              <span>내문서함</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'shared'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Share2 className="h-5 w-5" />
              <span>공유문서함</span>
            </div>
          </button>
        </div>
        
        {/* Second Row: 도면마킹 */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('markup')}
            className={`w-full py-4 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'markup'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Edit3 className="h-5 w-5" />
              <span>도면마킹</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'personal' ? (
          <DocumentsTab profile={profile} />
        ) : activeTab === 'shared' ? (
          <SharedDocumentsTab profile={profile} initialSearch={initialSearch} />
        ) : (
          <MarkupEditor profile={profile} />
        )}
      </div>
    </div>
  )
}