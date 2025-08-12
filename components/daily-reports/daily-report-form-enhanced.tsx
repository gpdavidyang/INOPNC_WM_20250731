'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createDailyReport } from '@/app/actions/daily-reports'
import { uploadPhotoToStorage } from '@/app/actions/simple-upload'
import { addBulkAttendance } from '@/app/actions/attendance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { 
  Calendar, 
  Cloud, 
  Thermometer, 
  Plus, 
  Trash2, 
  Save, 
  Send,
  Upload,
  Users,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  Camera,
  Receipt,
  Map,
  MessageSquare,
  AlertCircle,
  Check,
  X,
  Image as ImageIcon,
  MoreHorizontal,
  FolderOpen,
  CameraIcon
} from 'lucide-react'
import { Site, Profile, Material } from '@/types'
import { cn } from '@/lib/utils'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface DailyReportFormProps {
  sites: Site[]
  currentUser: Profile
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
}

interface WorkerEntry {
  worker_id: string
  labor_hours: number
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
}

interface MaterialEntry {
  incoming: string
  used: string
  remaining: string
}

// Compact collapsible section component
const CollapsibleSection = ({ 
  title, 
  icon: Icon, 
  children, 
  isExpanded, 
  onToggle,
  badge,
  required = false 
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  badge?: React.ReactNode
  required?: boolean
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {badge}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  )
}

