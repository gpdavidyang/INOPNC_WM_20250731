'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  FileText, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { PhotoGroup } from '@/types'

interface PDFReportGeneratorProps {
  photoGroups: PhotoGroup[]
  siteName?: string
  reportDate?: string
  reporterName?: string
  onGenerationStart?: () => void
  onGenerationComplete?: (pdfUrl: string) => void
  onGenerationError?: (error: string) => void
}

export default function PDFReportGenerator({
  photoGroups,
  siteName = '강남 A현장',
  reportDate,
  reporterName = '작업자',
  onGenerationStart,
  onGenerationComplete,
  onGenerationError
}: PDFReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // PDF 생성 함수
  const generatePDF = async () => {
    if (photoGroups.length === 0) {
      setErrorMessage('사진 데이터가 없습니다. 먼저 사진을 업로드해주세요.')
      setGenerationStatus('error')
      onGenerationError?.('사진 데이터가 없습니다.')
      return
    }

    setIsGenerating(true)
    setGenerationStatus('idle')
    setErrorMessage('')
    onGenerationStart?.()

    try {
      // 이노피앤씨 양식 기반 HTML 템플릿 생성
      const htmlContent = generateHTMLTemplate()
      
      // PDF 변환 (실제 구현시에는 서버 API 호출)
      const pdfBlob = await convertHTMLToPDF(htmlContent)
      
      // 파일 다운로드
      const fileName = `사진대지양식_${siteName}_${reportDate || new Date().toLocaleDateString('ko-KR').replace(/\./g, '')}.pdf`
      downloadPDF(pdfBlob, fileName)
      
      setGenerationStatus('success')
      onGenerationComplete?.(URL.createObjectURL(pdfBlob))
    } catch (error) {
      console.error('PDF 생성 오류:', error)
      setErrorMessage('PDF 생성 중 오류가 발생했습니다.')
      setGenerationStatus('error')
      onGenerationError?.(error instanceof Error ? error.message : 'PDF 생성 실패')
    } finally {
      setIsGenerating(false)
    }
  }

  // HTML 템플릿 생성
  const generateHTMLTemplate = (): string => {
    const formatDate = reportDate || new Date().toLocaleDateString('ko-KR')
    
    // 부재별로 그룹화
    const groupedByComponent: Record<string, PhotoGroup[]> = {}
    photoGroups.forEach(group => {
      if (!groupedByComponent[group.component_name]) {
        groupedByComponent[group.component_name] = []
      }
      groupedByComponent[group.component_name].push(group)
    })

    // 공정 순서 (사용자 요구사항에 맞춤)
    const processOrder = ['crack', 'surface', 'finishing', 'other']
    const processLabels: Record<string, string> = {
      crack: '균열',
      surface: '면',
      finishing: '마감',
      other: '기타'
    }

    let html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>사진대지양식 - ${siteName}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: 'Malgun Gothic', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 15px 0;
          }
          
          .info-table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
          }
          
          .info-table td {
            padding: 8px 12px;
            border: 1px solid #ccc;
          }
          
          .info-table .label {
            background-color: #f5f5f5;
            font-weight: bold;
            width: 80px;
          }
          
          .component-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          
          .component-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
          }
          
          .photo-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          .photo-table th,
          .photo-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
          }
          
          .photo-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 14px;
          }
          
          .process-cell {
            font-weight: bold;
            background-color: #fafafa;
            width: 100px;
          }
          
          .photo-cell {
            width: 200px;
            height: 150px;
            position: relative;
          }
          
          .photo-cell img {
            max-width: 100%;
            max-height: 140px;
            object-fit: contain;
          }
          
          .no-photo {
            color: #999;
            font-style: italic;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 140px;
            background-color: #f9f9f9;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .summary {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          
          .summary h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 15px;
          }
          
          .summary-item {
            text-align: center;
          }
          
          .summary-number {
            font-size: 24px;
            font-weight: bold;
            color: #2196f3;
          }
          
          .summary-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>건설 공사 사진 대지</h1>
        </div>
        
        <table class="info-table">
          <tr>
            <td class="label">공사명</td>
            <td>${siteName}</td>
            <td class="label">일자</td>
            <td>${formatDate}</td>
          </tr>
          <tr>
            <td class="label">작성자</td>
            <td>${reporterName}</td>
            <td class="label">총 항목</td>
            <td>${photoGroups.length}개</td>
          </tr>
        </table>
    `

    // 각 부재별 섹션 생성
    Object.entries(groupedByComponent).forEach(([componentName, groups], componentIndex) => {
      if (componentIndex > 0) {
        html += '<div class="page-break"></div>'
      }
      
      html += `
        <div class="component-section">
          <div class="component-title">${componentName}</div>
          <table class="photo-table">
            <thead>
              <tr>
                <th>공정</th>
                <th>작업 전</th>
                <th>작업 후</th>
              </tr>
            </thead>
            <tbody>
      `
      
      // 공정 순서대로 정렬
      const sortedGroups = groups.sort((a, b) => 
        processOrder.indexOf(a.process_type) - processOrder.indexOf(b.process_type)
      )
      
      sortedGroups.forEach(group => {
        html += `
          <tr>
            <td class="process-cell">${processLabels[group.process_type] || group.process_type}</td>
            <td class="photo-cell">
        `
        
        // 작업 전 사진
        if (group.before_photos.length > 0) {
          const photo = group.before_photos[0] // 첫 번째 사진만 표시
          html += `<img src="${photo.file_url}" alt="작업 전 사진" />`
        } else {
          html += '<div class="no-photo">사진 없음</div>'
        }
        
        html += `
            </td>
            <td class="photo-cell">
        `
        
        // 작업 후 사진
        if (group.after_photos.length > 0) {
          const photo = group.after_photos[0] // 첫 번째 사진만 표시
          html += `<img src="${photo.file_url}" alt="작업 후 사진" />`
        } else {
          html += '<div class="no-photo">사진 없음</div>'
        }
        
        html += `
            </td>
          </tr>
        `
      })
      
      html += `
            </tbody>
          </table>
        </div>
      `
    })

    // 요약 정보
    const totalGroups = photoGroups.length
    const completedGroups = photoGroups.filter(g => g.progress_status === 'completed').length
    const totalBeforePhotos = photoGroups.reduce((sum, g) => sum + g.before_photos.length, 0)
    const totalAfterPhotos = photoGroups.reduce((sum, g) => sum + g.after_photos.length, 0)

    html += `
        <div class="summary">
          <h3>작업 요약</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-number">${totalGroups}</div>
              <div class="summary-label">총 항목</div>
            </div>
            <div class="summary-item">
              <div class="summary-number">${completedGroups}</div>
              <div class="summary-label">완료 항목</div>
            </div>
            <div class="summary-item">
              <div class="summary-number">${totalBeforePhotos}</div>
              <div class="summary-label">작업전 사진</div>
            </div>
            <div class="summary-item">
              <div class="summary-number">${totalAfterPhotos}</div>
              <div class="summary-label">작업후 사진</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return html
  }

  // HTML을 PDF로 변환 (임시 구현)
  const convertHTMLToPDF = async (htmlContent: string): Promise<Blob> => {
    // 실제 구현시에는 서버 API 호출
    // 예: puppeteer, jsPDF, html2pdf 등 사용
    
    // 임시로 HTML 파일 생성하여 브라우저에서 인쇄
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // 잠시 후 인쇄 다이얼로그 열기
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 1000)
    }
    
    // 임시 Blob 반환 (실제로는 서버에서 PDF 생성)
    return new Blob([htmlContent], { type: 'text/html' })
  }

  // PDF 다운로드
  const downloadPDF = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={generatePDF}
        disabled={isGenerating || photoGroups.length === 0}
        className="w-full sm:w-auto"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            PDF 생성 중...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            PDF 보고서 생성
          </>
        )}
      </Button>

      {/* 상태 메시지 */}
      {generationStatus === 'success' && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>PDF 보고서가 성공적으로 생성되었습니다.</span>
        </div>
      )}

      {generationStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage || 'PDF 생성 중 오류가 발생했습니다.'}</span>
        </div>
      )}

      {photoGroups.length === 0 && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>PDF 생성을 위해서는 먼저 사진을 업로드해주세요.</span>
        </div>
      )}

      {/* 미리보기 정보 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 이노피앤씨 표준 양식으로 PDF가 생성됩니다</p>
        <p>• 부재명별로 공정 순서에 따라 정리됩니다</p>
        <p>• 작업 전/후 사진이 대비되어 표시됩니다</p>
      </div>
    </div>
  )
}