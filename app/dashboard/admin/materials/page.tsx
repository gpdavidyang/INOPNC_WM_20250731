import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import NPCMaterialManagement from '@/components/admin/materials/NPCMaterialManagement'

export default async function MaterialsManagementPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <NPCMaterialManagement profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}