export default function DailyReportFormEnhanced({ 
  sites, 
  currentUser, 
  materials = [], 
  workers = [] 
}: DailyReportFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  
  // Debug logging
  console.log('DailyReportFormEnhanced props:', { sites, sitesCount: sites?.length })
  
  // Section expansion states (sections 2-10 are collapsible)
  const [expandedSections, setExpandedSections] = useState({
    siteInfo: true,
    workContent: true,
    workers: false,
    photos: false,
    receipts: false,
    drawings: false,
    requests: false,
    materials: false,
    specialNotes: false
  })

  // Global toggle state
  const [allExpanded, setAllExpanded] = useState(false)

  // Form state - Header (Section 1) - Updated to match actual DB schema
  const [formData, setFormData] = useState({
    site_id: (currentUser as any).site_id || '',
    work_date: '2025-07-30',
    member_name: '', // Required field
    process_type: '', // Required field  
    total_workers: 0,
    npc1000_incoming: 0,
    npc1000_used: 0,
    npc1000_remaining: 0,
    issues: '',
    created_by: currentUser.full_name
  })

  // Section 3: Work Content
  const [workContents, setWorkContents] = useState<WorkContentEntry[]>([])
  
  // Section 3: Workers
  const [workerEntries, setWorkerEntries] = useState<WorkerEntry[]>([])
  
  // Section 4: Photos
  const [photos, setPhotos] = useState<PhotoEntry[]>([])
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentPhotoType, setCurrentPhotoType] = useState<'before' | 'after'>('before')
  
  // Section 5: Receipts
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([])
  
  // Section 6: Drawings
  const [drawings, setDrawings] = useState<File[]>([])
  
  // Section 8: Requests
  const [requestText, setRequestText] = useState<string>('')
  const [requestFiles, setRequestFiles] = useState<File[]>([])
  
  // Section 9: NPC-1000 Materials
  const [materialData, setMaterialData] = useState<MaterialEntry>({
    incoming: '',
    used: '',
    remaining: ''
  })
  
  // Section 10: Special Notes
  const [specialNotes, setSpecialNotes] = useState<string>('')

  // Auto-save to localStorage
  const saveToLocalStorage = useCallback(() => {
    const reportData = {
      formData,
      workContents,
      workerEntries,
      photos: photos.map(p => ({ ...p, file: null, preview: p.preview })), // Don't save file objects
      receipts: receipts.map(r => ({ ...r, file: null })),
      requestText,
      materialData,
      specialNotes,
      expandedSections,
      lastSaved: new Date().toISOString()
    }
    localStorage.setItem('dailyReportDraft', JSON.stringify(reportData))
  }, [formData, workContents, workerEntries, photos, receipts, requestText, materialData, specialNotes, expandedSections])

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('dailyReportDraft')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setFormData({
          site_id: parsed.formData?.site_id || (currentUser as any).site_id || '',
          work_date: parsed.formData?.work_date || '2025-07-30',
          member_name: parsed.formData?.member_name || '',
          process_type: parsed.formData?.process_type || '',
          total_workers: parsed.formData?.total_workers || 0,
          npc1000_incoming: parsed.formData?.npc1000_incoming || 0,
          npc1000_used: parsed.formData?.npc1000_used || 0,
          npc1000_remaining: parsed.formData?.npc1000_remaining || 0,
          issues: parsed.formData?.issues || '',
          created_by: parsed.formData?.created_by || currentUser.full_name
        })
        setWorkContents(parsed.workContents || [])
        setWorkerEntries(parsed.workerEntries || [])
        setRequestText(parsed.requestText || '')
        setMaterialData({
          incoming: parsed.materialData?.incoming || '',
          used: parsed.materialData?.used || '',
          remaining: parsed.materialData?.remaining || ''
        })
        setSpecialNotes(parsed.specialNotes || '')
        setExpandedSections(parsed.expandedSections || {
          siteInfo: true,
          workContent: true,
          workers: false,
          photos: false,
          receipts: false,
          drawings: false,
          requests: false,
          materials: false,
          specialNotes: false
        })
      } catch (e) {
        console.error('Failed to load saved draft', e)
      }
    }
  }, []) // Empty dependency array - only run on mount

  // Auto-save every 5 minutes
  useEffect(() => {
    const interval = setInterval(saveToLocalStorage, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [saveToLocalStorage])

  // Calculate progress
  useEffect(() => {
    let completed = 0
    const total = 12 // Updated total to include process_type

    // Check each section
    if (formData.site_id) completed += 1
    if (formData.member_name) completed += 1
    if (formData.process_type) completed += 1 // Added process_type check
    if (workContents.length > 0) completed += 1
    if (workerEntries.length > 0) completed += 1
    if (photos.length > 0) completed += 1
    if (receipts.length > 0) completed += 1
    if (drawings.length > 0) completed += 1
    if (requestText) completed += 1
    if (materialData.incoming || materialData.used || materialData.remaining) completed += 1
    if (specialNotes) completed += 1
    completed += 1 // Site info is always considered complete

    setProgress((completed / total) * 100)
  }, [formData, workContents, workerEntries, photos, receipts, drawings, requestText, materialData, specialNotes])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleAllSections = (expand: boolean) => {
    setExpandedSections({
      siteInfo: expand,
      workContent: expand,
      workers: expand,
      photos: expand,
      receipts: expand,
      drawings: expand,
      requests: expand,
      materials: expand,
      specialNotes: expand
    })
    setAllExpanded(expand)
  }

  const handleToggleAll = () => {
    const newExpandState = !allExpanded
    toggleAllSections(newExpandState)
  }

  // Work content handlers
  const addWorkContent = () => {
    setWorkContents([...workContents, {
      id: `wc-${Date.now()}`,
      memberName: '',
      processType: '',
      workSection: ''
    }])
  }

  const updateWorkContent = (id: string, field: keyof WorkContentEntry, value: string) => {
    setWorkContents(workContents.map(wc => 
      wc.id === id ? { ...wc, [field]: value } : wc
    ))
  }

  const removeWorkContent = (id: string) => {
    setWorkContents(workContents.filter(wc => wc.id !== id))
  }

  // Worker handlers
  const addWorker = () => {
    setWorkerEntries([...workerEntries, {
      worker_id: '',
      labor_hours: 1.0
    }])
  }

  const updateWorker = (index: number, field: keyof WorkerEntry, value: any) => {
    setWorkerEntries(workerEntries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ))
  }

  const removeWorker = (index: number) => {
    setWorkerEntries(workerEntries.filter((_, i) => i !== index))
  }

  // Photo handlers
  const addPhoto = (type: 'before' | 'after', file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotos(prevPhotos => [...prevPhotos, {
        id: `photo-${Date.now()}-${Math.random()}`,
        type,
        file,
        preview: reader.result as string
      }])
    }
    reader.readAsDataURL(file)
  }

  const addMultiplePhotos = (type: 'before' | 'after', files: File[]) => {
    if (files.length === 0) return
    
    const timestamp = Date.now()
    const newPhotos: PhotoEntry[] = []
    let loadedCount = 0
    
    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPhotos.push({
          id: `photo-${timestamp}-${index}-${Math.random()}`,
          type,
          file,
          preview: reader.result as string
        })
        
        loadedCount++
        if (loadedCount === files.length) {
          // 모든 파일이 로드된 후 한 번에 상태 업데이트
          setPhotos(prevPhotos => [...prevPhotos, ...newPhotos])
        }
      }
      reader.onerror = () => {
        console.error('파일 읽기 오류:', file.name)
        loadedCount++
        if (loadedCount === files.length) {
          setPhotos(prevPhotos => [...prevPhotos, ...newPhotos])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id))
  }

  // Photo selection modal handlers
  const openPhotoModal = (type: 'before' | 'after') => {
    setCurrentPhotoType(type)
    setShowPhotoModal(true)
  }

  const handlePhotoSelection = (source: 'camera' | 'gallery' | 'file') => {
    setShowPhotoModal(false)
    
    if (source === 'camera') {
      // Camera functionality
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      input.multiple = true
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const existingPhotos = photos.filter(p => p.type === currentPhotoType)
          const remaining = 30 - existingPhotos.length
          const filesToAdd = Array.from(files).slice(0, remaining)
          console.log(`선택된 파일 수: ${files.length}, 추가할 파일 수: ${filesToAdd.length}`)
          addMultiplePhotos(currentPhotoType, filesToAdd)
        }
      }
      input.click()
    } else if (source === 'gallery' || source === 'file') {
      // Gallery/File functionality
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = true
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const existingPhotos = photos.filter(p => p.type === currentPhotoType)
          const remaining = 30 - existingPhotos.length
          const filesToAdd = Array.from(files).slice(0, remaining)
          console.log(`선택된 파일 수: ${files.length}, 추가할 파일 수: ${filesToAdd.length}`)
          addMultiplePhotos(currentPhotoType, filesToAdd)
        }
      }
      input.click()
    }
  }

  // Receipt handlers
  const addReceipt = () => {
    setReceipts([...receipts, {
      id: `receipt-${Date.now()}`,
      category: '',
      amount: '',
      date: '2025-07-30',
      file: null
    }])
  }

  const updateReceipt = (id: string, field: keyof ReceiptEntry, value: any) => {
    setReceipts(receipts.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ))
  }

  const removeReceipt = (id: string) => {
    setReceipts(receipts.filter(r => r.id !== id))
  }

  const handleSubmit = async (submitForApproval: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      // Save to localStorage before submit
      saveToLocalStorage()

      // Validate required fields
      if (!formData.site_id) {
        throw new Error('현장을 선택해주세요')
      }
      if (!formData.member_name) {
        throw new Error('담당자명을 입력해주세요')
      }
      if (!formData.process_type) {
        throw new Error('공정 구분을 입력해주세요')
      }
      if (workContents.length === 0) {
        throw new Error('작업 내용을 입력해주세요')
      }

      // Create daily report with actual DB schema
      const reportResult = await createDailyReport({
        site_id: formData.site_id,
        work_date: formData.work_date,
        member_name: formData.member_name,
        process_type: formData.process_type,
        total_workers: formData.total_workers,
        npc1000_incoming: formData.npc1000_incoming,
        npc1000_used: formData.npc1000_used,
        npc1000_remaining: formData.npc1000_remaining,
        issues: formData.issues || specialNotes
      })

      if (!reportResult.success || !reportResult.data) {
        showErrorNotification(reportResult.error || '일일보고서 생성에 실패했습니다', 'handleSubmit')
        return
      }

      const dailyReportId = reportResult.data.id

      // TODO: Save work contents as work logs when work_logs table is created
      // for (const content of workContents) {
      //   await addWorkLog(dailyReportId, {
      //     work_type: content.processType === '기타' ? content.processTypeOther || content.processType : content.processType,
      //     location: content.workSection,
      //     description: `부재명: ${content.memberName === '기타' ? content.memberNameOther || content.memberName : content.memberName}`,
      //     worker_count: workerEntries.length
      //   })
      // }

      // Save attendance records
      if (workerEntries.length > 0) {
        const attendanceData = workerEntries
          .filter(w => w.worker_id)
          .map(w => ({
            worker_id: w.worker_id,
            check_in_time: '08:00',
            check_out_time: w.labor_hours === 1.0 ? '17:00' : '20:00', // Overtime if > 1.0
            work_type: workContents[0]?.processType || '일반작업'
          }))
        
        // TODO: Implement when attendance function is fixed
        // await addBulkAttendance(dailyReportId, attendanceData)
      }

      // Upload photos
      for (const photo of photos) {
        if (photo.file) {
          const formData = new FormData()
          formData.append('file', photo.file)
          formData.append('entity_type', 'daily_report')
          formData.append('entity_id', dailyReportId)
          formData.append('file_type', `photo_${photo.type}`)
          
          const uploadResult = await uploadPhotoToStorage(formData)
          console.log(`Photo upload result:`, uploadResult)
        }
      }

      // Upload receipts
      for (const receipt of receipts) {
        if (receipt.file) {
          const formData = new FormData()
          formData.append('file', receipt.file)
          formData.append('entity_type', 'daily_report')
          formData.append('entity_id', dailyReportId)
          formData.append('file_type', 'receipt')
          
          const uploadResult = await uploadPhotoToStorage(formData)
          console.log(`Receipt upload result:`, uploadResult)
        }
      }

      // Submit for approval if requested
      if (submitForApproval) {
        const { submitDailyReport } = await import('@/app/actions/daily-reports')
        await submitDailyReport(dailyReportId)
      }

      // Clear localStorage after successful submit
      localStorage.removeItem('dailyReportDraft')
      
      // Show success message
      toast.success('일일보고서가 성공적으로 작성되었습니다.')

      // Redirect
      router.push('/dashboard/daily-reports')
    } catch (err) {
      showErrorNotification(err, 'handleSubmit')
      setError(err instanceof Error ? err.message : '일일보고서 작성에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 lg:px-6">
      {/* Progress Bar and Toggle Button */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800 flex-1 mr-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">작성 진행률</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{Math.round(progress)}%</span>
            </div>
            <div className="bg-blue-100 dark:bg-blue-800 rounded-full h-2">
              <div 
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleAll}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
            title={allExpanded ? '모든 섹션 접기' : '모든 섹션 펼치기'}
          >
            {allExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="space-y-3">

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true); }} className="space-y-3">
          {/* Section 1: Basic Info (Always visible, compact) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              기본 정보
            </h2>
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">현장 <span className="text-red-400">*</span></label>
                <Select
                  value={formData.site_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                >
                  <SelectTrigger className="w-full h-9 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="현장 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                    {sites && sites.length > 0 ? (
                      sites.map(site => (
                        <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                        현장 정보가 없습니다
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작업일자 <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={formData.work_date || ''}
                    onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
                    className="w-full h-9 px-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작성자</label>
                  <input 
                    value={formData.created_by || ''} 
                    disabled 
                    className="w-full h-9 px-3 text-sm bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>


              
              {/* 현장 정보 (컴팩트) */}
              {formData.site_id && sites.find(s => s.id === formData.site_id) && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">현장 정보</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">현장명</span>
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{sites.find(s => s.id === formData.site_id)?.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">관리자</span>
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{(sites.find(s => s.id === formData.site_id) as any)?.manager_name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Work Content */}
          <CollapsibleSection
            title="작업 내용 입력"
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
                onClick={addWorkContent}
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
                      onClick={() => removeWorkContent(content.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">부재명 <span className="text-red-400">*</span></label>
                        <Select
                          value={content.memberName || ''}
                          onValueChange={(value) => updateWorkContent(content.id, 'memberName', value)}
                        >
                          <SelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                            <SelectItem value="슬라브">슬라브</SelectItem>
                            <SelectItem value="거더">거더</SelectItem>
                            <SelectItem value="기둥">기둥</SelectItem>
                            <SelectItem value="기타">기타</SelectItem>
                          </SelectContent>
                        </Select>
                        {content.memberName === '기타' && (
                          <input
                            className="w-full h-8 px-2 mt-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="기타 부재명"
                            value={content.memberNameOther || ''}
                            onChange={(e) => updateWorkContent(content.id, 'memberNameOther', e.target.value)}
                          />
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작업공정 <span className="text-red-400">*</span></label>
                        <Select
                          value={content.processType || ''}
                          onValueChange={(value) => updateWorkContent(content.id, 'processType', value)}
                        >
                          <SelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder="선택" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                            <SelectItem value="균열">균열</SelectItem>
                            <SelectItem value="면">면</SelectItem>
                            <SelectItem value="마감">마감</SelectItem>
                            <SelectItem value="기타">기타</SelectItem>
                          </SelectContent>
                        </Select>
                        {content.processType === '기타' && (
                          <input
                            className="w-full h-8 px-2 mt-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="기타 작업공정"
                            value={content.processTypeOther || ''}
                            onChange={(e) => updateWorkContent(content.id, 'processTypeOther', e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">작업 구간</label>
                      <input
                        value={content.workSection || ''}
                        onChange={(e) => updateWorkContent(content.id, 'workSection', e.target.value)}
                        placeholder="예: 3층 A구역"
                        className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {workContents.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-xs">
                  작업 내용을 추가하려면 &quot;작업 추가&quot; 버튼을 클릭하세요
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 3: Workers */}
          <CollapsibleSection
            title="작업자 입력"
            icon={Users}
            isExpanded={expandedSections.workers}
            onToggle={() => toggleSection('workers')}
            badge={workerEntries.length > 0 && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">{workerEntries.length}명</span>
            )}
          >
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={addWorker}
                className="w-full h-9 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                작업자 추가
              </button>

              {workerEntries.map((entry, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-medium text-gray-700">작업자 {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeWorker(index)}
                      className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">작업자</label>
                      <Select
                        value={entry.worker_id || ''}
                        onValueChange={(value) => updateWorker(index, 'worker_id', value)}
                      >
                        <SelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                          {workers.map(worker => (
                            <SelectItem key={worker.id} value={worker.id}>
                              {worker.full_name} ({worker.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">공수</label>
                      <Select
                        value={(entry.labor_hours || 0).toString()}
                        onValueChange={(value) => updateWorker(index, 'labor_hours', parseFloat(value))}
                      >
                        <SelectTrigger className="w-full h-8 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                          <SelectValue placeholder="0.0" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700">
                          <SelectItem value="0">0.0</SelectItem>
                          <SelectItem value="1">1.0</SelectItem>
                          <SelectItem value="1.5">1.5</SelectItem>
                          <SelectItem value="2">2.0</SelectItem>
                          <SelectItem value="2.5">2.5</SelectItem>
                          <SelectItem value="3">3.0</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}

              {workerEntries.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-xs">
                  작업자를 추가하려면 &quot;작업자 추가&quot; 버튼을 클릭하세요
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 5: Photo Upload */}
          <CollapsibleSection
            title="사진 업로드"
            icon={Camera}
            isExpanded={expandedSections.photos}
            onToggle={() => toggleSection('photos')}
            badge={photos.length > 0 && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">{photos.length}장</span>
            )}
          >
            <div className="pt-2 space-y-3">
              {/* Before Photos */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">작업전 사진 (최대 30장)</h4>
                <button
                  type="button"
                  onClick={() => openPhotoModal('before')}
                  className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-gray-500 mb-1" />
                  <p className="text-xs text-gray-500">클릭하여 사진 선택</p>
                </button>

                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {photos.filter(p => p.type === 'before').map(photo => (
                    <div key={photo.id} className="relative group">
                      <img 
                        src={photo.preview || ''} 
                        alt="작업전" 
                        className="w-full h-12 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* After Photos */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">작업후 사진 (최대 30장)</h4>
                <button
                  type="button"
                  onClick={() => openPhotoModal('after')}
                  className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-gray-500 mb-1" />
                  <p className="text-xs text-gray-500">클릭하여 사진 선택</p>
                </button>

                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {photos.filter(p => p.type === 'after').map(photo => (
                    <div key={photo.id} className="relative group">
                      <img 
                        src={photo.preview || ''} 
                        alt="작업후" 
                        className="w-full h-12 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 5: Receipts */}
          <CollapsibleSection
            title="영수증 첨부"
            icon={Receipt}
            isExpanded={expandedSections.receipts}
            onToggle={() => toggleSection('receipts')}
            badge={receipts.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">{receipts.length}개</span>
            )}
          >
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={addReceipt}
                className="w-full h-9 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                영수증 추가
              </button>

              {receipts.map((receipt: any) => (
                <div key={receipt.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-medium text-gray-700">영수증</h4>
                    <button
                      type="button"
                      onClick={() => removeReceipt(receipt.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">구분</label>
                        <input
                          value={receipt.category || ''}
                          onChange={(e) => updateReceipt(receipt.id, 'category', e.target.value)}
                          placeholder="예: 자재비"
                          className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">금액</label>
                        <input
                          type="number"
                          value={receipt.amount || ''}
                          onChange={(e) => updateReceipt(receipt.id, 'amount', e.target.value)}
                          placeholder="0"
                          className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">일자</label>
                      <input
                        type="date"
                        value={receipt.date || ''}
                        onChange={(e) => updateReceipt(receipt.id, 'date', e.target.value)}
                        className="w-full h-8 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">파일 첨부</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            updateReceipt(receipt.id, 'file', e.target.files[0])
                          }
                        }}
                        className="w-full text-xs text-gray-700 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                      {receipt.file && (
                        <p className="text-xs text-gray-600 mt-1">{receipt.file.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {receipts.length === 0 && (
                <p className="text-center text-gray-500 py-6 text-xs">
                  영수증을 추가하려면 &quot;영수증 추가&quot; 버튼을 클릭하세요
                </p>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 7: Drawing Upload */}
          <CollapsibleSection
            title="진행 도면 업로드"
            icon={Map}
            isExpanded={expandedSections.drawings}
            onToggle={() => toggleSection('drawings')}
            badge={drawings.length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">{drawings.length}개</span>
            )}
          >
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">
                도면 마킹 도구에서 생성된 마킹 도면을 첨부하세요
              </p>
              
              <label className="cursor-pointer">
                <div className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  <Map className="h-4 w-4 text-gray-500 mb-1" />
                  <p className="text-xs text-gray-500">클릭하여 도면 파일 선택</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.dwg,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    if (e.target.files) {
                      setDrawings([...drawings, ...Array.from(e.target.files)])
                    }
                  }}
                  className="hidden"
                />
              </label>

              {drawings.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {drawings.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setDrawings(drawings.filter((_, i) => i !== index))}
                        className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Section 8: Requests */}
          <CollapsibleSection
            title="본사에게 요청"
            icon={MessageSquare}
            isExpanded={expandedSections.requests}
            onToggle={() => toggleSection('requests')}
            badge={requestText && <Check className="h-4 w-4 text-green-400" />}
          >
            <div className="pt-2 space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">요청 내용</label>
                <textarea
                  value={requestText || ''}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="본사에게 요청하고 싶은 사항을 작성하세요"
                  rows={3}
                  className="w-full px-2 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">파일 첨부</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setRequestFiles([...requestFiles, ...Array.from(e.target.files)])
                    }
                  }}
                  className="w-full text-xs text-gray-700 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                {requestFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {requestFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setRequestFiles(requestFiles.filter((_, i) => i !== index))}
                          className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 9: NPC-1000 Materials */}
          <CollapsibleSection
            title="NPC-1000 자재관리"
            icon={Package}
            isExpanded={expandedSections.materials}
            onToggle={() => toggleSection('materials')}
            badge={(materialData.incoming || materialData.used || materialData.remaining) && (
              <Check className="h-4 w-4 text-green-400" />
            )}
          >
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">
                현장별 재고 관리를 위한 NPC-1000 자재 현황을 입력하세요
              </p>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">입고량</label>
                  <input
                    type="number"
                    value={materialData.incoming || ''}
                    onChange={(e) => setMaterialData({ ...materialData, incoming: e.target.value })}
                    placeholder="0"
                    className="w-full h-8 px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">사용량</label>
                  <input
                    type="number"
                    value={materialData.used || ''}
                    onChange={(e) => setMaterialData({ ...materialData, used: e.target.value })}
                    placeholder="0"
                    className="w-full h-8 px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">재고량</label>
                  <input
                    type="number"
                    value={materialData.remaining || ''}
                    onChange={(e) => setMaterialData({ ...materialData, remaining: e.target.value })}
                    placeholder="0"
                    className="w-full h-8 px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 10: Special Notes */}
          <CollapsibleSection
            title="특이사항"
            icon={AlertCircle}
            isExpanded={expandedSections.specialNotes}
            onToggle={() => toggleSection('specialNotes')}
            badge={specialNotes && <Check className="h-4 w-4 text-green-400" />}
          >
            <div className="pt-2">
              <textarea
                value={specialNotes || ''}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="특이사항을 자유롭게 입력하세요"
                rows={4}
                className="w-full px-2 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              />
            </div>
          </CollapsibleSection>
        </form>
        
        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              saveToLocalStorage()
              toast.success('임시저장되었습니다')
            }}
            disabled={loading}
            className="flex-1 h-11 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            임시저장
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading || !formData.site_id || !formData.member_name || !formData.process_type || workContents.length === 0}
            className="flex-1 h-11 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            제출
          </button>
        </div>
      </div>

      {/* Photo Selection Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowPhotoModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-md p-6 pb-8 safe-area-pb" onClick={(e) => e.stopPropagation()}>
            {/* Modal handle */}
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">사진 선택</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentPhotoType === 'before' ? '작업전' : '작업후'} 사진을 어떻게 추가하시겠어요?
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handlePhotoSelection('camera')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <Camera className="h-6 w-6" />
                <span className="font-medium text-base">카메라로 촬영</span>
              </button>
              
              <button
                onClick={() => handlePhotoSelection('gallery')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="font-medium text-base">사진 갤러리</span>
              </button>
              
              <button
                onClick={() => handlePhotoSelection('file')}
                className="w-full h-16 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center gap-3 text-gray-800 dark:text-gray-200 transition-colors touch-manipulation"
              >
                <FolderOpen className="h-6 w-6" />
                <span className="font-medium text-base">파일 업로드</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowPhotoModal(false)}
              className="w-full h-14 mt-6 text-gray-600 dark:text-gray-400 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors touch-manipulation"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}