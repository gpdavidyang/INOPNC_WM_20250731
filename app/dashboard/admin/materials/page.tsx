import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import MaterialsManagement from '@/components/admin/MaterialsManagement'

export default async function MaterialsManagementPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">NPC-1000 자재 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">자재 마스터 데이터 관리 및 공급업체 관리</p>
        </div>
        <MaterialsManagement profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}