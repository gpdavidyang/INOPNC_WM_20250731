'use client'

import { 
  X, 
  Edit, 
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Calendar,
  Hash,
  Briefcase
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Organization {
  id: string
  name: string
  representative_name?: string
  business_number?: string
  bank_name?: string
  bank_account?: string
  phone?: string
  email?: string
  fax?: string
  address?: string
  business_type?: string
  business_category?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface OrganizationDetailProps {
  organization: Organization
  onClose: () => void
  onEdit: () => void
}

export default function OrganizationDetail({ organization, onClose, onEdit }: OrganizationDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {organization.name}
              </h2>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                organization.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
              }`}>
                {organization.is_active ? '활성' : '비활성'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              title="수정"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">대표자</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.representative_name || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">사업자등록번호</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.business_number || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">업종</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.business_type || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">업태</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.business_category || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">연락처 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">전화번호</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.phone || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">팩스번호</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.fax || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">이메일</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">주소</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.address || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 금융 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">금융 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">은행명</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.bank_name || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">계좌번호</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {organization.bank_account || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 메모 */}
            {organization.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">메모</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {organization.notes}
                  </p>
                </div>
              </div>
            )}

            {/* 시스템 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">시스템 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">등록일</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(organization.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                </div>

                {organization.updated_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">최종 수정일</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {format(new Date(organization.updated_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}