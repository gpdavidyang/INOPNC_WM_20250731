import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import NotificationCenter from '@/components/admin/NotificationCenter'

export default async function NotificationCenterPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">통합 알림 센터</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            시스템 전체 알림 관리, 푸시 알림 설정, 긴급 알림 발송
          </p>
        </div>
        <NotificationCenter profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}