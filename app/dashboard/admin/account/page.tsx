import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import { AdminAccountSettings } from './admin-account-settings'

export default async function AdminAccountPage() {
  const { profile, user } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">계정 설정</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">개인 정보 및 보안 설정을 관리합니다</p>
        </div>
        
        <AdminAccountSettings profile={profile} user={user} />
      </div>
    </AdminDashboardLayout>
  )
}