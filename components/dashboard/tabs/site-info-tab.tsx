'use client'

import { Profile } from '@/types'

interface SiteInfoTabProps {
  profile: Profile
}

export default function SiteInfoTab({ profile }: SiteInfoTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">현장정보</h2>
          <p className="text-gray-500">현장 정보 관리 기능이 곧 추가될 예정입니다.</p>
        </div>
      </div>
    </div>
  )
}