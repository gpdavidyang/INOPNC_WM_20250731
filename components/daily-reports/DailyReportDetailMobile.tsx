'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveDailyReport } from '@/app/actions/daily-reports'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Edit,
  ArrowLeft,
  Paperclip,
  Building2,
  UserCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  ImageIcon,
  Receipt,
  ClipboardList,
  MessageSquare,
  PlusCircle,
  Wrench,
  User,
  Camera
} from 'lucide-react'
import { DailyReport, Profile } from '@/types'
import type { DailyReportFormData, WorkerData, PhotoData, ReceiptData } from '@/types/daily-reports'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DailyReportDetailMobileProps {
  report: DailyReport & {
    site?: any
    created_by_profile?: any
    approved_by_profile?: any
  }
  currentUser: Profile
}

export default function DailyReportDetailMobile({ report, currentUser }: DailyReportDetailMobileProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [approvalComments, setApprovalComments] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    materials: false,
    notes: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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
        toast.success(approve ? '보고서가 승인되었습니다.' : '보고서가 반려되었습니다.')
        router.refresh()
        setShowRejectDialog(false)
      } else {
        showErrorNotification(result.error || '처리 중 오류가 발생했습니다', 'handleApproval')
      }
    } catch (error) {
      showErrorNotification(error, 'handleApproval')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: '임시저장', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return (
      <Badge className={cn('text-xs px-2 py-0.5', config.className)}>
        {config.label}
      </Badge>
    )
  }

  // 날짜 포맷
  const workDate = new Date((report as any).report_date || report.work_date)
  const formattedDate = format(workDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })

  // Form data 추출
  const formData = (report as any).formData || {} as DailyReportFormData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">작업일지 상세</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</p>
            </div>
          </div>
          {getStatusBadge(report.status || 'draft')}
        </div>
      </div>

      {/* 헤더 정보 섹션 */}
      <div className="p-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">작업일지 정보</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              #{report.id.substring(0, 8)}
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">작성일시</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(report.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">수정일시</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(report.updated_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
              </span>
            </div>
            {report.approved_at && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">승인일시</span>
                <span className="font-medium text-green-700 dark:text-green-300">
                  {format(new Date(report.approved_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* 기본 정보 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('basic')}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">기본 정보</span>
            {expandedSections.basic ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {expandedSections.basic && (
            <div className="px-3 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Building2 className="h-3 w-3" />
                  <span>현장</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.site?.name || '미지정'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <UserCheck className="h-3 w-3" />
                  <span>작성자</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.member_name || '미지정'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span>공정</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.process_type || '-'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 작업 내용 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">작업 내용</span>
            </div>
          </div>
          <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">부재명</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {report.member_name || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">공정</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {report.process_type || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">작업구간</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formData.work_section || '-'}
              </span>
            </div>
          </div>
        </div>



        {/* 작업자 입력 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">작업자 입력</span>
            </div>
          </div>
          <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
            {formData.workers && formData.workers.length > 0 ? (
              <div className="space-y-2">
                {formData.workers.map((worker: WorkerData, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{worker.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{worker.position || '작업자'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{worker.hours || 8}시간</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{(worker.hours || 8) / 8} 공수</p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      총 작업인원: {formData.workers.length}명
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      총 {formData.workers.reduce((sum, worker) => sum + (worker.hours || 8), 0)}시간
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">총 작업인원</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {report.total_workers || 0}명
                  </span>
                </div>
                {report.member_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">대표 작업자</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {report.member_name}
                    </span>
                  </div>
                )}
                {!report.total_workers && !report.member_name && (
                  <p className="text-sm text-gray-400 italic">작업자 정보가 없습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 사진 업로드 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">사진 업로드</span>
            </div>
          </div>
          <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2 space-y-4">
            {/* 작업전 사진 하위 섹션 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Camera className="h-3 w-3 text-blue-500" />
                작업전 사진
              </h4>
              {formData.before_photos && formData.before_photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {formData.before_photos.map((photo: PhotoData, index: number) => (
                    <div key={index} className="relative group cursor-pointer">
                      <img
                        src={photo.url || photo.path}
                        alt={`작업전 사진 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-gray-800 p-1 rounded-full">
                          <ImageIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                      {photo.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center truncate">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Camera className="h-6 w-6 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-400 italic">작업전 사진이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 작업후 사진 하위 섹션 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Camera className="h-3 w-3 text-green-500" />
                작업후 사진
              </h4>
              {formData.after_photos && formData.after_photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {formData.after_photos.map((photo: PhotoData, index: number) => (
                    <div key={index} className="relative group cursor-pointer">
                      <img
                        src={photo.url || photo.path}
                        alt={`작업후 사진 ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-gray-800 p-1 rounded-full">
                          <ImageIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                      {photo.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center truncate">
                          {photo.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Camera className="h-6 w-6 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-400 italic">작업후 사진이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 영수증 첨부 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">영수증 첨부</span>
            </div>
          </div>
          <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
            {formData.receipts && formData.receipts.length > 0 ? (
              <div className="space-y-2">
                {formData.receipts.map((receipt: ReceiptData, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">구분</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {receipt.description || '영수증'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">금액</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {receipt.amount ? `₩${receipt.amount.toLocaleString()}` : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">일자</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {receipt.date ? format(new Date(receipt.date), 'yyyy.MM.dd', { locale: ko }) : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">첨부파일</span>
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {receipt.filename || `영수증_${index + 1}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    {receipt.vendor && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-xs text-gray-600 dark:text-gray-400">업체명</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{receipt.vendor}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-gray-500">
                        {receipt.file_size && `파일크기: ${(receipt.file_size / 1024).toFixed(1)}KB`}
                      </span>
                      <button className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:underline flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        다운로드
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Receipt className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 italic">첨부된 영수증이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 진행 도면 업로드 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">진행 도면 업로드</span>
            </div>
          </div>
          <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
            {(report as any).drawing_urls && Array.isArray((report as any).drawing_urls) && (report as any).drawing_urls.length > 0 ? (
              <div className="space-y-2">
                {(report as any).drawing_urls.map((drawingUrl: string, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">진행 도면 {index + 1}</span>
                    </div>
                    <button className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:underline">
                      보기
                    </button>
                  </div>
                ))}
              </div>
            ) : (report as any).drawing_description ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {(report as any).drawing_description}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <ClipboardList className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 italic">업로드된 진행 도면이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 본사에게 요청 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-teal-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">본사에게 요청</span>
            </div>
          </div>
          <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
            {(report as any).hq_request ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {(report as any).hq_request}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <MessageSquare className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 italic">본사에게 요청한 사항이 없습니다.</p>
              </div>
            )}
          </div>
        </div>


        {/* 특이사항 섹션 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => toggleSection('notes')}
            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">특이사항</span>
            </div>
            {expandedSections.notes ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {expandedSections.notes && (
            <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
              {report.issues ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {report.issues}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 italic">특이사항이 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 승인 정보 */}
        {report.approved_by && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-900 dark:text-green-100">승인 완료</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">승인자</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.approved_by_profile?.full_name || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">승인일시</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {report.approved_at ? format(new Date(report.approved_at), 'MM/dd HH:mm', { locale: ko }) : '-'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 반려 정보 */}
        {report.status === 'rejected' && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-900 dark:text-red-100">반려됨</span>
            </div>
            {(report as any).notes && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {(report as any).notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/daily-reports/${report.id}/edit`)}
              className="flex-1 h-10 rounded-lg"
            >
              <Edit className="h-4 w-4 mr-1" />
              수정
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 h-10 rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <XCircle className="h-4 w-4 mr-1" />
                반려
              </Button>
              <Button
                size="sm"
                onClick={() => handleApproval(true)}
                disabled={loading}
                className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                승인
              </Button>
            </>
          )}
          {!canEdit && !canApprove && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 rounded-lg"
            >
              <Download className="h-4 w-4 mr-1" />
              다운로드
            </Button>
          )}
        </div>
      </div>

      {/* 반려 다이얼로그 */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowRejectDialog(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl animate-slide-up">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">작업일지 반려</h3>
                <button
                  onClick={() => setShowRejectDialog(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  반려 사유
                </label>
                <Textarea
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="반려 사유를 입력하세요"
                  rows={4}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                  disabled={loading}
                  className="flex-1 h-10 rounded-lg"
                >
                  취소
                </Button>
                <Button
                  onClick={() => handleApproval(false)}
                  disabled={loading || !approvalComments}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  반려하기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}