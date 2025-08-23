'use client'

import { useState, useEffect } from 'react'
import { X, Check, Building, MapPin, User, Mail, Phone, Shield, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SignupRequest {
  id: string
  email: string
  full_name: string
  phone?: string
  company_name?: string
  requested_role: string
  request_message?: string
}

interface Organization {
  id: string
  name: string
  business_registration_number?: string
}

interface Site {
  id: string
  name: string
  address?: string
  status: string
}

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  request: SignupRequest | null
  onApprove: (data: {
    requestId: string
    organizationId?: string
    siteIds?: string[]
  }) => Promise<void>
}

export default function ApprovalModal({ isOpen, onClose, request, onApprove }: ApprovalModalProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<string>('')
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (isOpen && request) {
      fetchOrganizations()
      fetchSites()
      // Reset selections when modal opens
      setSelectedOrganization('')
      setSelectedSites([])
    }
  }, [isOpen, request])

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, business_registration_number')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    }
  }

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address, status')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const handleApprove = async () => {
    if (!request) return

    // 작업자와 현장관리자는 소속이 필수
    if ((request.requested_role === 'worker' || request.requested_role === 'site_manager') && !selectedOrganization) {
      alert('작업자와 현장관리자는 소속 업체를 선택해야 합니다.')
      return
    }

    // 작업자는 최소 1개 현장 필수
    if (request.requested_role === 'worker' && selectedSites.length === 0) {
      alert('작업자는 최소 1개 이상의 현장을 선택해야 합니다.')
      return
    }

    setProcessing(true)
    try {
      await onApprove({
        requestId: request.id,
        organizationId: selectedOrganization || undefined,
        siteIds: selectedSites.length > 0 ? selectedSites : undefined
      })
      onClose()
    } catch (error) {
      console.error('Error approving request:', error)
    } finally {
      setProcessing(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      worker: '작업자',
      site_manager: '현장관리자',
      customer_manager: '파트너사',
      admin: '관리자'
    }
    return roleLabels[role] || role
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      worker: 'bg-blue-100 text-blue-800',
      site_manager: 'bg-green-100 text-green-800',
      customer_manager: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (!isOpen || !request) return null

  const needsOrganization = request.requested_role === 'worker' || request.requested_role === 'site_manager'
  const needsSites = request.requested_role === 'worker' || request.requested_role === 'site_manager'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                가입 승인 처리
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Request Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{request.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{request.email}</span>
                </div>
                {request.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{request.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(request.requested_role)}`}>
                    {getRoleLabel(request.requested_role)}
                  </span>
                </div>
              </div>
              {request.request_message && (
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-700">{request.request_message}</p>
                </div>
              )}
            </div>

            {/* Organization Selection */}
            {needsOrganization && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  소속 업체 선택 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedOrganization}
                  onChange={(e) => setSelectedOrganization(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">소속 업체를 선택하세요</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.business_registration_number && `(${org.business_registration_number})`}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  작업자와 현장관리자는 반드시 소속 업체를 지정해야 합니다.
                </p>
              </div>
            )}

            {/* Site Selection */}
            {needsSites && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배정 현장 선택 {request.requested_role === 'worker' && <span className="text-red-500">*</span>}
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {sites.map((site) => (
                    <label key={site.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        value={site.id}
                        checked={selectedSites.includes(site.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSites([...selectedSites, site.id])
                          } else {
                            setSelectedSites(selectedSites.filter(id => id !== site.id))
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <span className="text-sm font-medium text-gray-900">{site.name}</span>
                        {site.address && (
                          <span className="text-xs text-gray-500 block">{site.address}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {request.requested_role === 'worker' 
                    ? '작업자는 최소 1개 이상의 현장을 선택해야 합니다. 복수 선택 가능합니다.'
                    : '현장관리자가 관리할 현장을 선택하세요. 복수 선택 가능합니다.'}
                </p>
              </div>
            )}

            {/* Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">승인 시 자동 처리 사항</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>임시 비밀번호가 자동 생성됩니다</li>
                      <li>사용자 계정이 생성되고 프로필이 설정됩니다</li>
                      {needsOrganization && <li>선택한 소속 업체에 배정됩니다</li>}
                      {needsSites && <li>선택한 현장에 작업자/관리자로 배정됩니다</li>}
                      <li>승인 이메일이 발송됩니다 (준비중)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleApprove}
              disabled={processing}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  처리중...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  승인
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}