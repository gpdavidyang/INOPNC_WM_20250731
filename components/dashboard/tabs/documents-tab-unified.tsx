'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { FolderOpen, Share2 } from 'lucide-react'
import DocumentsTab from './documents-tab'
import SharedDocumentsTab from './shared-documents-tab'

interface DocumentsTabUnifiedProps {
  profile: Profile
  initialTab?: 'personal' | 'shared'
}

export default function DocumentsTabUnified({ profile, initialTab = 'personal' }: DocumentsTabUnifiedProps) {
  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>(initialTab)

  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'personal'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span>내문서함</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'shared'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Share2 className="h-4 w-4" />
              <span>공유문서함</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'personal' ? (
          <DocumentsTab profile={profile} />
        ) : (
          <SharedDocumentsTab profile={profile} />
        )}
      </div>
    </div>
  )
}