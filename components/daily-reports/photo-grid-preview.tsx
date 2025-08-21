'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Eye, 
  Grid3X3,
  Calendar,
  Building,
  User,
  Camera,
  ZoomIn,
  X
} from 'lucide-react'
import { PhotoGroup, ConstructionProcessType, ComponentType } from '@/types'

interface PhotoGridPreviewProps {
  photoGroups: PhotoGroup[]
  siteName?: string
  reportDate?: string
  reporterName?: string
  onGeneratePDF?: () => void
}

// 공정 타입별 한글 라벨
const PROCESS_LABELS: Record<ConstructionProcessType, string> = {
  formwork: '거푸집',
  rebar: '철근',
  concrete: '콘크리트',
  curing: '양생',
  finishing: '마감',
  inspection: '검사',
  other: '기타'
}

// 부재 타입별 한글 라벨  
const COMPONENT_LABELS: Record<ComponentType, string> = {
  column: '기둥',
  beam: '보',
  slab: '슬라브',
  wall: '벽체',
  foundation: '기초',
  stair: '계단',
  other: '기타'
}

export default function PhotoGridPreview({
  photoGroups,
  siteName = '강남 A현장',
  reportDate,
  reporterName = '작업자',
  onGeneratePDF
}: PhotoGridPreviewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string;
    title: string;
  } | null>(null)

  // 그룹을 부재명별로 정리
  const groupedByComponent = useMemo(() => {
    const grouped: Record<string, PhotoGroup[]> = {}
    
    photoGroups.forEach(group => {
      if (!grouped[group.component_name]) {
        grouped[group.component_name] = []
      }
      grouped[group.component_name].push(group)
    })
    
    // 각 부재명별로 공정 순서대로 정렬
    Object.keys(grouped).forEach(componentName => {
      grouped[componentName].sort((a, b) => {
        const processOrder: ConstructionProcessType[] = [
          'formwork', 'rebar', 'concrete', 'curing', 'finishing', 'inspection', 'other'
        ]
        return processOrder.indexOf(a.process_type) - processOrder.indexOf(b.process_type)
      })
    })
    
    return grouped
  }, [photoGroups])

  // 전체 통계 계산
  const stats = useMemo(() => {
    const totalGroups = photoGroups.length
    const completedGroups = photoGroups.filter(g => g.progress_status === 'completed').length
    const totalBeforePhotos = photoGroups.reduce((sum, g) => sum + g.before_photos.length, 0)
    const totalAfterPhotos = photoGroups.reduce((sum, g) => sum + g.after_photos.length, 0)
    
    return {
      totalGroups,
      completedGroups,
      totalBeforePhotos,
      totalAfterPhotos,
      completionRate: totalGroups > 0 ? Math.round((completedGroups / totalGroups) * 100) : 0
    }
  }, [photoGroups])

  // 사진 확대 보기
  const handlePhotoClick = (url: string, componentName: string, processType: string, stage: string) => {
    setSelectedPhoto({
      url,
      title: `${componentName} - ${PROCESS_LABELS[processType as ConstructionProcessType]} (${stage === 'before' ? '작업 전' : '작업 후'})`
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 정보 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-xl text-blue-900">
                사진 대지 양식 미리보기
              </CardTitle>
            </div>
            
            {onGeneratePDF && (
              <Button 
                onClick={onGeneratePDF}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF 생성
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Building className="h-4 w-4" />
              <span className="font-medium">공사명:</span>
              <span>{siteName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">일자:</span>
              <span>{reportDate || new Date().toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <User className="h-4 w-4" />
              <span className="font-medium">작성자:</span>
              <span>{reporterName}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 요약 통계 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalGroups}</div>
              <div className="text-sm text-gray-600">총 항목</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedGroups}</div>
              <div className="text-sm text-gray-600">완료 항목</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalBeforePhotos}</div>
              <div className="text-sm text-gray-600">작업전 사진</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalAfterPhotos}</div>
              <div className="text-sm text-gray-600">작업후 사진</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stats.completionRate}%</div>
              <div className="text-sm text-gray-600">완료율</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 부재별 사진 표 */}
      <div className="space-y-6">
        {Object.entries(groupedByComponent).map(([componentName, groups]) => {
          const componentType = groups[0]?.component_type
          const componentLabel = componentType ? COMPONENT_LABELS[componentType] : ''
          
          return (
            <Card key={componentName} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Grid3X3 className="h-5 w-5 text-gray-600" />
                    <CardTitle className="text-lg">
                      {componentName}
                    </CardTitle>
                    {componentLabel && (
                      <Badge variant="outline">
                        {componentLabel}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {groups.filter(g => g.progress_status === 'completed').length} / {groups.length} 완료
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r">
                          공정
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 border-r">
                          작업 전
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                          작업 후
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {groups.map((group, index) => (
                        <tr key={group.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-4 border-r">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {PROCESS_LABELS[group.process_type]}
                              </span>
                              <Badge 
                                className={
                                  group.progress_status === 'completed' 
                                    ? 'bg-green-100 text-green-800'
                                    : group.progress_status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-600'
                                }
                              >
                                {group.progress_status === 'completed' ? '완료' : 
                                 group.progress_status === 'in_progress' ? '진행중' : '미시작'}
                              </Badge>
                            </div>
                          </td>
                          
                          {/* 작업 전 사진 */}
                          <td className="px-4 py-4 border-r">
                            {group.before_photos.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2 max-w-xs">
                                {group.before_photos.slice(0, 4).map((photo, photoIndex) => (
                                  <div 
                                    key={photo.id} 
                                    className="relative group cursor-pointer"
                                    onClick={() => handlePhotoClick(
                                      photo.file_url, 
                                      componentName, 
                                      group.process_type, 
                                      'before'
                                    )}
                                  >
                                    <img
                                      src={photo.file_url}
                                      alt={`작업 전 ${photoIndex + 1}`}
                                      className="w-full h-16 object-cover rounded border border-gray-200 hover:border-blue-400 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                                      <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                                {group.before_photos.length > 4 && (
                                  <div className="flex items-center justify-center h-16 bg-gray-100 rounded border border-gray-200 text-xs text-gray-600">
                                    +{group.before_photos.length - 4}장
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-16 bg-gray-50 rounded border-2 border-dashed border-gray-200">
                                <div className="text-center">
                                  <Camera className="h-4 w-4 text-gray-300 mx-auto mb-1" />
                                  <span className="text-xs text-gray-400">사진 없음</span>
                                </div>
                              </div>
                            )}
                          </td>
                          
                          {/* 작업 후 사진 */}
                          <td className="px-4 py-4">
                            {group.after_photos.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2 max-w-xs">
                                {group.after_photos.slice(0, 4).map((photo, photoIndex) => (
                                  <div 
                                    key={photo.id} 
                                    className="relative group cursor-pointer"
                                    onClick={() => handlePhotoClick(
                                      photo.file_url, 
                                      componentName, 
                                      group.process_type, 
                                      'after'
                                    )}
                                  >
                                    <img
                                      src={photo.file_url}
                                      alt={`작업 후 ${photoIndex + 1}`}
                                      className="w-full h-16 object-cover rounded border border-gray-200 hover:border-green-400 transition-colors"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded flex items-center justify-center">
                                      <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </div>
                                ))}
                                {group.after_photos.length > 4 && (
                                  <div className="flex items-center justify-center h-16 bg-gray-100 rounded border border-gray-200 text-xs text-gray-600">
                                    +{group.after_photos.length - 4}장
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-16 bg-gray-50 rounded border-2 border-dashed border-gray-200">
                                <div className="text-center">
                                  <Camera className="h-4 w-4 text-gray-300 mx-auto mb-1" />
                                  <span className="text-xs text-gray-400">사진 없음</span>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 빈 상태 */}
      {Object.keys(groupedByComponent).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              사진 데이터가 없습니다
            </h3>
            <p className="text-gray-500">
              부재별 공정 사진을 추가하면 여기에 표 형태로 표시됩니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* 사진 확대 모달 */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="max-w-full max-h-full object-contain rounded shadow-2xl"
            />
            
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg text-center">
              <p className="text-sm font-medium">{selectedPhoto.title}</p>
              <p className="text-xs text-gray-300 mt-1">클릭하거나 ESC 키로 닫기</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}