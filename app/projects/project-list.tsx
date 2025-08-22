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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ProjectListProps {
  currentUser: any
  currentProfile: any
  projects: any[]
}

export default function ProjectList({ currentUser, currentProfile, projects }: ProjectListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  })
  const [loading, setLoading] = useState(false)

  const canCreateProject = currentProfile?.role === 'admin' || currentProfile?.role === 'manager'

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Implement when projects table is created
      // const { error } = await supabase
      //   .from('projects')
      //   .insert({
      //     ...formData,
      //     start_date: formData.start_date || null,
      //     end_date: formData.end_date || null,
      //     created_by: currentUser.id,
      //     status: 'active',
      //   })

      // if (error) throw error

      alert('프로젝트 기능은 아직 구현 중입니다.')
      setShowModal(false)
      setFormData({ name: '', description: '', start_date: '', end_date: '' })
      // router.refresh()
    } catch (error: any) {
      alert('프로젝트 생성 중 오류가 발생했습니다: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    // TODO: Implement when projects table is created
    // const { error } = await supabase
    //   .from('projects')
    //   .update({ status: newStatus })
    //   .eq('id', projectId)

    // if (!error) {
    //   router.refresh()
    // }
    alert('프로젝트 상태 변경 기능은 아직 구현 중입니다.')
  }

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { variant: 'a' | 'b' | 'd', label: string }> = {
      active: { variant: 'a', label: '진행 중' },
      completed: { variant: 'a', label: '완료됨' },
      on_hold: { variant: 'b', label: '보류' },
      cancelled: { variant: 'd', label: '취소됨' },
    }
    
    const config = statusConfig[status] || statusConfig.active
    
    switch (config.variant) {
      case 'a':
        return <ChipA>{config.label}</ChipA>
      case 'b':
        return <ChipB>{config.label}</ChipB>
      case 'd':
        return <ChipD>{config.label}</ChipD>
      default:
        return <ChipA>{config.label}</ChipA>
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
              <div className="flex justify-between items-center mb-6">
                <h1 className="title-xl" style={{ color: 'var(--text)' }}>
                  프로젝트 관리
                </h1>
                {canCreateProject && (
                  <PrimaryButton 
                    size="field"
                    onClick={() => setShowModal(true)}
                  >
                    새 프로젝트 만들기
                  </PrimaryButton>
                )}
              </div>

              {/* Project List */}
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--muted-bg)' }}>
                    <svg className="w-8 h-8" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="title-lg mb-2" style={{ color: 'var(--text)' }}>
                    프로젝트가 없습니다
                  </h3>
                  <p className="mb-4" style={{ color: 'var(--muted)' }}>
                    새로운 프로젝트를 만들어보세요
                  </p>
                  {canCreateProject && (
                    <PrimaryButton 
                      size="field"
                      onClick={() => setShowModal(true)}
                    >
                      첫 프로젝트 만들기
                    </PrimaryButton>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map(project => (
                    <ElevatedCard key={project.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="title-lg" style={{ color: 'var(--text)' }}>
                              {project.name}
                            </h3>
                            {getStatusChip(project.status)}
                          </div>
                          
                          <p className="mb-3" style={{ color: 'var(--muted)' }}>
                            {project.description}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>시작일:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {project.start_date ? new Date(project.start_date).toLocaleDateString() : '미지정'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>종료일:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {project.end_date ? new Date(project.end_date).toLocaleDateString() : '미지정'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>작업 수:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {project.tasks?.length || 0}개
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/projects/${project.id}`}>
                            <SecondaryButton size="compact">
                              보기
                            </SecondaryButton>
                          </Link>
                          <SecondaryButton 
                            size="compact"
                            onClick={() => handleStatusChange(project.id, 'completed')}
                          >
                            완료
                          </SecondaryButton>
                        </div>
                      </div>
                    </ElevatedCard>
                  ))}
                </div>
              )}
            </ProminentCard>
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full" style={{ backgroundColor: 'var(--card-bg)' }}>
            <h3 className="title-lg mb-4" style={{ color: 'var(--text)' }}>
              새 프로젝트 만들기
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                  프로젝트명
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="textarea"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    color: 'var(--text)'
                  }}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                    시작일
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
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
                    종료일
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input"
                    style={{
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text)'
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <SecondaryButton 
                  size="compact"
                  onClick={() => setShowModal(false)}
                >
                  취소
                </SecondaryButton>
                <PrimaryButton 
                  size="compact"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? '생성 중...' : '생성'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}