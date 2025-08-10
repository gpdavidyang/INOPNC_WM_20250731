import { requireAdminAuth } from '@/lib/auth/admin'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const { profile } = await requireAdminAuth()

  return (
    <AdminDashboardLayout profile={profile}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">분석 대시보드</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            실시간 KPI 모니터링, 현장별 생산성 분석, 비용 분석 등을 확인하세요
          </p>
        </div>
        <AnalyticsDashboard profile={profile} />
      </div>
    </AdminDashboardLayout>
  )
}