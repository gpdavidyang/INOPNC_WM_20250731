'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { updateDailyReport, submitDailyReport } from '@/app/actions/daily-reports'
import { uploadPhotoToStorage } from '@/app/actions/simple-upload'
import { addBulkAttendance } from '@/app/actions/attendance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger, CustomSelectValue } from '@/components/ui/custom-select'
import { 
  ArrowLeft, 
  Save, 
  Send,
  Calendar, 
  Plus, 
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Users,
  Package,
  Camera,
  Check,
  Receipt,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Eye,
  X,
  MoreHorizontal,
  FolderOpen
} from 'lucide-react'
import { DailyReport, Profile, Site, Material, PhotoGroup, ComponentType, ConstructionProcessType } from '@/types'
import { AdditionalPhotoData } from '@/types/daily-reports'
import PhotoGridPreview from './photo-grid-preview'
import PDFReportGenerator from './pdf-report-generator'
import AdditionalPhotoUploadSection from './additional-photo-upload-section'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface DailyReportFormEditEnhancedProps {
  report: DailyReport & {
    site?: any
    work_logs?: any[]
    weather_conditions?: any
    photo_groups?: PhotoGroup[]
    worker_entries?: any[]
    receipts?: any[]
    additional_photos?: any[]
  }
  currentUser: Profile
  sites?: Site[]
  materials?: Material[]
  workers?: Profile[]
}

interface WorkContentEntry {
  id: string
  memberName: string
  memberNameOther?: string
  processType: string
  processTypeOther?: string
  workSection: string
  // 통합된 사진 관리
  beforePhotos: File[]
  afterPhotos: File[]
  beforePhotoPreviews: string[]
  afterPhotoPreviews: string[]
}

interface WorkerEntry {
  id: string // Unique identifier for React key
  worker_id: string
  labor_hours: number
  worker_name?: string // For direct input
  is_direct_input?: boolean // To track if this is direct input
}

interface PhotoEntry {
  id: string
  type: 'before' | 'after'
  file: File | null
  preview: string | null
}

interface ReceiptEntry {
  id: string
  category: string
  amount: string
  date: string
  file: File | null
  preview?: string | null
}

interface MaterialEntry {
  incoming: string
  used: string
  remaining: string
}

