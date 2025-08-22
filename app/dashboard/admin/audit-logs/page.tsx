import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import AuditLogs from '@/components/admin/AuditLogs'

export default async function AuditLogsPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">감사 로그</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            시스템 내 모든 활동을 추적하고 모니터링합니다
          </p>
        </div>
        <AuditLogs />
      </div>
    </AdminDashboardLayout>
  )
}