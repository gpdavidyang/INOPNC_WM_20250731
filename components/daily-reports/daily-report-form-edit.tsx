'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateDailyReport, submitDailyReport } from '@/app/actions/daily-reports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Send } from 'lucide-react'
import { DailyReport, Profile } from '@/types'
import { showErrorNotification } from '@/lib/error-handling'
import { toast } from 'sonner'

interface DailyReportFormEditProps {
  report: DailyReport & {
    site?: any
  }
  currentUser: Profile
}

export default function DailyReportFormEdit({ report, currentUser }: DailyReportFormEditProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state - Initialize with existing report data
  const [formData, setFormData] = useState({
    member_name: report.member_name || '',
    process_type: report.process_type || '',
    total_workers: report.total_workers || 0,
    npc1000_incoming: report.npc1000_incoming || 0,
    npc1000_used: report.npc1000_used || 0,
    npc1000_remaining: report.npc1000_remaining || 0,
    issues: report.issues || ''
  })

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

      {/* Form */}
      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="space-y-4">
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

        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
            문제 및 조치사항
          </label>
          <Textarea
            value={formData.issues}
            onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
            placeholder="발생한 문제나 특이사항을 입력하세요"
            rows={4}
            className="w-full"
          />
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