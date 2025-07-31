'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, Edit, Trash2 } from 'lucide-react'
import { getDailyReports } from '@/lib/supabase/daily-reports'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface DailyReportListProps {
  siteId?: string
  canCreate?: boolean
}

export default function DailyReportList({ siteId, canCreate = false }: DailyReportListProps) {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [siteId])

  const loadReports = async () => {
    try {
      setLoading(true)
      const data = await getDailyReports(siteId)
      setReports(data || [])
    } catch (err) {
      setError('작업일지를 불러오는데 실패했습니다.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '작성중', className: 'bg-gray-100 text-gray-800' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-800' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-800' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-800' }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          작업일지 목록
        </h3>
        {canCreate && (
          <Link
            href="/dashboard/daily-reports/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            새 작업일지
          </Link>
        )}
      </div>
      
      {reports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">작업일지가 없습니다.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {reports.map((report) => (
            <li key={report.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {formatDate(report.report_date)}
                      </p>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          현장: {report.site?.name}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          작성자: {report.created_by_profile?.full_name}
                        </p>
                      </div>
                    </div>
                    {report.work_content && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {report.work_content}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    <Link
                      href={`/dashboard/daily-reports/${report.id}`}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    {report.status === 'draft' && (
                      <>
                        <Link
                          href={`/dashboard/daily-reports/${report.id}/edit`}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('정말 삭제하시겠습니까?')) {
                              // TODO: Implement delete
                            }
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}