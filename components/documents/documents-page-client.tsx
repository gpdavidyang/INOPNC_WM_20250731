'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MyDocuments } from '@/components/documents/my-documents'
import { SharedDocuments } from '@/components/documents/shared-documents'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Suspense } from 'react'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface DocumentsPageClientProps {
  profile: any
}

export function DocumentsPageClient({ profile }: DocumentsPageClientProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // Touch-responsive padding
  const getPadding = () => {
    if (touchMode === 'glove') return 'px-8 py-5'
    if (touchMode === 'precision') return 'px-4 py-3'
    return 'px-6 py-4'
  }

  const getContentPadding = () => {
    if (touchMode === 'glove') return 'p-8'
    if (touchMode === 'precision') return 'p-4'
    return 'p-6'
  }

  return (
    <div className="h-full bg-white">
      <div className={`sticky top-0 z-20 border-b border-gray-200 bg-white ${getPadding()}`}>
        <h1 className={`${getFullTypographyClass('heading', isLargeFont ? '3xl' : '2xl', isLargeFont)} font-semibold text-gray-900`}>
          문서 관리
        </h1>
        <p className={`mt-1 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
          개인 문서 및 공유 문서를 관리합니다
        </p>
      </div>

      <div className={getContentPadding()}>
        <Tabs defaultValue="my-documents" className="space-y-4">
          <TabsList className={`grid w-full grid-cols-2 ${
            touchMode === 'glove' ? 'h-14' : touchMode === 'precision' ? 'h-10' : 'h-12'
          }`}>
            <TabsTrigger 
              value="my-documents" 
              className={`${getFullTypographyClass('button', 'base', isLargeFont)} ${
                touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
              }`}
            >
              내문서함
            </TabsTrigger>
            <TabsTrigger 
              value="shared-documents"
              className={`${getFullTypographyClass('button', 'base', isLargeFont)} ${
                touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
              }`}
            >
              공유문서함
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-documents" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <MyDocuments profile={profile} />
            </Suspense>
          </TabsContent>

          <TabsContent value="shared-documents" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <SharedDocuments profile={profile} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}