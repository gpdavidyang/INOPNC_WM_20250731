'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileImage, X } from 'lucide-react'
import { getFullTypographyClass } from '@/contexts/FontSizeContext'

interface BlueprintUploadProps {
  onImageUpload: (imageUrl: string, fileName: string) => void
  currentImage?: string
  currentFileName?: string
  isLargeFont?: boolean
  touchMode?: string
}

export function BlueprintUpload({ onImageUpload, currentImage, currentFileName, isLargeFont = false, touchMode = 'normal' }: BlueprintUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageUpload(result, file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const clearImage = () => {
    onImageUpload('', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (currentImage) {
    return (
      <div className={`flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 ${
        touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
      }`}>
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-blue-600" />
          <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 truncate max-w-xs`}>
            {currentFileName}
          </span>
        </div>
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={clearImage}
          className={`${
            touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
            touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
            'min-w-[48px] min-h-[48px]'
          } p-3 text-gray-500 hover:text-red-600 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-red-500/50`}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg ${
          touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
        } text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 ${
          isDragOver ? 'text-blue-500' : 'text-gray-400'
        }`} />
        <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-medium text-gray-900 mb-2`}>
          도면 파일을 업로드하세요
        </h3>
        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 mb-4`}>
          JPG, PNG, PDF 파일을 드래그하거나 클릭하여 선택하세요
        </p>
        <Button 
          variant="outline" 
          size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
          className={`${
            touchMode === 'glove' ? 'min-h-[64px]' : 
            touchMode === 'precision' ? 'min-h-[48px]' : 
            'min-h-[56px]'
          } px-6 py-3 font-medium active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50`}
        >
          <FileImage className="h-5 w-5 mr-2" />
          파일 선택
        </Button>
      </div>
    </div>
  )
}