'use client'

import Navbar from '@/components/navbar'
import {
    ChipA,
    ChipB,
    ChipD,
    ElevatedCard,
    getSectionClasses,
    PrimaryButton,
    ProminentCard,
    SecondaryButton
} from '@/components/ui'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface TeamListProps {
  currentUser: any
  currentProfile: any
  teamMembers: any[]
}

export default function TeamList({ currentUser, currentProfile, teamMembers }: TeamListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
    position: '',
    role: 'user' as 'admin' | 'manager' | 'user',
  })

  const isAdmin = currentProfile?.role === 'admin'

  const handleEdit = (member: any) => {
    setEditingMember(member)
    setFormData({
      full_name: member.full_name || '',
      department: member.department || '',
      position: member.position || '',
      role: member.role || 'user',
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', editingMember.id)

    if (!error) {
      setShowEditModal(false)
      router.refresh()
    }
  }

  const getRoleChip = (role: string) => {
    const roleConfig: Record<string, { variant: 'a' | 'b' | 'd', label: string }> = {
      admin: { variant: 'a', label: '관리자' },
      manager: { variant: 'b', label: '매니저' },
      user: { variant: 'd', label: '팀원' },
    }
    
    const config = roleConfig[role] || roleConfig.user
    
    switch (config.variant) {
      case 'a':
        return <ChipA>{config.label}</ChipA>
      case 'b':
        return <ChipB>{config.label}</ChipB>
      case 'd':
        return <ChipD>{config.label}</ChipD>
      default:
        return <ChipD>{config.label}</ChipD>
    }
  }

  return (
    <div>
      <Navbar user={currentUser} profile={currentProfile} />
      
      <main className="app">
        <div className="section">
          {/* Header */}
          <div className={getSectionClasses()}>
            <ProminentCard>
              <div className="mb-6">
                <h1 className="title-xl" style={{ color: 'var(--text)' }}>
                  팀원 관리
                </h1>
                <p className="mt-2" style={{ color: 'var(--muted)' }}>
                  전체 {teamMembers.length}명의 팀원
                </p>
              </div>

              {/* Team Members List */}
              <div className="space-y-4">
                {teamMembers.map((member: any) => (
                  <ElevatedCard key={member.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--muted-bg)' }}>
                            <span className="title-lg" style={{ color: 'var(--muted)' }}>
                              {member.full_name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="title-lg" style={{ color: 'var(--text)' }}>
                              {member.full_name || '이름 없음'}
                            </h3>
                            {getRoleChip(member.role)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>이메일:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {member.email}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>부서:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {member.department || '미지정'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>직책:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {member.position || '미지정'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center space-x-2 ml-4">
                          <SecondaryButton 
                            size="compact"
                            onClick={() => handleEdit(member)}
                          >
                            편집
                          </SecondaryButton>
                        </div>
                      )}
                    </div>
                  </ElevatedCard>
                ))}
              </div>
            </ProminentCard>
          </div>
        </div>
      </main>

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full" style={{ backgroundColor: 'var(--card-bg)' }}>
            <h3 className="title-lg mb-4" style={{ color: 'var(--text)' }}>
              팀원 정보 편집
            </h3>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                  이름
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                  className="input"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text)'
                  }}
                />
              </div>
              
              <div>
                <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                  부서
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="input"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text)'
                  }}
                />
              </div>
              
              <div>
                <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                  직책
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="input"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text)'
                  }}
                />
              </div>
              
              <div>
                <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                  권한
                </label>
                <div className="select-wrap">
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'manager' | 'user' }))}
                    className="select"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text)'
                    }}
                  >
                    <option value="user">팀원</option>
                    <option value="manager">매니저</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <SecondaryButton 
                  size="compact"
                  onClick={() => setShowEditModal(false)}
                >
                  취소
                </SecondaryButton>
                <PrimaryButton 
                  size="compact"
                  type="submit"
                >
                  저장
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}