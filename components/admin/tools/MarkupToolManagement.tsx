'use client'

import { useState, useEffect } from 'react'
import { 
  Edit3, 
  FileImage, 
  Download, 
  Settings, 
  Archive,
  Trash2,
  RefreshCw,
  HardDrive,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Palette,
  MousePointer,
  Type,
  Square,
  PenTool
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBytes, formatDateTime } from '@/lib/utils'
import type { Profile } from '@/types'

interface MarkupToolManagementProps {
  profile: Profile
}

interface ToolStats {
  totalDocuments: number
  personalDocuments: number
  sharedDocuments: number
  totalMarkups: number
  totalSize: number
  averageMarkupsPerDoc: number
  lastCreated?: string
  mostActiveUser?: string
  storageUsagePercent: number
}

interface SystemHealth {
  canvasSupport: boolean
  storageAvailable: boolean
  apiStatus: 'healthy' | 'degraded' | 'error'
  lastCheck: string
}

interface ToolUsageStats {
  boxTool: number
  textTool: number
  drawingTool: number
  totalActions: number
  averageSessionTime: number
}

export default function MarkupToolManagement({ profile }: MarkupToolManagementProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ToolStats>({
    totalDocuments: 0,
    personalDocuments: 0,
    sharedDocuments: 0,
    totalMarkups: 0,
    totalSize: 0,
    averageMarkupsPerDoc: 0,
    storageUsagePercent: 0
  })
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    canvasSupport: true,
    storageAvailable: true,
    apiStatus: 'healthy',
    lastCheck: new Date().toISOString()
  })
  const [toolUsage, setToolUsage] = useState<ToolUsageStats>({
    boxTool: 0,
    textTool: 0,
    drawingTool: 0,
    totalActions: 0,
    averageSessionTime: 0
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [settings, setSettings] = useState({
    autoSaveInterval: 30, // seconds
    maxUndoLevels: 50,
    defaultLocation: 'personal', // 'personal' or 'shared'
    compressionQuality: 0.8,
    enabledTools: {
      box: true,
      text: true,
      drawing: true,
      select: true
    },
    maxFileSize: 20, // MB
    retentionDays: 180
  })

  useEffect(() => {
    loadData()
    checkSystemHealth()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load statistics from API
      const response = await fetch('/api/markup-documents?stats=true')
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalDocuments: data.total || 0,
          personalDocuments: data.personal || 0,
          sharedDocuments: data.shared || 0,
          totalMarkups: data.total_markups || 0,
          totalSize: data.total_size || 0,
          averageMarkupsPerDoc: data.total ? (data.total_markups / data.total) : 0,
          lastCreated: data.last_created,
          mostActiveUser: data.most_active_user,
          storageUsagePercent: (data.total_size / (1024 * 1024 * 1024 * 5)) * 100 // Assuming 5GB limit
        })
      }

      // Load tool usage statistics
      const usageResponse = await fetch('/api/markup-documents/usage-stats')
      if (usageResponse.ok) {
        const usageData = await usageResponse.json()
        setToolUsage({
          boxTool: usageData.box_tool_usage || 0,
          textTool: usageData.text_tool_usage || 0,
          drawingTool: usageData.drawing_tool_usage || 0,
          totalActions: usageData.total_actions || 0,
          averageSessionTime: usageData.average_session_time || 0
        })
      }

      // Load recent activity
      const activityResponse = await fetch('/api/markup-documents?limit=5&sort=created_at:desc')
      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.documents || [])
      }
    } catch (error) {
      console.error('Failed to load markup tool data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSystemHealth = () => {
    // Check Canvas API support
    const canvasSupport = !!document.createElement('canvas').getContext

    // Check storage availability
    const storageAvailable = 'storage' in navigator && 'estimate' in navigator.storage

    setSystemHealth({
      canvasSupport,
      storageAvailable,
      apiStatus: 'healthy',
      lastCheck: new Date().toISOString()
    })
  }

  const handleCleanup = async () => {
    if (!confirm('오래된 마킹 문서를 정리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch('/api/markup-documents/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          olderThanDays: settings.retentionDays 
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.deleted}개의 오래된 문서가 정리되었습니다.`)
        await loadData()
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
      alert('정리 작업 중 오류가 발생했습니다.')
    }
  }

  const handleOptimizeStorage = async () => {
    try {
      const response = await fetch('/api/markup-documents/optimize', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`저장소 최적화 완료: ${formatBytes(result.spaceSaved)} 절약`)
        await loadData()
      }
    } catch (error) {
      console.error('Optimization failed:', error)
      alert('최적화 중 오류가 발생했습니다.')
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Save settings to backend
    fetch('/api/markup-documents/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    })
  }

  const handleToolToggle = (tool: string, enabled: boolean) => {
    const newEnabledTools = {
      ...settings.enabledTools,
      [tool]: enabled
    }
    handleSettingChange('enabledTools', newEnabledTools)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Edit3 className="h-6 w-6 mr-2 text-purple-600" />
          도면마킹 도구 관리
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          도면 마킹 도구의 상태 모니터링 및 설정 관리
        </p>
      </div>

      {/* System Health Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-green-600" />
          시스템 상태
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Canvas API</span>
            <div className="flex items-center">
              {systemHealth.canvasSupport ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">정상</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600 dark:text-red-400">오류</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">저장소</span>
            <div className="flex items-center">
              {systemHealth.storageAvailable ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">사용 가능</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">제한됨</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">API 상태</span>
            <div className="flex items-center">
              {systemHealth.apiStatus === 'healthy' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 dark:text-green-400">정상</span>
                </>
              ) : systemHealth.apiStatus === 'degraded' ? (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">성능 저하</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600 dark:text-red-400">오류</span>
                </>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          마지막 확인: {formatDateTime(systemHealth.lastCheck)}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 문서</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalDocuments}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                개인: {stats.personalDocuments} / 공유: {stats.sharedDocuments}
              </p>
            </div>
            <FileImage className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 마킹</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalMarkups}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                평균: {stats.averageMarkupsPerDoc.toFixed(1)}개/문서
              </p>
            </div>
            <Palette className="h-8 w-8 text-orange-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">저장소 사용량</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatBytes(stats.totalSize)}
              </p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(stats.storageUsagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stats.storageUsagePercent.toFixed(1)}% 사용 중
                </p>
              </div>
            </div>
            <HardDrive className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">최근 활동</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {recentActivity.length}건
              </p>
              {stats.lastCreated && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  마지막: {formatDateTime(stats.lastCreated)}
                </p>
              )}
            </div>
            <Clock className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Tool Usage Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          도구 사용 통계
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Square className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">박스 도구</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {toolUsage.boxTool}회
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Type className="h-4 w-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">텍스트 도구</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {toolUsage.textTool}회
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <PenTool className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">펜 도구</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {toolUsage.drawingTool}회
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MousePointer className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">평균 세션</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {Math.round(toolUsage.averageSessionTime / 60)}분
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            총 {toolUsage.totalActions}개의 마킹 작업이 수행되었습니다.
          </p>
        </div>
      </div>

      {/* Tool Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-gray-600" />
          도구 설정
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                자동 저장 간격 (초)
              </label>
              <input
                type="number"
                value={settings.autoSaveInterval}
                onChange={(e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="10"
                max="300"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                작업 중 자동으로 저장되는 간격
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                최대 실행 취소 레벨
              </label>
              <input
                type="number"
                value={settings.maxUndoLevels}
                onChange={(e) => handleSettingChange('maxUndoLevels', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="10"
                max="100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                실행 취소 가능한 최대 작업 수
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                기본 저장 위치
              </label>
              <select
                value={settings.defaultLocation}
                onChange={(e) => handleSettingChange('defaultLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="personal">개인 문서함</option>
                <option value="shared">공유 문서함</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                새 문서의 기본 저장 위치
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                압축 품질
              </label>
              <input
                type="number"
                value={settings.compressionQuality}
                onChange={(e) => handleSettingChange('compressionQuality', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="0.1"
                max="1"
                step="0.1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                이미지 압축 품질 (0.1 ~ 1.0)
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              활성화된 도구
            </h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabledTools.box}
                  onChange={(e) => handleToolToggle('box', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">박스 도구</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabledTools.text}
                  onChange={(e) => handleToolToggle('text', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">텍스트 도구</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabledTools.drawing}
                  onChange={(e) => handleToolToggle('drawing', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">펜 도구</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabledTools.select}
                  onChange={(e) => handleToolToggle('select', e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">선택 도구</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
          최근 활동
        </h2>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <FileImage className="h-5 w-5 text-purple-500" />
                    <Palette className="h-3 w-3 text-orange-500 absolute -bottom-1 -right-1" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activity.title || activity.original_blueprint_filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.created_by_profile?.full_name} • {formatDateTime(activity.created_at)}
                      {activity.markup_count && ` • ${activity.markup_count}개 마킹`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            최근 활동이 없습니다
          </p>
        )}
      </div>

      {/* Tool Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Edit3 className="h-5 w-5 mr-2 text-purple-600" />
          도구 사용
        </h2>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            onClick={() => window.open('/dashboard/admin/markup-editor', '_blank')}
            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            마킹 도구 사용하기
          </Button>
          
          <Button
            onClick={() => window.open('/dashboard/admin/documents/markup', '_blank')}
            variant="outline"
            className="flex items-center"
          >
            <FileImage className="h-4 w-4 mr-2" />
            도면마킹문서함 보기
          </Button>
        </div>
        
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded mb-6">
          <p className="text-sm text-purple-800 dark:text-purple-300">
            <Edit3 className="h-4 w-4 inline mr-1" />
            관리자는 모든 사용자의 도면 마킹 문서를 보고 편집할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Maintenance Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Archive className="h-5 w-5 mr-2 text-orange-600" />
          유지보수 작업
        </h2>
        
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCleanup}
            variant="outline"
            className="flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            오래된 문서 정리
          </Button>
          
          <Button
            onClick={handleOptimizeStorage}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            저장소 최적화
          </Button>
          
          <Button
            onClick={() => loadData()}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            통계 새로고침
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            유지보수 작업은 시스템 성능에 영향을 줄 수 있습니다. 사용량이 적은 시간에 실행하세요.
          </p>
        </div>
      </div>
    </div>
  )
}