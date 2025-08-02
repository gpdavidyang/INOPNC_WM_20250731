import { Metadata } from 'next'
import { NotificationsPage } from '@/components/notifications/notifications-page'
import { PageLayout, PageContainer } from '@/components/dashboard/page-layout'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: '알림 | INOPNC 작업일지 관리',
  description: '시스템 알림 및 메시지 확인',
}

export default function NotificationsRoute() {
  return (
    <PageLayout
      title="알림"
      description="시스템 알림 및 메시지를 확인하세요"
    >
      <PageContainer>
        <NotificationsPage />
      </PageContainer>
    </PageLayout>
  )
}