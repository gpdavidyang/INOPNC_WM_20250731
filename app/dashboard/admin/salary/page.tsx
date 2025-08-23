import SalaryManagement from '@/components/admin/SalaryManagement'

export default function SalaryManagementPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">급여 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">작업자 급여 규칙 설정 및 급여 계산</p>
    </div>

      <SalaryManagement />
    </div>
  )
}