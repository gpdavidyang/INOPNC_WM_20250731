import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import TaskDetail from './task-detail'

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get current user profile
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
      project:projects(id, name),
      assigned_user:profiles!tasks_assigned_to_fkey(id, full_name, email),
      created_user:profiles!tasks_created_by_fkey(id, full_name, email)
    `)
    .eq('id', params.id)
    .single()

  if (!task) {
    notFound()
  }

  // Get comments
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      user:profiles(id, full_name, email)
    `)
    .eq('task_id', params.id)
    .order('created_at', { ascending: false })

  // Get all users for assignment
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')

  // Get all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-100">
      <TaskDetail 
        currentUser={user} 
        currentProfile={currentProfile}
        task={task}
        comments={comments || []}
        users={users || []}
        projects={projects || []}
      />
    </div>
  )
}