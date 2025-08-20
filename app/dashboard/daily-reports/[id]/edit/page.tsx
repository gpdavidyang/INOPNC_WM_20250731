import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getDailyReportById } from '@/app/actions/daily-reports'
import DailyReportFormEdit from '@/components/daily-reports/daily-report-form-edit'
import Sidebar from '@/components/dashboard/sidebar'
import Header from '@/components/dashboard/header'
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'
import { NavigationController } from '@/components/navigation/navigation-controller'
import { Home, Calendar, FileText, FolderOpen, MapPin } from 'lucide-react'

export default async function EditDailyReportPage({
  params
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Get daily report with all related data
  const result = await getDailyReportById(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const report = result.data

  // Check if user can edit this report
  const canEdit = 
    report.created_by === user.id &&
    report.status === 'draft'

  if (!canEdit) {
    redirect(`/dashboard/daily-reports/${params.id}`)
  }

  // Bottom navigation items
  const bottomNavItems: BottomNavItem[] = [
    { 
      label: "빠른화면", 
      href: "/dashboard", 
      icon: <Home /> 
    },
    { 
      label: "출력정보", 
      href: "/dashboard/attendance", 
      icon: <Calendar /> 
    },
    { 
      label: "작업일지", 
      href: "/dashboard/daily-reports", 
      icon: <FileText />, 
      badge: 3
    },
    { 
      label: "현장정보", 
      href: "/dashboard/site-info", 
      icon: <MapPin /> 
    },
    { 
      label: "문서함", 
      href: "/dashboard/documents", 
      icon: <FolderOpen /> 
    }
  ]

  return (
    <NavigationController>
    <>
      {/* Mobile View */}
      <div className="lg:hidden">
        <Header />
        <div className="p-4">
          <DailyReportFormEdit
            report={report as any}
            currentUser={profile as any}
          />
        </div>
        <BottomNavigation items={bottomNavItems} />
      </div>

      {/* Desktop View */}
      <div className="hidden lg:flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <div className="max-w-4xl mx-auto">
              <DailyReportFormEdit
                report={report as any}
                currentUser={profile as any}
              />
            </div>
          </main>
        </div>
      </div>
    </>
    </NavigationController>
  )
}