'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Package, Building2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { DailyReport, Site } from '@/types'
import Link from 'next/link'

interface CompactReportCardProps {
  report: DailyReport
  site?: Site
  canEdit: boolean
}

export function CompactReportCard({ report, site, canEdit }: CompactReportCardProps) {
  const getStatusBadge = (status?: string) => {
    const statusMap = {
      draft: { label: '임시', className: 'bg-gray-100 text-gray-700' },
      submitted: { label: '제출', className: 'bg-blue-100 text-blue-700' },
      approved: { label: '승인', className: 'bg-green-100 text-green-700' },
      rejected: { label: '반려', className: 'bg-red-100 text-red-700' },
    }
    
    const statusConfig = status ? statusMap[status as keyof typeof statusMap] : null
    if (!statusConfig) return null
    
    return (
      <Badge className={cn('text-xs px-1.5 py-0.5', statusConfig.className)}>
        {statusConfig.label}
      </Badge>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            {format(new Date(report.work_date), 'M.d')}
            <span className="text-xs text-gray-500 ml-0.5">
              ({format(new Date(report.work_date), 'EEE', { locale: ko })})
            </span>
          </span>
        </div>
        {getStatusBadge(report.status || 'draft')}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Site & Process */}
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{site?.name || '-'}</span>
          </div>
          <p className="text-xs font-medium text-gray-900 mt-0.5 truncate">
            {report.member_name} / {report.process_type}
          </p>
        </div>

        {/* Workers & Materials */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-gray-600 justify-end">
            <Users className="w-3 h-3" />
            <span>{report.total_workers}명</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600 justify-end mt-0.5">
            <Package className="w-3 h-3" />
            <span className="font-medium text-orange-600">-{report.npc1000_used}kg</span>
          </div>
        </div>
      </div>

      {/* Issues */}
      {report.issues && (
        <div className="flex items-start gap-1 mb-2">
          <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-gray-700 line-clamp-1">{report.issues}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5">
        <Link href={`/dashboard/daily-reports/${report.id}`} className="flex-1">
          <Button variant="outline" size="compact" className="w-full h-7 text-xs">
            보기
          </Button>
        </Link>
        {canEdit && (
          <Link href={`/dashboard/daily-reports/${report.id}/edit`} className="flex-1">
            <Button variant="outline" size="compact" className="w-full h-7 text-xs">
              수정
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}