import { Suspense } from 'react'
import { getMaterials, getMaterialCategories } from '@/app/actions/materials'
import { MaterialManagement } from '@/components/materials/material-management'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function MaterialsPage() {
  const [materialsResult, categoriesResult] = await Promise.all([
    getMaterials({}),
    getMaterialCategories()
  ])

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">NPC-1000 자재 관리</h1>
        <p className="mt-1 text-sm text-gray-600">
          건설 자재의 재고 관리 및 요청 처리를 관리합니다
        </p>
      </div>

      <div className="p-6">
        <Suspense fallback={<LoadingSpinner />}>
          <MaterialManagement 
            materials={materialsResult.data || []}
            categories={categoriesResult.data || []}
          />
        </Suspense>
      </div>
    </div>
  )
}