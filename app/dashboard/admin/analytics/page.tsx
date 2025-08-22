import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}