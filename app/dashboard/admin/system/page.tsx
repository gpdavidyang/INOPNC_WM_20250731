import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import SystemManagement from '@/components/admin/SystemManagement'

export default async function SystemManagementPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">시스템 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">시스템 설정, 백업 관리 및 감사 로그</p>
        </div>

      <SystemManagement profile={profile} />
          </div>
    </AdminDashboardLayout>
  )
}