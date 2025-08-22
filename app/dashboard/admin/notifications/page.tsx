import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import NotificationCenter from '@/components/admin/notifications/NotificationCenter'

export default async function NotificationCenterPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <NotificationCenter profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}