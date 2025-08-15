import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardWithNotifications from '@/components/dashboard/dashboard-with-notifications'
import { getAuthenticatedUser } from '@/lib/auth/session'

export default async function DashboardPage() {
  const supabase = createClient()
  
  // Get authenticated user using our session utility
  const user = await getAuthenticatedUser()
  
  // This should not happen if middleware is working correctly
  if (!user) {
    console.error('No user in dashboard page - middleware should have caught this')
    redirect('/auth/login')
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
  }

  // If profile doesn't exist, create a basic one
  if (!profile) {
    console.log('Creating profile for user:', user.id)
    
    // Determine role based on email
    let role = 'worker'
    if (user.email?.endsWith('@inopnc.com')) {
      if (user.email === 'admin@inopnc.com') role = 'admin'
      else if (user.email === 'manager@inopnc.com') role = 'site_manager'
    } else if (user.email === 'customer@inopnc.com') {
      role = 'customer_manager'
    } else if (user.email === 'davidswyang@gmail.com') {
      role = 'system_admin'
    }

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: role,
        status: 'active',
        organization_id: user.email?.endsWith('@inopnc.com') || user.email === 'davidswyang@gmail.com' 
          ? '11111111-1111-1111-1111-111111111111'
          : user.email === 'customer@inopnc.com'
          ? '22222222-2222-2222-2222-222222222222'
          : null,
        site_id: (role === 'worker' || role === 'site_manager') 
          ? '11111111-1111-1111-1111-111111111111'
          : null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create profile:', insertError)
      // Show error page
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">프로필 생성 실패</h1>
            <p className="text-gray-600 mb-4">프로필을 생성하는 중 오류가 발생했습니다.</p>
            <p className="text-sm text-gray-500">{insertError.message}</p>
            <a href="/auth/login" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              다시 로그인하기
            </a>
          </div>
        </div>
      )
    }

    if (newProfile) {
      // Redirect admin users to admin dashboard
      if (newProfile.role === 'admin' || newProfile.role === 'system_admin') {
        redirect('/dashboard/admin')
      }
      return <DashboardWithNotifications user={user} profile={newProfile as any} />
    }
  }

  // Redirect admin users to admin dashboard
  if (profile && (profile.role === 'admin' || profile.role === 'system_admin')) {
    redirect('/dashboard/admin')
  }

  return <DashboardWithNotifications user={user} profile={profile as any} />
}