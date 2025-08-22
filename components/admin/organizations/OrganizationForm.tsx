'use client'

import { useState } from 'react'
import { X, Save, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Organization {
  id?: string
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
}

interface OrganizationFormProps {
  organization?: Organization | null
  onClose: () => void
  onSave: () => void
}

export default function OrganizationForm({ organization, onClose, onSave }: OrganizationFormProps) {
  const [formData, setFormData] = useState<Organization>({
    name: organization?.name || '',
    representative_name: organization?.representative_name || '',
    business_number: organization?.business_number || '',
    bank_name: organization?.bank_name || '',
    bank_account: organization?.bank_account || '',
    phone: organization?.phone || '',
    email: organization?.email || '',
    fax: organization?.fax || '',
    address: organization?.address || '',
    business_type: organization?.business_type || '건설업',
    business_category: organization?.business_category || '',
    notes: organization?.notes || '',
    is_active: organization?.is_active ?? true
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('회사명은 필수 입력 항목입니다.')
      return
    }

    setSaving(true)
    try {
      if (organization?.id) {
        // Update existing organization
        const { error } = await supabase
          .from('organizations')
          .update(formData)
          .eq('id', organization.id)

        if (error) throw error
        alert('거래처 정보가 수정되었습니다.')
      } else {
        // Create new organization
        const { error } = await supabase
          .from('organizations')
          .insert([formData])

        if (error) throw error
        alert('새 거래처가 등록되었습니다.')
      }
      
      onSave()
    } catch (error: any) {
      console.error('Error saving organization:', error)
      alert(error.message || '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {organization ? '거래처 수정' : '거래처 등록'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">기본 정보</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                회사명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                대표자명
              </label>
              <input
                type="text"
                value={formData.representative_name}
                onChange={(e) => setFormData({...formData, representative_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                사업자등록번호
              </label>
              <input
                type="text"
                value={formData.business_number}
                onChange={(e) => setFormData({...formData, business_number: e.target.value})}
                placeholder="123-45-67890"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                업종
              </label>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="건설업">건설업</option>
                <option value="제조업">제조업</option>
                <option value="서비스업">서비스업</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                업태
              </label>
              <input
                type="text"
                value={formData.business_category}
                onChange={(e) => setFormData({...formData, business_category: e.target.value})}
                placeholder="예: 종합건설, 토목공사"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* 연락처 정보 */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">연락처 정보</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                전화번호
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="02-1234-5678"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                팩스번호
              </label>
              <input
                type="tel"
                value={formData.fax}
                onChange={(e) => setFormData({...formData, fax: e.target.value})}
                placeholder="02-1234-5679"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="contact@company.co.kr"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                주소
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* 금융 정보 */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">금융 정보</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                은행명
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                placeholder="예: 국민은행"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                계좌번호
              </label>
              <input
                type="text"
                value={formData.bank_account}
                onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                placeholder="123-456789-01-234"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* 기타 정보 */}
            <div className="md:col-span-2 mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                메모
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="추가 정보나 특이사항을 입력하세요..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  활성 상태
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}