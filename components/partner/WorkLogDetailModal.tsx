'use client'

import { useState } from 'react'
import { 
  X, FileText, Users, Wrench, Package, Clock, 
  CheckCircle, Calendar, Building2, User, 
  CloudRain, MapPin, Camera, ChevronRight
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

interface WorkLogDetailModalProps {
  isOpen: boolean
  onClose: () => void
  workLog: any
}

export default function WorkLogDetailModal({ isOpen, onClose, workLog }: WorkLogDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'workers' | 'equipment' | 'materials' | 'photos'>('content')

  if (!isOpen || !workLog) return null

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: '작성중', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
      submitted: { label: '제출됨', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      approved: { label: '승인됨', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.submitted
    
    return (
      <span className={`px-2 py-0.5 inline-flex text-xs font-medium rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  // Mock data for demonstration
  const mockWorkers = [
    { id: '1', name: '김작업', role: '목공', start_time: '08:00', end_time: '17:00', labor_hours: 1.0 },
    { id: '2', name: '이작업', role: '철근공', start_time: '08:00', end_time: '17:00', labor_hours: 1.0 },
    { id: '3', name: '박작업', role: '전기공', start_time: '08:00', end_time: '12:00', labor_hours: 0.5 },
    { id: '4', name: '최작업', role: '배관공', start_time: '13:00', end_time: '17:00', labor_hours: 0.5 },
    { id: '5', name: '정작업', role: '용접공', start_time: '08:00', end_time: '17:00', labor_hours: 1.0 }
  ]

  const mockEquipment = [
    { id: '1', name: '타워크레인', type: '양중장비', model: 'TC-5013', quantity: 1, hours: 8 },
    { id: '2', name: '백호', type: '굴착장비', model: 'EX200-5', quantity: 2, hours: 6 },
    { id: '3', name: '덤프트럭', type: '운반장비', model: '15톤', quantity: 3, hours: 4 }
  ]

  const mockMaterials = [
    { id: '1', name: '레미콘', specification: '25-24-150', unit: 'm³', used: 120, delivered: 150 },
    { id: '2', name: '철근', specification: 'HD10', unit: 'ton', used: 5.5, delivered: 8 },
    { id: '3', name: '거푸집', specification: '유로폼', unit: 'm²', used: 450, delivered: 0 },
    { id: '4', name: '시멘트', specification: '포틀랜드', unit: 'ton', used: 20, delivered: 30 }
  ]

  const mockPhotos = [
    { id: '1', url: '/placeholder1.jpg', caption: '기초 콘크리트 타설 전경', time: '09:30' },
    { id: '2', url: '/placeholder2.jpg', caption: '철근 배근 상세', time: '10:15' },
    { id: '3', url: '/placeholder3.jpg', caption: '거푸집 설치 완료', time: '11:00' },
    { id: '4', url: '/placeholder4.jpg', caption: '콘크리트 타설 진행중', time: '14:00' },
    { id: '5', url: '/placeholder5.jpg', caption: '마감 작업', time: '16:30' },
    { id: '6', url: '/placeholder6.jpg', caption: '작업 완료 전경', time: '17:00' }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal - Full screen on mobile, slide-in on desktop */}
      <div className="absolute inset-0 md:inset-y-0 md:right-0 md:left-auto md:max-w-lg lg:max-w-2xl">
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 shadow-xl">
          {/* Compact Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {workLog.date} 작업일지
                  </h2>
                  {getStatusBadge(workLog.status)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {workLog.siteName || workLog.site_name} • {workLog.author}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-2 p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Compact Info Strip */}
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <CloudRain className="h-3 w-3" />
                  {workLog.weather}
                </span>
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Users className="h-3 w-3" />
                  {workLog.totalWorkers || workLog.worker_count}명
                </span>
                {workLog.npc1000Used && (
                  <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Package className="h-3 w-3" />
                    {Math.round(workLog.npc1000Used)}kg
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Compact Tabs - Horizontal scroll on mobile */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                작업내용
              </button>
              <button
                onClick={() => setActiveTab('workers')}
                className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'workers'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                인원({mockWorkers.length})
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'equipment'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                장비({mockEquipment.length})
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'materials'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                자재({mockMaterials.length})
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === 'photos'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                사진({mockPhotos.length})
              </button>
            </div>
          </div>

          {/* Content - Compact padding */}
          <div className="flex-1 overflow-y-auto">
            {/* Work Content Tab */}
            {activeTab === 'content' && (
              <div className="p-4 space-y-3">
                {/* Main Work */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    주요 작업
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {workLog.mainWork || workLog.title}
                  </p>
                </div>

                {/* Work Details */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    상세 내용
                  </h3>
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-start">
                      <ChevronRight className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                      <span>오전: 자재 반입 및 작업 준비</span>
                    </div>
                    <div className="flex items-start">
                      <ChevronRight className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                      <span>작업장 안전 점검 및 TBM 실시</span>
                    </div>
                    <div className="flex items-start">
                      <ChevronRight className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                      <span>본 작업 진행 ({workLog.mainWork || workLog.title})</span>
                    </div>
                    <div className="flex items-start">
                      <ChevronRight className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                      <span>작업 완료 후 정리 및 청소</span>
                    </div>
                  </div>
                </div>

                {/* Issues if any */}
                {workLog.issues && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <h3 className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
                      특이사항
                    </h3>
                    <p className="text-xs text-orange-600 dark:text-orange-300">
                      {workLog.issues}
                    </p>
                  </div>
                )}

                {/* Status Timeline - Compact */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    진행 상태
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        작성 - {workLog.date} 08:00
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        제출 - {workLog.date} 17:30
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Workers Tab - Compact */}
            {activeTab === 'workers' && (
              <div className="p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {mockWorkers.map((worker) => (
                      <div key={worker.id} className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {worker.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {worker.role}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {worker.start_time}-{worker.end_time}
                            </p>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {worker.labor_hours}공수
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        총 공수
                      </span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {mockWorkers.reduce((sum, w) => sum + w.labor_hours, 0).toFixed(1)}공수
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Equipment Tab - Compact */}
            {activeTab === 'equipment' && (
              <div className="p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {mockEquipment.map((item) => (
                      <div key={item.id} className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.type} • {item.model}
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                              {item.quantity}대
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.hours}시간
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Materials Tab - Compact */}
            {activeTab === 'materials' && (
              <div className="p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {mockMaterials.map((item) => (
                      <div key={item.id} className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {item.specification}
                            </p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              사용: {item.used}{item.unit}
                            </p>
                            {item.delivered > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                입고: {item.delivered}{item.unit}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Photos Tab - Compact Grid */}
            {activeTab === 'photos' && (
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {mockPhotos.map((photo) => (
                    <div key={photo.id} className="relative">
                      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <Camera className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {photo.caption}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {photo.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compact Footer - Only close button */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={onClose}
              className="w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}