'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OrganizationForm from './OrganizationForm'
import OrganizationDetail from './OrganizationDetail'

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

export default function OrganizationList() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
      // Mock data for development
      setOrganizations([
        {
          id: '1',
          name: '대한건설',
          representative_name: '김대한',
          business_number: '123-45-67890',
          bank_name: '국민은행',
          bank_account: '123-456789-01-234',
          phone: '02-1234-5678',
          email: 'contact@daehan.co.kr',
          address: '서울시 강남구 테헤란로 123',
          business_type: '건설업',
          business_category: '종합건설',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: '한국토건',
          representative_name: '이한국',
          business_number: '234-56-78901',
          bank_name: '신한은행',
          bank_account: '234-567890-12-345',
          phone: '02-2345-6789',
          email: 'info@hankook.co.kr',
          address: '서울시 서초구 반포대로 456',
          business_type: '건설업',
          business_category: '토목공사',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 거래처를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setOrganizations(organizations.filter(org => org.id !== id))
      alert('거래처가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting organization:', error)
      alert('거래처 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleActive = async (org: Organization) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: !org.is_active })
        .eq('id', org.id)

      if (error) throw error
      
      setOrganizations(organizations.map(o => 
        o.id === org.id ? { ...o, is_active: !o.is_active } : o
      ))
    } catch (error) {
      console.error('Error toggling organization status:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.representative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.business_number?.includes(searchTerm) ||
    org.phone?.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            소속(거래처) 관리
          </h2>
          <button
            onClick={() => {
              setEditingOrg(null)
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            거래처 추가
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="회사명, 대표자, 사업자번호, 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Organizations List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {filteredOrganizations.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            등록된 거래처가 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    회사명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    대표자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    사업자번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrganizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {org.name}
                      </div>
                      {org.business_category && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {org.business_category}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {org.representative_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {org.business_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {org.phone || '-'}
                      </div>
                      {org.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {org.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(org)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          org.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}
                      >
                        {org.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            활성
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            비활성
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingOrg(org)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          title="상세보기"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingOrg(org)
                            setShowForm(true)
                          }}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(org.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Organization Form Modal */}
      {showForm && (
        <OrganizationForm
          organization={editingOrg}
          onClose={() => {
            setShowForm(false)
            setEditingOrg(null)
          }}
          onSave={() => {
            setShowForm(false)
            setEditingOrg(null)
            fetchOrganizations()
          }}
        />
      )}

      {/* Organization Detail Modal */}
      {viewingOrg && (
        <OrganizationDetail
          organization={viewingOrg}
          onClose={() => setViewingOrg(null)}
          onEdit={() => {
            setEditingOrg(viewingOrg)
            setViewingOrg(null)
            setShowForm(true)
          }}
        />
      )}
    </div>
  )
}