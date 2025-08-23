import UserManagement from '@/components/admin/UserManagement'

export default function UserManagementPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">사용자 관리</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">사용자 계정 관리, 역할 배정 및 권한 설정</p>
      </div>
      <UserManagement />
    </div>
  )
}