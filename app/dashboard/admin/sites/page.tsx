import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import SiteManagement from '@/components/admin/SiteManagement'

export default async function SiteManagementPage() {
  // Require admin authentication
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">현장 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">현장 생성, 편집, 관리 및 담당자 배정</p>
        </div>
        <SiteManagement profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}