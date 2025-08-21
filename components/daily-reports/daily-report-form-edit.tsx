'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateDailyReport, submitDailyReport } from '@/app/actions/daily-reports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { 
  ArrowLeft, 
  Save, 
  Send,
  Calendar, 
  Plus, 
  Trash2,
  Upload
} from 'lucide-react'
import { DailyReport, Profile, Site, Material } from '@/types'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface DailyReportFormEditProps {
  report: DailyReport & {
    site?: any
    work_logs?: WorkLogEntry[]
    weather_conditions?: any
  }
  currentUser: Profile
  sites?: Site[]
  materials?: Material[]
  workers?: Profile[]
}

interface WorkLogEntry {
  id: string
  work_type: string
  location: string
  description: string
  worker_count: number
  materials: Array<{
    material_id: string
    quantity: number
  }>
}


export default function DailyReportFormEdit({ 
  report, 
  currentUser, 
  sites = [], 
  materials = [], 
  workers = [] 
}: DailyReportFormEditProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
    notes: report.notes || ''
  })

  // Work logs state - Initialize with existing data
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>(
    report.work_logs || []
  )
  
  // File attachments
  const [attachments, setAttachments] = useState<File[]>([])

  // Work log handlers
  const handleAddWorkLog = () => {
    const newWorkLog: WorkLogEntry = {
      id: `temp-${Date.now()}`,
      work_type: '',
      location: '',
      description: '',
      worker_count: 0,
      materials: []
    }
    setWorkLogs([...workLogs, newWorkLog])
  }

  const handleUpdateWorkLog = (id: string, field: keyof WorkLogEntry, value: any) => {
    setWorkLogs(workLogs.map(log => 
      log.id === id ? { ...log, [field]: value } : log
    ))
  }

  const handleRemoveWorkLog = (id: string) => {
    setWorkLogs(workLogs.filter(log => log.id !== id))
  }

  const handleAddMaterial = (workLogId: string) => {
    setWorkLogs(workLogs.map(log => 
      log.id === workLogId 
        ? { ...log, materials: [...log.materials, { material_id: '', quantity: 0 }] }
        : log
    ))
  }

  const handleUpdateMaterial = (workLogId: string, index: number, field: string, value: any) => {
    setWorkLogs(workLogs.map(log => 
      log.id === workLogId 
        ? {
            ...log,
            materials: log.materials.map((mat, i) => 
              i === index ? { ...mat, [field]: value } : mat
            )
          }
        : log
    ))
  }

  const handleRemoveMaterial = (workLogId: string, index: number) => {
    setWorkLogs(workLogs.map(log => 
      log.id === workLogId 
        ? { ...log, materials: log.materials.filter((_, i) => i !== index) }
        : log
    ))
  }


  // File handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (submitForApproval: boolean = false) => {
    setLoading(true)
    setError(null)
    
    try {
      // Validate required fields (strict validation for submission)
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
      }

      // Update daily report
      const updateResult = await updateDailyReport(report.id, {
        ...formData,
        updated_at: new Date().toISOString()
      })

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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">작업일지 수정</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {report.site?.name} • {report.work_date}
            </p>
          </div>
          <Badge variant={report.status === 'draft' ? 'secondary' : 'default'}>
            임시저장
          </Badge>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="site">현장</Label>
            <Select
              value={formData.site_id}
              onValueChange={(value) => setFormData({ ...formData, site_id: value })}
              disabled={true} // Site should not be editable
            >
              <SelectTrigger>
                <SelectValue placeholder="현장 선택" />
              </SelectTrigger>
              <SelectContent>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                disabled={true} // Date should not be editable
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

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">NPC-1000 자재 관리</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                입고량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_incoming}
                onChange={(e) => setFormData({ ...formData, npc1000_incoming: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                사용량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_used}
                onChange={(e) => setFormData({ ...formData, npc1000_used: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                잔량 (L)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.npc1000_remaining}
                onChange={(e) => setFormData({ ...formData, npc1000_remaining: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Work Logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">작업 내역</h2>
          <Button onClick={handleAddWorkLog} variant="outline" size="compact">
            <Plus className="h-4 w-4 mr-1" />
            작업 추가
          </Button>
        </div>

        <div className="space-y-4">
          {workLogs.map((workLog, index) => (
            <div key={workLog.id} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium">작업 {index + 1}</h3>
                <Button
                  onClick={() => handleRemoveWorkLog(workLog.id)}
                  variant="ghost"
                  size="compact"
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <Label>작업 종류</Label>
                  <Input
                    value={workLog.work_type}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'work_type', e.target.value)}
                    placeholder="예: 철근 작업"
                  />
                </div>
                <div>
                  <Label>작업 위치</Label>
                  <Input
                    value={workLog.location}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'location', e.target.value)}
                    placeholder="예: 3층 A구역"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>작업 내용</Label>
                  <Textarea
                    value={workLog.description}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'description', e.target.value)}
                    placeholder="상세 작업 내용을 입력하세요"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>투입 인원</Label>
                  <Input
                    type="number"
                    value={workLog.worker_count}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'worker_count', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              {/* Materials */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">사용 자재</Label>
                  <Button
                    onClick={() => handleAddMaterial(workLog.id)}
                    variant="ghost"
                    size="compact"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    자재 추가
                  </Button>
                </div>
                
                {workLog.materials.map((material, matIndex) => (
                  <div key={matIndex} className="flex items-center gap-2 mb-2">
                    <Select
                      value={material.material_id}
                      onValueChange={(value) => handleUpdateMaterial(workLog.id, matIndex, 'material_id', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="자재 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(mat => (
                          <SelectItem key={mat.id} value={mat.id}>
                            {mat.name} ({mat.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => handleUpdateMaterial(workLog.id, matIndex, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="수량"
                      className="w-24"
                      step="0.01"
                    />
                    <Button
                      onClick={() => handleRemoveMaterial(workLog.id, matIndex)}
                      variant="ghost"
                      size="compact"
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {workLogs.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              작업 내역을 추가하려면 &quot;작업 추가&quot; 버튼을 클릭하세요
            </p>
          )}
        </div>
      </Card>


      {/* Notes & Attachments */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">비고 및 첨부파일</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">특이사항</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="특이사항이나 전달사항을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <Label>첨부파일</Label>
            <div className="mt-2">
              <label className="cursor-pointer">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      클릭하여 파일 선택 (사진, 문서 등)
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </label>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        onClick={() => handleRemoveFile(index)}
                        variant="ghost"
                        size="compact"
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
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