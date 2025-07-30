'use client'

import { Profile } from '@/types'
import DailyReportList from '@/components/daily-reports/daily-report-list'

interface DailyReportTabProps {
  profile: Profile
}

export default function DailyReportTab({ profile }: DailyReportTabProps) {
  const canCreate = ['worker', 'site_manager'].includes(profile.role)
  
  return (
    <div className="space-y-6">
      <DailyReportList canCreate={canCreate} />
    </div>
  )
}