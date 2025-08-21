'use client'

import { useState } from 'react'
import { 
  X, FileText, Users, Wrench, Package, Clock, 
  CheckCircle, Calendar, Building2, User, 
  CloudRain, MapPin, Camera, Download
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
      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${statusInfo.className}`}>
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
      
      {/* Modal */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-4xl">
          <div className="h-full flex flex-col bg-white dark:bg-gray-900 shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    작업일지 상세
                  </h2>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>{workLog.date}</span>
                    <span>•</span>
                    <span>{workLog.site_name}</span>
                    {getStatusBadge(workLog.status)}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Basic Info Cards */}
            <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-gray-200 dark:border-gray-700">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs">현장</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {workLog.site_name}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-xs">작성자</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {workLog.author}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <CloudRain className="h-4 w-4" />
                  <span className="text-xs">날씨</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {workLog.weather}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">작업인원</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {workLog.worker_count}명
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'content'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <FileText className="inline-block h-4 w-4 mr-2" />
                  작업내용
                </button>
                <button
                  onClick={() => setActiveTab('workers')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'workers'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="inline-block h-4 w-4 mr-2" />
                  작업인원
                </button>
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'equipment'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Wrench className="inline-block h-4 w-4 mr-2" />
                  장비
                </button>
                <button
                  onClick={() => setActiveTab('materials')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'materials'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Package className="inline-block h-4 w-4 mr-2" />
                  자재
                </button>
                <button
                  onClick={() => setActiveTab('photos')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'photos'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Camera className="inline-block h-4 w-4 mr-2" />
                  사진
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Work Content Tab */}
                {activeTab === 'content' && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        작업 내용
                      </h3>
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {workLog.title}
                        {'\n\n'}
                        오늘은 {workLog.site_name}에서 {workLog.title} 작업을 진행했습니다.
                        {'\n\n'}
                        주요 작업 내용:
                        {'\n'}• 오전: 자재 반입 및 작업 준비
                        {'\n'}• 작업장 안전 점검 및 TBM 실시
                        {'\n'}• 본 작업 진행 ({workLog.title})
                        {'\n'}• 작업 완료 후 정리 및 청소
                        {'\n'}• 익일 작업 준비
                        {'\n\n'}
                        특이사항: 날씨가 {workLog.weather === '맑음' ? '좋아' : workLog.weather === '흐림' ? '흐려' : '비가 와서'} 작업 진행에 {workLog.weather === '비' ? '다소 어려움이 있었습니다' : '문제가 없었습니다'}.
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        <Clock className="inline-block mr-2 h-5 w-5 text-gray-400" />
                        상태 이력
                      </h3>
                      <div className="flow-root">
                        <ul className="-mb-8">
                          <li>
                            <div className="relative pb-8">
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-white" />
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    작성됨
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {workLog.date} 08:00
                                  </p>
                                </div>
                              </div>
                            </div>
                          </li>
                          <li>
                            <div className="relative">
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    제출됨
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {workLog.date} 17:30
                                  </p>
                                </div>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Workers Tab */}
                {activeTab === 'workers' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        작업 인원 ({mockWorkers.length}명)
                      </h3>
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {mockWorkers.map((worker) => (
                        <li key={worker.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {worker.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {worker.role}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {worker.start_time} - {worker.end_time}
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {worker.labor_hours}공수
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          총 공수
                        </span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {mockWorkers.reduce((sum, w) => sum + w.labor_hours, 0).toFixed(1)}공수
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Equipment Tab */}
                {activeTab === 'equipment' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        장비 사용 내역
                      </h3>
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {mockEquipment.map((item) => (
                        <li key={item.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {item.type} • {item.model}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                수량: {item.quantity}대
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.hours}시간
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Materials Tab */}
                {activeTab === 'materials' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        자재 사용 내역
                      </h3>
                    </div>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {mockMaterials.map((item) => (
                        <li key={item.id} className="px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {item.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {item.specification}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                사용: {item.used} {item.unit}
                              </p>
                              {item.delivered > 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  입고: {item.delivered} {item.unit}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Photos Tab */}
                {activeTab === 'photos' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        작업 사진 ({mockPhotos.length}장)
                      </h3>
                      <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Download className="h-4 w-4 mr-2" />
                        전체 다운로드
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mockPhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-w-4 aspect-h-3 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <div className="w-full h-48 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <Camera className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {photo.caption}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {photo.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  닫기
                </button>
                <div className="flex gap-2">
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                    <Download className="inline-block h-4 w-4 mr-2" />
                    PDF 다운로드
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}