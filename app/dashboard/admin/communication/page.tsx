import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import CommunicationManagement from '@/components/admin/communication/CommunicationManagement'

export default async function CommunicationManagementPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <CommunicationManagement profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}