// Collapsible section component for better organization
const CollapsibleSection = ({ 
  title, 
  isExpanded, 
  onToggle, 
  children, 
  badge,
  icon: Icon 
}: {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: number | string
  icon?: React.ComponentType<{ className?: string }>
}) => {
  return (
    <Card className="mb-4">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
          <h2 className="text-lg font-semibold">{title}</h2>
          {badge && (
            <Badge variant="secondary" className="ml-2">
              {badge}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </Card>
  )
}

export default function DailyReportFormEditEnhanced({ 
  report, 
  currentUser, 
  sites = [], 
  materials = [], 
  workers = [] 
}: DailyReportFormEditEnhancedProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    siteInfo: true,
    workContent: true,
    workers: false,
    photos: false,
    additionalPhotos: false,
    receipts: false,
    drawings: false,
    requests: false,
    materials: false,
    specialNotes: false
  })

  // Global toggle state
  const [allExpanded, setAllExpanded] = useState(false)

  // Form state - Initialize with existing report data
  const [formData, setFormData] = useState({
    site_id: report.site_id || '',
    work_date: report.work_date || '',
    member_name: report.member_name || '',
    process_type: report.process_type || '',
    total_workers: report.total_workers || 0,
    npc1000_incoming: report.npc1000_incoming || 0,
    npc1000_used: report.npc1000_used || 0,
    npc1000_remaining: report.npc1000_remaining || 0,
    issues: report.issues || '',
    notes: report.notes || '',
    created_by: currentUser.full_name
  })

  // Enhanced state management
  const [workContents, setWorkContents] = useState<WorkContentEntry[]>([])
  const [workerEntries, setWorkerEntries] = useState<WorkerEntry[]>([])
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([])
  const [additionalBeforePhotos, setAdditionalBeforePhotos] = useState<AdditionalPhotoData[]>([])
  const [additionalAfterPhotos, setAdditionalAfterPhotos] = useState<AdditionalPhotoData[]>([])
  const [requestText, setRequestText] = useState('')
  const [materialData, setMaterialData] = useState<MaterialEntry>({
    incoming: formData.npc1000_incoming.toString(),
    used: formData.npc1000_used.toString(),
    remaining: formData.npc1000_remaining.toString()
  })
  const [specialNotes, setSpecialNotes] = useState('')
  
  // File attachments
  const [attachments, setAttachments] = useState<File[]>([])

  // Initialize data from existing report
  useEffect(() => {
    // Initialize work contents from existing data
    if (report.work_logs && report.work_logs.length > 0) {
      const convertedWorkContents = report.work_logs.map((log: any, index: number) => ({
        id: log.id || `existing-${index}`,
        memberName: log.work_type || report.member_name || '',
        processType: log.location || report.process_type || '',
        workSection: log.description || '',
        beforePhotos: [],
        afterPhotos: [],
        beforePhotoPreviews: [],
        afterPhotoPreviews: []
      }))
      setWorkContents(convertedWorkContents)
    } else if (report.member_name || report.process_type) {
      // Create a default work content entry from basic report data
      const defaultWorkContent: WorkContentEntry = {
        id: 'default-1',
        memberName: report.member_name || '',
        processType: report.process_type || '',
        workSection: '',
        beforePhotos: [],
        afterPhotos: [],
        beforePhotoPreviews: [],
        afterPhotoPreviews: []
      }
      setWorkContents([defaultWorkContent])
    }

    // Initialize worker entries if available
    if (report.worker_entries && report.worker_entries.length > 0) {
      const convertedWorkerEntries = report.worker_entries.map((entry: any, index: number) => ({
        id: entry.id || `worker-${index}`,
        worker_id: entry.worker_id || '',
        labor_hours: entry.labor_hours || 1.0,
        worker_name: entry.worker_name || '',
        is_direct_input: entry.is_direct_input || true
      }))
      setWorkerEntries(convertedWorkerEntries)
    }

    // Initialize receipts if available
    if (report.receipts && report.receipts.length > 0) {
      const convertedReceipts = report.receipts.map((receipt: any, index: number) => ({
        id: receipt.id || `receipt-${index}`,
        category: receipt.category || '',
        amount: receipt.amount || '',
        date: receipt.date || new Date().toISOString().split('T')[0],
        file: null, // Files need to be re-uploaded in edit mode
        preview: receipt.preview || null
      }))
      setReceipts(convertedReceipts)
    }

    // Initialize additional photos if available
    if (report.additional_photos) {
      // Convert existing additional photos data
      const beforePhotos = report.additional_photos.filter((p: any) => p.type === 'before') || []
      const afterPhotos = report.additional_photos.filter((p: any) => p.type === 'after') || []
      setAdditionalBeforePhotos(beforePhotos)
      setAdditionalAfterPhotos(afterPhotos)
    }

    // Initialize other data fields
    if (report.notes) {
      setSpecialNotes(report.notes)
    }

    // Initialize material data
    setMaterialData({
      incoming: (report.npc1000_incoming || 0).toString(),
      used: (report.npc1000_used || 0).toString(),
      remaining: (report.npc1000_remaining || 0).toString()
    })
  }, [report])

  // Section toggle handlers
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const toggleAllSections = () => {
    const newState = !allExpanded
    setAllExpanded(newState)
    setExpandedSections({
      siteInfo: true, // Always keep site info expanded
      workContent: newState,
      workers: newState,
      photos: newState,
      additionalPhotos: newState,
      receipts: newState,
      drawings: newState,
      requests: newState,
      materials: newState,
      specialNotes: newState
    })
  }

  // Work content handlers
  const handleAddWorkContent = () => {
    const newWorkContent: WorkContentEntry = {
      id: `work-${Date.now()}`,
      memberName: '',
      processType: '',
      workSection: '',
      beforePhotos: [],
      afterPhotos: [],
      beforePhotoPreviews: [],
      afterPhotoPreviews: []
    }
    setWorkContents([...workContents, newWorkContent])
  }

  const handleUpdateWorkContent = (id: string, field: keyof WorkContentEntry, value: any) => {
    setWorkContents(workContents.map(content => 
      content.id === id ? { ...content, [field]: value } : content
    ))
  }

  const handleRemoveWorkContent = (id: string) => {
    setWorkContents(workContents.filter(content => content.id !== id))
  }

  // Photo upload handlers
  const handlePhotoUpload = useCallback(async (workContentId: string, type: 'before' | 'after', files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      const filesToAdd = Array.from(files)
      const workContent = workContents.find(w => w.id === workContentId)
      if (!workContent) return

      const previews: string[] = []
      for (const file of filesToAdd) {
        try {
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          previews.push(preview)
        } catch (error) {
          console.error('Error creating preview:', error)
          previews.push('')
        }
      }

      setWorkContents(workContents.map(content =>
        content.id === workContentId
          ? {
              ...content,
              [type === 'before' ? 'beforePhotos' : 'afterPhotos']: [
                ...(type === 'before' ? content.beforePhotos : content.afterPhotos),
                ...filesToAdd
              ],
              [type === 'before' ? 'beforePhotoPreviews' : 'afterPhotoPreviews']: [
                ...(type === 'before' ? content.beforePhotoPreviews : content.afterPhotoPreviews),
                ...previews
              ]
            }
          : content
      ))

      if (previews.length > 0) {
        toast.success(`${filesToAdd.length}개 사진이 추가되었습니다`)
      } else {
        toast.warning('사진이 추가되었지만 미리보기 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('사진 업로드 중 오류가 발생했습니다')
    }
  }, [workContents])

  // Photo deletion handlers
  const handlePhotoDelete = (workContentId: string, type: 'before' | 'after', index: number) => {
    setWorkContents(workContents.map(content =>
      content.id === workContentId
        ? {
            ...content,
            [type === 'before' ? 'beforePhotos' : 'afterPhotos']: 
              (type === 'before' ? content.beforePhotos : content.afterPhotos).filter((_, i) => i !== index),
            [type === 'before' ? 'beforePhotoPreviews' : 'afterPhotoPreviews']: 
              (type === 'before' ? content.beforePhotoPreviews : content.afterPhotoPreviews).filter((_, i) => i !== index)
          }
        : content
    ))
  }

  // Worker entry handlers
  const handleAddWorkerEntry = () => {
    const newWorkerEntry: WorkerEntry = {
      id: `worker-${Date.now()}`,
      worker_id: '',
      labor_hours: 1.0,
      is_direct_input: true
    }
    setWorkerEntries([...workerEntries, newWorkerEntry])
  }

  const handleUpdateWorkerEntry = (id: string, field: keyof WorkerEntry, value: any) => {
    setWorkerEntries(workerEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ))
  }

  const handleRemoveWorkerEntry = (id: string) => {
    setWorkerEntries(workerEntries.filter(entry => entry.id !== id))
  }

  // Receipt handlers
  const handleAddReceipt = () => {
    const newReceipt: ReceiptEntry = {
      id: `receipt-${Date.now()}`,
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      file: null
    }
    setReceipts([...receipts, newReceipt])
  }

  const handleUpdateReceipt = (id: string, field: keyof ReceiptEntry, value: any) => {
    setReceipts(receipts.map(receipt => 
      receipt.id === id ? { ...receipt, [field]: value } : receipt
    ))
  }

  const handleRemoveReceipt = (id: string) => {
    setReceipts(receipts.filter(receipt => receipt.id !== id))
  }

  const handleSubmit = async (submitForApproval: boolean = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // Enhanced validation
      if (submitForApproval) {
        if (!formData.member_name.trim()) {
          throw new Error('부재명을 입력해주세요')
        }
        if (!formData.process_type.trim()) {
          throw new Error('공정을 입력해주세요')
        }
        if (formData.total_workers <= 0) {
          throw new Error('작업자 수를 입력해주세요')
        }
        if (workContents.length === 0) {
          throw new Error('작업 내용을 입력해주세요')
        }
        
        // Validate each work content entry
        for (let i = 0; i < workContents.length; i++) {
          const content = workContents[i]
          if (!content.memberName || content.memberName.trim() === '') {
            throw new Error(`작업 ${i + 1}의 부재명을 선택해주세요`)
          }
          if (content.memberName === '기타' && (!content.memberNameOther || content.memberNameOther.trim() === '')) {
            throw new Error(`작업 ${i + 1}의 기타 부재명을 입력해주세요`)
          }
          if (!content.processType || content.processType.trim() === '') {
            throw new Error(`작업 ${i + 1}의 작업공정을 선택해주세요`)
          }
          if (content.processType === '기타' && (!content.processTypeOther || content.processTypeOther.trim() === '')) {
            throw new Error(`작업 ${i + 1}의 기타 작업공정을 입력해주세요`)
          }
        }
        
        // Validate worker entries
        for (let i = 0; i < workerEntries.length; i++) {
          const entry = workerEntries[i]
          if (!entry.worker_name || entry.worker_name.trim() === '') {
            throw new Error(`작업자 ${i + 1}의 이름을 입력해주세요`)
          }
          if (!entry.labor_hours || entry.labor_hours <= 0) {
            throw new Error(`작업자 ${i + 1}의 투입 공수를 선택해주세요`)
          }
        }
      }

      // Prepare comprehensive data for update
      const updateData = {
        ...formData,
        work_contents: workContents,
        worker_entries: workerEntries,
        receipts: receipts.map(r => ({ ...r, file: null })), // Don't save file objects
        request_text: requestText,
        material_data: materialData,
        special_notes: specialNotes,
        additional_before_photos: additionalBeforePhotos,
        additional_after_photos: additionalAfterPhotos,
        updated_at: new Date().toISOString()
      }

      // Update daily report
      const updateResult = await updateDailyReport(report.id, updateData)

      if (!updateResult.success) {
        showErrorNotification(updateResult.error || '일일보고서 수정에 실패했습니다', 'handleSubmit')
        return
      }

      // Submit for approval if requested
      if (submitForApproval) {
        const submitResult = await submitDailyReport(report.id)
        if (!submitResult.success) {
          showErrorNotification(submitResult.error || '일일보고서 제출에 실패했습니다', 'handleSubmit')
          return
        }
      }

      // Show success message based on action
      const successMessage = submitForApproval 
        ? '일일보고서가 성공적으로 제출되었습니다.'
        : '일일보고서가 성공적으로 수정되었습니다.'
      toast.success(successMessage)

      // Redirect back to detail page
      router.push(`/dashboard/daily-reports/${report.id}`)
    } catch (err) {
      showErrorNotification(err, 'handleSubmit')
      setError(err instanceof Error ? err.message : '일일보고서 수정에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold">작업일지 수정</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {report.site?.name} • {report.work_date}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={report.status === 'draft' ? 'secondary' : 'default'}>
            {report.status === 'draft' ? '임시저장' : '제출됨'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllSections}
            title={allExpanded ? '모든 섹션 접기' : '모든 섹션 펼치기'}
          >
            {allExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                모두 접기
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                모두 펼치기
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Section 1: 현장 정보 (Always expanded) */}
      <Card className="mb-4">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold">현장 정보</h2>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="site">현장</Label>
              <CustomSelect
                value={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                disabled={true} // Site should not be editable in edit mode
              >
                <CustomSelectTrigger>
                  <CustomSelectValue placeholder="현장 선택" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {sites.map(site => (
                    <CustomSelectItem key={site.id} value={site.id}>{site.name}</CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>
            
            <div>
              <Label htmlFor="date">작업일자</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="date"
                  type="date"
                  value={formData.work_date}
                  onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                  className="pl-10"
                  disabled={true} // Date should not be editable in edit mode
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                부재명 <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.member_name}
                onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                placeholder="슬라브, 거더, 기둥 등"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                공정 <span className="text-red-400">*</span>
              </label>
              <Input
                value={formData.process_type}
                onChange={(e) => setFormData({ ...formData, process_type: e.target.value })}
                placeholder="균열, 면, 마감 등"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                작업자 수 <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={formData.total_workers}
                onChange={(e) => setFormData({ ...formData, total_workers: parseInt(e.target.value) || 0 })}
                placeholder="작업자 수를 입력하세요"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2: 통합된 작업 내용 및 사진 관리 */}
      <CollapsibleSection
        title="작업 내용 및 사진 관리"
        icon={FileText}
        isExpanded={expandedSections.workContent}
        onToggle={() => toggleSection('workContent')}
        badge={workContents.length > 0 && (
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">{workContents.length}건</span>
        )}
        required
      >
        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleAddWorkContent}
            className="w-full h-9 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Plus className="h-4 w-4" />
            작업 추가
          </button>

          {workContents.map((content, index) => (
            <div key={content.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700">작업 {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => handleRemoveWorkContent(content.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">부재명 <span className="text-red-400">*</span></label>
                    <CustomSelect
                      value={content.memberName || ''}
                      onValueChange={(value) => handleUpdateWorkContent(content.id, 'memberName', value)}
                    >
                      <CustomSelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                        <CustomSelectValue placeholder="선택" />
                      </CustomSelectTrigger>
                      <CustomSelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                      <CustomSelectItem value="슬라브">슬라브</CustomSelectItem>
                      <CustomSelectItem value="거더">거더</CustomSelectItem>
                      <CustomSelectItem value="기둥">기둥</CustomSelectItem>
                      <CustomSelectItem value="기타">기타</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                    {content.memberName === '기타' && (
                      <input
                        className="w-full h-8 px-2 mt-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="기타 부재명"
                        value={content.memberNameOther || ''}
                        onChange={(e) => handleUpdateWorkContent(content.id, 'memberNameOther', e.target.value)}
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작업공정 <span className="text-red-400">*</span></label>
                  <CustomSelect
                    value={workContent.processType || ''}
                    onValueChange={(value) => handleUpdateWorkContent(workContent.id, 'processType', value)}
                  >
                    <CustomSelectTrigger>
                      <CustomSelectValue placeholder="작업공정 선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="균열">균열</CustomSelectItem>
                      <CustomSelectItem value="면">면</CustomSelectItem>
                      <CustomSelectItem value="마감">마감</CustomSelectItem>
                      <CustomSelectItem value="기타">기타</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                  {workContent.processType === '기타' && (
                    <Input
                      className="mt-2"
                      value={workContent.processTypeOther || ''}
                      onChange={(e) => handleUpdateWorkContent(workContent.id, 'processTypeOther', e.target.value)}
                      placeholder="기타 작업공정 입력"
                    />
                  )}
                </div>
                <div>
                  <Label>작업 구간</Label>
                  <Input
                    value={workContent.workSection}
                    onChange={(e) => handleUpdateWorkContent(workContent.id, 'workSection', e.target.value)}
                    placeholder="예: 3층 A구역"
                  />
                </div>
              </div>

              {/* 사진 업로드 영역 */}
              <div className="space-y-2">
                {/* 작업 전 사진 */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Camera className="h-3 w-3 text-gray-500" />
                    <label className="text-xs font-medium text-gray-700">
                      작업 전 사진
                    </label>
                    <span className="text-xs text-gray-500">({workContent.beforePhotoPreviews.length}/5)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {/* 기존 사진 미리보기 */}
                    {workContent.beforePhotoPreviews.map((preview, photoIndex) => (
                      <div key={photoIndex} className="relative group">
                        <img
                          src={preview}
                          alt={`작업 전 ${photoIndex + 1}`}
                          className="w-full h-12 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete(workContent.id, 'before', photoIndex)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* 사진 추가 버튼 */}
                    {workContent.beforePhotoPreviews.length < 5 && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            try {
                              handlePhotoUpload(workContent.id, 'before', e.target.files)
                            } catch (error) {
                              console.error('Photo upload error:', error)
                              toast.error('사진 업로드에 실패했습니다')
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          className="w-full h-12 border border-dashed border-gray-300 rounded flex items-center justify-center hover:border-gray-400 transition-colors"
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </button>
                      </label>
                    )}
                  </div>
                </div>

                {/* 작업 후 사진 */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Check className="h-3 w-3 text-green-500" />
                    <label className="text-xs font-medium text-gray-700">
                      작업 후 사진
                    </label>
                    <span className="text-xs text-gray-500">({workContent.afterPhotoPreviews.length}/5)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {/* 기존 사진 미리보기 */}
                    {workContent.afterPhotoPreviews.map((preview, photoIndex) => (
                      <div key={photoIndex} className="relative group">
                        <img
                          src={preview}
                          alt={`작업 후 ${photoIndex + 1}`}
                          className="w-full h-12 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete(workContent.id, 'after', photoIndex)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* 사진 추가 버튼 */}
                    {workContent.afterPhotoPreviews.length < 5 && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            try {
                              handlePhotoUpload(workContent.id, 'after', e.target.files)
                            } catch (error) {
                              console.error('Photo upload error:', error)
                              toast.error('사진 업로드에 실패했습니다')
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          className="w-full h-12 border border-dashed border-gray-300 rounded flex items-center justify-center hover:border-gray-400 transition-colors"
                        >
                          <Plus className="h-4 w-4 text-gray-400" />
                        </button>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {workContents.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              작업 내용을 추가하려면 &quot;작업 추가&quot; 버튼을 클릭하세요
            </p>
          )}

          <div className="flex justify-between items-center">
            <Button
              onClick={handleAddWorkContent}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              작업 추가
            </Button>

            {/* Photo Grid PDF Generator */}
            {workContents.some(w => w.beforePhotoPreviews.length > 0 || w.afterPhotoPreviews.length > 0) && (
              <PDFReportGenerator
                workContents={workContents}
                reportId={report.id}
                title="사진대지 PDF 생성"
              />
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 3: 작업자 입력 */}
      <CollapsibleSection
        title="작업자 입력"
        isExpanded={expandedSections.workers}
        onToggle={() => toggleSection('workers')}
        badge={workerEntries.length}
        icon={Users}
      >
        <div className="space-y-4">
          {workerEntries.map((entry) => (
            <div key={entry.id} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium">작업자 정보</h4>
                <Button
                  onClick={() => handleRemoveWorkerEntry(entry.id)}
                  variant="ghost"
                  size="compact"
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>작업자 이름</Label>
                  <Input
                    value={entry.worker_name || ''}
                    onChange={(e) => handleUpdateWorkerEntry(entry.id, 'worker_name', e.target.value)}
                    placeholder="작업자 이름 입력"
                  />
                </div>
                <div>
                  <Label>투입 공수</Label>
                  <CustomSelect
                    value={entry.labor_hours.toString()}
                    onValueChange={(value) => handleUpdateWorkerEntry(entry.id, 'labor_hours', parseFloat(value))}
                  >
                    <CustomSelectTrigger>
                      <CustomSelectValue />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="0.5">0.5 공수</CustomSelectItem>
                      <CustomSelectItem value="1.0">1.0 공수</CustomSelectItem>
                      <CustomSelectItem value="1.5">1.5 공수</CustomSelectItem>
                      <CustomSelectItem value="2.0">2.0 공수</CustomSelectItem>
                      <CustomSelectItem value="2.5">2.5 공수</CustomSelectItem>
                      <CustomSelectItem value="3.0">3.0 공수</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>
            </div>
          ))}

          {workerEntries.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              작업자를 추가하려면 &quot;작업자 추가&quot; 버튼을 클릭하세요
            </p>
          )}

          <Button
            onClick={handleAddWorkerEntry}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            작업자 추가
          </Button>
        </div>
      </CollapsibleSection>

      {/* Section 4: 추가 사진 업로드 */}
      <CollapsibleSection
        title="추가 사진 업로드"
        isExpanded={expandedSections.additionalPhotos}
        onToggle={() => toggleSection('additionalPhotos')}
        badge={additionalBeforePhotos.length + additionalAfterPhotos.length}
        icon={ImageIcon}
      >
        <AdditionalPhotoUploadSection
          beforePhotos={additionalBeforePhotos}
          afterPhotos={additionalAfterPhotos}
          onBeforePhotosChange={setAdditionalBeforePhotos}
          onAfterPhotosChange={setAdditionalAfterPhotos}
          maxPhotos={10}
        />
      </CollapsibleSection>

      {/* Section 5: 영수증 첨부 */}
      <CollapsibleSection
        title="영수증 첨부"
        isExpanded={expandedSections.receipts}
        onToggle={() => toggleSection('receipts')}
        badge={receipts.length}
        icon={Receipt}
      >
        <div className="space-y-3">
          <Button
            onClick={handleAddReceipt}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            영수증 추가
          </Button>

          {receipts.map((receipt) => (
            <div key={receipt.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">영수증</h4>
                <Button
                  onClick={() => handleRemoveReceipt(receipt.id)}
                  variant="ghost"
                  size="compact"
                  className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">구분</label>
                    <input
                      value={receipt.category || ''}
                      onChange={(e) => handleUpdateReceipt(receipt.id, 'category', e.target.value)}
                      placeholder="예: 자재비"
                      className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">금액</label>
                    <input
                      type="number"
                      value={receipt.amount || ''}
                      onChange={(e) => handleUpdateReceipt(receipt.id, 'amount', e.target.value)}
                      placeholder="0"
                      className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">일자</label>
                  <input
                    type="date"
                    value={receipt.date || ''}
                    onChange={(e) => handleUpdateReceipt(receipt.id, 'date', e.target.value)}
                    className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">파일 첨부</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0]
                        handleUpdateReceipt(receipt.id, 'file', file)
                        
                        // 미리보기 생성
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader()
                          reader.onload = (e) => {
                            handleUpdateReceipt(receipt.id, 'preview', e.target?.result as string)
                          }
                          reader.readAsDataURL(file)
                        } else {
                          handleUpdateReceipt(receipt.id, 'preview', null)
                        }
                      }
                    }}
                    className="w-full text-xs text-gray-700 dark:text-gray-300 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 dark:file:bg-gray-600 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-200 dark:hover:file:bg-gray-700"
                  />
                </div>
                {receipt.preview && (
                  <div className="mt-2">
                    <img
                      src={receipt.preview}
                      alt="영수증 미리보기"
                      className="h-20 w-20 object-cover rounded border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {receipts.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              영수증을 추가하려면 &quot;영수증 추가&quot; 버튼을 클릭하세요
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* Section 6: 진행 도면 업로드 */}
      <CollapsibleSection
        title="진행 도면 업로드"
        isExpanded={expandedSections.drawings}
        onToggle={() => toggleSection('drawings')}
        icon={FolderOpen}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            도면 마킹 도구에서 생성된 마킹 도면을 첨부하세요
          </p>
          
          <label className="cursor-pointer block">
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-indigo-400" />
                <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">클릭하여 도면 파일 선택</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, PDF 파일 지원</p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
            />
          </label>
        </div>
      </CollapsibleSection>

      {/* Section 7: 본사에게 요청 */}
      <CollapsibleSection
        title="본사에게 요청"
        isExpanded={expandedSections.requests}
        onToggle={() => toggleSection('requests')}
        icon={MessageSquare}
      >
        <div className="space-y-4">
          <Label htmlFor="request">요청 내용</Label>
          <Textarea
            id="request"
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="본사에 요청할 내용을 입력하세요 (예: 자재 요청, 기술 지원 등)"
            rows={4}
            className="w-full"
          />
        </div>
      </CollapsibleSection>

      {/* Section 8: NPC-1000 자재관리 */}
      <CollapsibleSection
        title="NPC-1000 자재관리"
        isExpanded={expandedSections.materials}
        onToggle={() => toggleSection('materials')}
        icon={Package}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="incoming">입고량 (L)</Label>
            <Input
              id="incoming"
              type="number"
              step="0.01"
              value={materialData.incoming}
              onChange={(e) => {
                const value = e.target.value
                setMaterialData({ ...materialData, incoming: value })
                setFormData({ ...formData, npc1000_incoming: parseFloat(value) || 0 })
              }}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="used">사용량 (L)</Label>
            <Input
              id="used"
              type="number"
              step="0.01"
              value={materialData.used}
              onChange={(e) => {
                const value = e.target.value
                setMaterialData({ ...materialData, used: value })
                setFormData({ ...formData, npc1000_used: parseFloat(value) || 0 })
              }}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="remaining">잔량 (L)</Label>
            <Input
              id="remaining"
              type="number"
              step="0.01"
              value={materialData.remaining}
              onChange={(e) => {
                const value = e.target.value
                setMaterialData({ ...materialData, remaining: value })
                setFormData({ ...formData, npc1000_remaining: parseFloat(value) || 0 })
              }}
              placeholder="0.00"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 9: 특이사항 */}
      <CollapsibleSection
        title="특이사항"
        isExpanded={expandedSections.specialNotes}
        onToggle={() => toggleSection('specialNotes')}
        icon={FileText}
      >
        <div className="space-y-4">
          <Label htmlFor="specialNotes">특이사항</Label>
          <Textarea
            id="specialNotes"
            value={specialNotes}
            onChange={(e) => {
              setSpecialNotes(e.target.value)
              setFormData({ ...formData, notes: e.target.value })
            }}
            placeholder="현장에서 발생한 특이사항이나 전달사항을 입력하세요"
            rows={4}
            className="w-full"
          />
        </div>
      </CollapsibleSection>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? '저장 중...' : '저장'}
        </Button>
        
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={loading || !formData.member_name.trim() || !formData.process_type.trim() || formData.total_workers <= 0}
          className="flex-1"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          제출
        </Button>
      </div>
    </div>
  )
}