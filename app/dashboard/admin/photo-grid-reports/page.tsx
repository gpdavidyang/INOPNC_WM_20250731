import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import PhotoGridReportsManagement from '@/components/admin/PhotoGridReportsManagement'

export default async function AdminPhotoGridReportsPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <PhotoGridReportsManagement profile={profile} />
    </AdminDashboardLayout>
  )
}