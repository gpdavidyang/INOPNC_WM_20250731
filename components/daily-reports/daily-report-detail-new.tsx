'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveDailyReport } from '@/app/actions/daily-reports'
// import { getFileAttachments } from '@/app/actions/documents' // TODO: Implement when table exists
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar,
  Cloud,
  Thermometer,
  FileText,
  Users,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Edit,
  ArrowLeft,
  Paperclip
} from 'lucide-react'
import { DailyReport, Profile } from '@/types'

interface DailyReportDetailProps {
  report: DailyReport & {
    site?: any
    work_logs?: any[]
    attendance_records?: any[]
    created_by_profile?: any
    approved_by_profile?: any
  }
  currentUser: Profile
}

export default function DailyReportDetail({ report, currentUser }: DailyReportDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalComments, setApprovalComments] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])

  // Load attachments
  // TODO: Implement when file attachments are available
  // useState(() => {
  //   getFileAttachments('daily_report', report.id).then(result => {
  //     if (result.success && result.data) {
  //       setAttachments(result.data)
  //     }
  //   })
  // })

  const canApprove = 
    ['site_manager', 'admin', 'system_admin'].includes(currentUser.role) &&
    report.status === 'submitted'

  const canEdit = 
    report.created_by === currentUser.id &&
    report.status === 'draft'

  const handleApproval = async (approve: boolean) => {
    setLoading(true)
    try {
      const result = await approveDailyReport(report.id, approve, approvalComments)
      if (result.success) {
        router.refresh()
        setShowApprovalDialog(false)
      } else {
        alert(result.error || '처리 중 오류가 발생했습니다')
      }
    } catch (error) {
      alert('처리 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      draft: { label: '작성중', variant: 'secondary', icon: Clock },
      submitted: { label: '제출됨', variant: 'primary', icon: FileText },
      approved: { label: '승인됨', variant: 'success', icon: CheckCircle },
      rejected: { label: '반려됨', variant: 'danger', icon: XCircle }
    }

    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const totalWorkerCount = report.work_logs?.reduce((sum, log) => sum + (log.worker_count || 0), 0) || 0
  const totalMaterialUsage = report.work_logs?.reduce((sum, log) => 
    sum + (log.work_log_materials?.length || 0), 0
  ) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로
          </Button>
          <h1 className="text-2xl font-bold">작업일지 상세</h1>
          {getStatusBadge(report.status || 'draft')}
        </div>
        
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/daily-reports/${report.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  setShowApprovalDialog(true)
                  setApprovalComments('')
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                반려
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApproval(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                승인
              </Button>
            </>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            다운로드
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">현장</p>
            <p className="font-medium">{report.site?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">작업일자</p>
            <p className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date((report as any).report_date || report.work_date).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">날씨</p>
            <p className="font-medium flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              {(report as any).weather || (report as any).weather_morning || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">기온</p>
            <p className="font-medium flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              {(report as any).temperature_high && (report as any).temperature_low
                ? `${(report as any).temperature_high}°C ~ ${(report as any).temperature_low}°C`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">작성자</p>
            <p className="font-medium">{report.created_by_profile?.full_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">작성일시</p>
            <p className="font-medium">
              {new Date(report.created_at).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>

        {report.approved_by && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">승인자</p>
                <p className="font-medium">{report.approved_by_profile?.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">승인일시</p>
                <p className="font-medium">
                  {report.approved_at ? new Date(report.approved_at).toLocaleString('ko-KR') : '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 작업 건수</p>
              <p className="text-2xl font-bold">{report.work_logs?.length || 0}건</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 투입 인원</p>
              <p className="text-2xl font-bold">{totalWorkerCount}명</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">사용 자재</p>
              <p className="text-2xl font-bold">{totalMaterialUsage}종</p>
            </div>
            <Package className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Work Logs */}
      {report.work_logs && report.work_logs.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">작업 내역</h2>
          <div className="space-y-4">
            {report.work_logs.map((workLog, index) => (
              <div key={workLog.id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="mb-3">
                  <h3 className="font-medium">작업 {index + 1}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">작업 종류</p>
                    <p className="font-medium">{workLog.work_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">작업 위치</p>
                    <p className="font-medium">{workLog.location}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">작업 내용</p>
                    <p className="font-medium">{workLog.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">투입 인원</p>
                    <p className="font-medium">{workLog.worker_count}명</p>
                  </div>
                </div>

                {workLog.work_log_materials && workLog.work_log_materials.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-500 mb-2">사용 자재</p>
                    <div className="space-y-1">
                      {workLog.work_log_materials.map((material: any) => (
                        <div key={material.id} className="flex items-center justify-between text-sm">
                          <span>{material.material?.name}</span>
                          <span className="font-medium">
                            {material.quantity} {material.material?.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attendance */}
      {report.attendance_records && report.attendance_records.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">출근 현황</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">작업자</th>
                  <th className="text-left py-2">출근시간</th>
                  <th className="text-left py-2">퇴근시간</th>
                  <th className="text-left py-2">근무시간</th>
                  <th className="text-left py-2">작업내용</th>
                </tr>
              </thead>
              <tbody>
                {report.attendance_records.map((record: any) => (
                  <tr key={record.id} className="border-b">
                    <td className="py-2">{record.worker?.full_name}</td>
                    <td className="py-2">{record.check_in_time || '-'}</td>
                    <td className="py-2">{record.check_out_time || '-'}</td>
                    <td className="py-2">
                      {record.work_hours ? `${record.work_hours.toFixed(1)}시간` : '-'}
                    </td>
                    <td className="py-2">{record.work_type || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Notes & Attachments */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">비고 및 첨부파일</h2>
        
        {(report as any).notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">특이사항</p>
            <p className="whitespace-pre-wrap">{(report as any).notes}</p>
          </div>
        )}

        {attachments.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">첨부파일</p>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div 
                  key={attachment.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{attachment.file_name}</span>
                    <span className="text-xs text-gray-500">
                      ({Math.round(attachment.file_size / 1024)}KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.file_path, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">작업일지 반려</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">반려 사유</label>
              <Textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder="반려 사유를 입력하세요"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                variant="danger"
                onClick={() => handleApproval(false)}
                disabled={loading || !approvalComments}
              >
                반려하기
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}