'use client'

import { Profile } from '@/types'

interface SharedDocumentsTabProps {
  profile: Profile
}

export default function SharedDocumentsTab({ profile }: SharedDocumentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">공유문서함</h2>
          <p className="text-gray-500">공유 문서 관리 기능이 곧 추가될 예정입니다.</p>
        </div>
      </div>
    </div>
  )
}