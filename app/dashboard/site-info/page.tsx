import { getCurrentUserSite, getUserSiteHistory } from '@/app/actions/site-info'
import SiteInfoContent from './site-info-content'

export default async function SiteInfoPage() {
  // Fetch current site and history on server side
  const [currentSiteResult, historyResult] = await Promise.all([
    getCurrentUserSite(),
    getUserSiteHistory()
  ])

  const currentSite = currentSiteResult.success ? currentSiteResult.data : null
  const siteHistory = historyResult.success ? historyResult.data || [] : []

  return (
    <SiteInfoContent 
      initialCurrentSite={currentSite}
      initialSiteHistory={siteHistory}
    />
  )
}