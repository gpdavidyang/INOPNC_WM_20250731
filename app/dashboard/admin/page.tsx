import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import { AdminDashboardContent } from './admin-dashboard-content'

export default async function AdminDashboardPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <AdminDashboardContent />
    </AdminDashboardLayout>
  )
}