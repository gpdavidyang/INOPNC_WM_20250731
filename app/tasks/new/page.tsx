import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TaskForm from './task-form'

export default async function NewTaskPage() {
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

  // Get all projects for selection
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  // Get all users for assignment
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')

  return (
    <div className="min-h-screen bg-gray-100">
      <TaskForm 
        currentUser={user} 
        currentProfile={currentProfile}
        projects={projects || []}
        users={users || []}
      />
    </div>
  )
}