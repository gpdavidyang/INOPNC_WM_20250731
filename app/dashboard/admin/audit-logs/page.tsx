import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import AuditLogSystem from '@/components/admin/audit/AuditLogSystem'

export default async function AuditLogsPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <AuditLogSystem profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}