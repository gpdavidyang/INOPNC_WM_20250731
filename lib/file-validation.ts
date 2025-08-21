// 파일 업로드 검증 유틸리티 함수들

export interface FileValidationOptions {
  maxFileSize?: number // bytes
  allowedTypes?: string[]
  maxFilesPerType?: number
}

export interface FileValidationError {
  code: string
  message: string
  filename?: string
}

export interface FileValidationResult {
  isValid: boolean
  errors: FileValidationError[]
}

// 기본 설정
export const DEFAULT_FILE_VALIDATION_OPTIONS: FileValidationOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFilesPerType: 30
}

/**
 * 단일 파일 검증
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = DEFAULT_FILE_VALIDATION_OPTIONS
): FileValidationResult {
  const errors: FileValidationError[] = []
  const { maxFileSize, allowedTypes } = { ...DEFAULT_FILE_VALIDATION_OPTIONS, ...options }

  // 파일 크기 검증
  if (maxFileSize && file.size > maxFileSize) {
    const maxSizeMB = Math.round(maxFileSize / 1024 / 1024)
    const currentSizeMB = Math.round(file.size / 1024 / 1024)
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `파일 크기가 ${maxSizeMB}MB를 초과합니다. (현재: ${currentSizeMB}MB)`,
      filename: file.name
    })
  }

  // 파일 형식 검증
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    errors.push({
      code: 'INVALID_FILE_TYPE',
      message: `지원되지 않는 파일 형식입니다. 허용된 형식: ${allowedTypes.join(', ')}`,
      filename: file.name
    })
  }

  // 빈 파일 검증
  if (file.size === 0) {
    errors.push({
      code: 'EMPTY_FILE',
      message: '빈 파일은 업로드할 수 없습니다.',
      filename: file.name
    })
  }

  // 파일명 검증 (특수문자 제한)
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/
  if (invalidChars.test(file.name)) {
    errors.push({
      code: 'INVALID_FILENAME',
      message: '파일명에 특수문자가 포함되어 있습니다.',
      filename: file.name
    })
  }

  // 파일명 길이 검증
  if (file.name.length > 255) {
    errors.push({
      code: 'FILENAME_TOO_LONG',
      message: '파일명이 너무 깁니다. (최대 255자)',
      filename: file.name
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 여러 파일 일괄 검증
 */
export function validateFiles(
  files: File[],
  options: FileValidationOptions = DEFAULT_FILE_VALIDATION_OPTIONS
): FileValidationResult {
  const allErrors: FileValidationError[] = []
  const { maxFilesPerType } = { ...DEFAULT_FILE_VALIDATION_OPTIONS, ...options }

  // 파일 개수 검증
  if (maxFilesPerType && files.length > maxFilesPerType) {
    allErrors.push({
      code: 'TOO_MANY_FILES',
      message: `최대 ${maxFilesPerType}개의 파일만 업로드할 수 있습니다. (현재: ${files.length}개)`
    })
  }

  // 각 파일 개별 검증
  files.forEach(file => {
    const result = validateFile(file, options)
    allErrors.push(...result.errors)
  })

  // 중복 파일명 검증
  const filenames = files.map(f => f.name)
  const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index)
  const uniqueDuplicates = [...new Set(duplicates)]
  
  uniqueDuplicates.forEach(filename => {
    allErrors.push({
      code: 'DUPLICATE_FILENAME',
      message: '중복된 파일명이 있습니다.',
      filename
    })
  })

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}

/**
 * 추가 사진 특화 검증
 */
export function validateAdditionalPhotos(
  beforeFiles: File[],
  afterFiles: File[],
  existingBeforeCount: number = 0,
  existingAfterCount: number = 0
): FileValidationResult {
  const errors: FileValidationError[] = []

  // 작업전 사진 개수 검증
  if (beforeFiles.length + existingBeforeCount > 30) {
    errors.push({
      code: 'TOO_MANY_BEFORE_PHOTOS',
      message: `작업전 사진은 최대 30장까지 업로드할 수 있습니다. (현재: ${existingBeforeCount}장, 추가: ${beforeFiles.length}장)`
    })
  }

  // 작업후 사진 개수 검증
  if (afterFiles.length + existingAfterCount > 30) {
    errors.push({
      code: 'TOO_MANY_AFTER_PHOTOS',
      message: `작업후 사진은 최대 30장까지 업로드할 수 있습니다. (현재: ${existingAfterCount}장, 추가: ${afterFiles.length}장)`
    })
  }

  // 개별 파일 검증
  const beforeResult = validateFiles(beforeFiles)
  const afterResult = validateFiles(afterFiles)

  return {
    isValid: errors.length === 0 && beforeResult.isValid && afterResult.isValid,
    errors: [...errors, ...beforeResult.errors, ...afterResult.errors]
  }
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * MIME 타입에서 파일 확장자 추정
 */
export function getMimeTypeExtension(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg', 
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf'
  }
  
  return mimeMap[mimeType] || 'unknown'
}

/**
 * 안전한 파일명 생성 (특수문자 제거)
 */
export function sanitizeFilename(filename: string): string {
  // 특수문자를 언더스코어로 대체
  const sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
  
  // 연속된 언더스코어를 하나로 통일
  const normalized = sanitized.replace(/_+/g, '_')
  
  // 앞뒤 언더스코어 제거
  const trimmed = normalized.replace(/^_+|_+$/g, '')
  
  // 빈 문자열이면 기본값 반환
  return trimmed || 'unnamed_file'
}

/**
 * 클라이언트 사이드 이미지 압축 (옵션)
 */
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 원본 비율 유지하면서 최대 크기 계산
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height)

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('이미지 압축에 실패했습니다.'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'))
    img.src = URL.createObjectURL(file)
  })
}