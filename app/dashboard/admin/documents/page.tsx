import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import SiteDocumentManagement from '@/components/admin/SiteDocumentManagement'

export default async function AdminDocumentsPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <SiteDocumentManagement profile={profile} />
    </AdminDashboardLayout>
  )
}