import dynamic from 'next/dynamic'

const MobileDemo = dynamic(
  () => import('@/components/mobile').then((mod) => mod.MobileDemo),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }
)

export default function MobileDemoPage() {
  return <MobileDemo />
}