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

interface TaskListProps {
  currentUser: any
  currentProfile: any
  tasks: any[]
  projects: any[]
  users: any[]
}

export default function TaskList({ currentUser, currentProfile, tasks, projects, users }: TaskListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [filter, setFilter] = useState({
    status: 'all',
    project: 'all',
    assignee: 'all',
  })

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // TODO: Implement when tasks table is created
    // const { error } = await supabase
    //   .from('tasks')
    //   .update({ 
    //     status: newStatus,
    //     completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    //   })
    //   .eq('id', taskId)

    // if (!error) {
    //   router.refresh()
    // }
    alert('작업 상태 변경 기능은 아직 구현 중입니다.')
  }

  const handleDelete = async (taskId: string) => {
    if (confirm('정말로 이 작업을 삭제하시겠습니까?')) {
      // TODO: Implement when tasks table is created
      // const { error } = await supabase
      //   .from('tasks')
      //   .delete()
      //   .eq('id', taskId)

      // if (!error) {
      //   router.refresh()
      // }
      alert('작업 삭제 기능은 아직 구현 중입니다.')
    }
  }

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { variant: 'a' | 'b' | 'd', label: string }> = {
      pending: { variant: 'd', label: '대기 중' },
      in_progress: { variant: 'b', label: '진행 중' },
      completed: { variant: 'a', label: '완료됨' },
      cancelled: { variant: 'd', label: '취소됨' },
    }
    
    const config = statusConfig[status] || statusConfig.pending
    
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

  const getPriorityChip = (priority: string) => {
    const priorityConfig: Record<string, { variant: 'a' | 'b' | 'd', label: string }> = {
      low: { variant: 'd', label: '낮음' },
      medium: { variant: 'b', label: '보통' },
      high: { variant: 'a', label: '높음' },
      urgent: { variant: 'a', label: '긴급' },
    }
    
    const config = priorityConfig[priority] || priorityConfig.medium
    
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

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter.status !== 'all' && task.status !== filter.status) return false
    if (filter.project !== 'all' && task.project_id !== filter.project) return false
    if (filter.assignee !== 'all' && task.assigned_to !== filter.assignee) return false
    return true
  })

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
                  작업 관리
                </h1>
                <Link href="/tasks/new">
                  <PrimaryButton size="field">
                    새 작업 만들기
                  </PrimaryButton>
                </Link>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                    상태
                  </label>
                  <div className="select-wrap">
                    <select
                      value={filter.status}
                      onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                      className="select"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text)'
                      }}
                    >
                      <option value="all">모든 상태</option>
                      <option value="pending">대기 중</option>
                      <option value="in_progress">진행 중</option>
                      <option value="completed">완료됨</option>
                      <option value="cancelled">취소됨</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                    프로젝트
                  </label>
                  <div className="select-wrap">
                    <select
                      value={filter.project}
                      onChange={(e) => setFilter(prev => ({ ...prev, project: e.target.value }))}
                      className="select"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text)'
                      }}
                    >
                      <option value="all">모든 프로젝트</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-r12 font-medium mb-2" style={{ color: 'var(--text)' }}>
                    담당자
                  </label>
                  <div className="select-wrap">
                    <select
                      value={filter.assignee}
                      onChange={(e) => setFilter(prev => ({ ...prev, assignee: e.target.value }))}
                      className="select"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text)'
                      }}
                    >
                      <option value="all">모든 담당자</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Task List */}
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--muted-bg)' }}>
                    <svg className="w-8 h-8" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="title-lg mb-2" style={{ color: 'var(--text)' }}>
                    작업이 없습니다
                  </h3>
                  <p className="mb-4" style={{ color: 'var(--muted)' }}>
                    새로운 작업을 만들어보세요
                  </p>
                  <Link href="/tasks/new">
                    <PrimaryButton size="field">
                      첫 작업 만들기
                    </PrimaryButton>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTasks.map(task => (
                    <ElevatedCard key={task.id} className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="title-lg" style={{ color: 'var(--text)' }}>
                              {task.title}
                            </h3>
                            {getStatusChip(task.status)}
                            {getPriorityChip(task.priority)}
                          </div>
                          
                          <p className="mb-3" style={{ color: 'var(--muted)' }}>
                            {task.description}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>프로젝트:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {task.project?.name || '미지정'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>담당자:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {task.assigned_user?.full_name || '미지정'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>마감일:</span>
                              <span className="ml-2" style={{ color: 'var(--muted)' }}>
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '미지정'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Link href={`/tasks/${task.id}`}>
                            <SecondaryButton size="compact">
                              보기
                            </SecondaryButton>
                          </Link>
                          <SecondaryButton 
                            size="compact"
                            onClick={() => handleStatusChange(task.id, 'completed')}
                          >
                            완료
                          </SecondaryButton>
                          <SecondaryButton 
                            size="compact"
                            onClick={() => handleDelete(task.id)}
                          >
                            삭제
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
    </div>
  )
}