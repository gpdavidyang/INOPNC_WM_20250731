'use client'

import { useState, useEffect } from 'react'
import { Profile, CurrentUserSite, UserSiteHistory, SiteInfo } from '@/types'
import { NotificationExtended } from '@/types/notifications'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserSite, getUserSiteHistory } from '@/app/actions/site-info'
import TodaySiteInfo from '@/components/site-info/TodaySiteInfo'
import { useFontSize,  getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, FileText, MapPin, FolderOpen, 
  Edit3, ChevronDown, ChevronUp, Phone, Copy, Navigation,
  Building2, Megaphone, Settings, X, Check, Users, BarChart3,
  ClipboardList, Bell, MessageSquare, DollarSign, HardHat, Plus, GripVertical,
  ArrowUp, ArrowDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
interface HomeTabProps {
  profile: Profile
  onTabChange?: (tabId: string) => void
  onDocumentsSearch?: (searchTerm: string) => void
}

// Remove old SiteInfo interface - using CurrentUserSite type instead

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  isRead: boolean
}

interface QuickMenuItem {
  id: string
  name: string
  icon: React.ReactNode
  path: string
  color: string
  description: string
}

export default function HomeTab({ profile, onTabChange, onDocumentsSearch }: HomeTabProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [siteInfoExpanded, setSiteInfoExpanded] = useState(false)
  const [announcementExpanded, setAnnouncementExpanded] = useState(false)
  const [siteHistoryExpanded, setSiteHistoryExpanded] = useState(false)
  const [recentActivitiesExpanded, setRecentActivitiesExpanded] = useState(false)
  const [quickMenuSettingsOpen, setQuickMenuSettingsOpen] = useState(false)
  const [selectedQuickMenuItems, setSelectedQuickMenuItems] = useState<string[]>([
    'attendance', 'daily-reports', 'site-info', 'documents'
  ])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  
  // Real data states
  const [currentSite, setCurrentSite] = useState<CurrentUserSite | null>(null)
  const [siteHistory, setSiteHistory] = useState<UserSiteHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Available quick menu items
  const availableQuickMenuItems: QuickMenuItem[] = [
    {
      id: 'attendance',
      name: '출력현황',
      icon: <Calendar className="h-5 w-5" />,
      path: '/dashboard/attendance',
      color: 'text-blue-600 dark:text-blue-400',
      description: '출력 및 근무 현황 확인'
    },
    {
      id: 'documents',
      name: '문서함',
      icon: <FolderOpen className="h-5 w-5" />,
      path: '/dashboard/documents',
      color: 'text-green-600 dark:text-green-400',
      description: '개인 문서 관리'
    },
    {
      id: 'site-info',
      name: '현장정보',
      icon: <MapPin className="h-5 w-5" />,
      path: '/dashboard/site-info',
      color: 'text-purple-600 dark:text-purple-400',
      description: '현장 세부 정보'
    },
    {
      id: 'daily-reports',
      name: '작업일지',
      icon: <FileText className="h-5 w-5" />,
      path: '/dashboard/daily-reports',
      color: 'text-indigo-600 dark:text-indigo-400',
      description: '일일 작업 보고서'
    },
    {
      id: 'workers',
      name: '작업자관리',
      icon: <Users className="h-5 w-5" />,
      path: '/dashboard/workers',
      color: 'text-emerald-600 dark:text-emerald-400',
      description: '작업자 정보 관리'
    },
    {
      id: 'statistics',
      name: '통계현황',
      icon: <BarChart3 className="h-5 w-5" />,
      path: '/dashboard/statistics',
      color: 'text-cyan-600 dark:text-cyan-400',
      description: '작업 통계 및 분석'
    },
    {
      id: 'safety',
      name: '안전관리',
      icon: <HardHat className="h-5 w-5" />,
      path: '/dashboard/safety',
      color: 'text-red-600 dark:text-red-400',
      description: '안전 점검 및 관리'
    },
    {
      id: 'notifications',
      name: '알림',
      icon: <Bell className="h-5 w-5" />,
      path: '/dashboard/notifications',
      color: 'text-violet-600 dark:text-violet-400',
      description: '알림 및 메시지'
    },
    {
      id: 'tasks',
      name: '업무목록',
      icon: <ClipboardList className="h-5 w-5" />,
      path: '/dashboard/tasks',
      color: 'text-teal-600 dark:text-teal-400',
      description: '할 일 및 업무 관리'
    },
    {
      id: 'messages',
      name: '메시지',
      icon: <MessageSquare className="h-5 w-5" />,
      path: '/dashboard/messages',
      color: 'text-pink-600 dark:text-pink-400',
      description: '메시지 및 소통'
    }
  ]

  // Convert CurrentUserSite to SiteInfo format
  const convertToSiteInfo = (site: CurrentUserSite | null): SiteInfo | null => {
    if (!site) return null

    return {
      id: site.site_id,
      name: site.site_name,
      address: {
        id: site.site_id,
        site_id: site.site_id,
        full_address: site.site_address || '주소 정보 없음',
        latitude: undefined,
        longitude: undefined,
        postal_code: undefined
      },
      accommodation: site.accommodation_address ? {
        id: site.site_id,
        site_id: site.site_id,
        accommodation_name: site.accommodation_name || '숙소',
        full_address: site.accommodation_address,
        latitude: undefined,
        longitude: undefined
      } : undefined,
      process: {
        member_name: site.component_name || '미정',
        work_process: site.work_process || '미정',
        work_section: site.work_section || '미정',
        drawing_id: undefined
      },
      managers: [
        ...(site.construction_manager_phone ? [{
          role: 'construction_manager' as const,
          name: site.manager_name || '현장 소장',
          phone: site.construction_manager_phone
        }] : []),
        ...(site.safety_manager_phone ? [{
          role: 'safety_manager' as const,
          name: site.safety_manager_name || '안전 관리자',
          phone: site.safety_manager_phone
        }] : [])
      ],
      construction_period: {
        start_date: site.start_date,
        end_date: site.end_date || ''
      },
      is_active: site.site_status === 'active'
    }
  }

  // Fetch real site data
  const fetchSiteData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch current user's assigned site
      const currentSiteResult = await getCurrentUserSite()
      if (currentSiteResult.success) {
        setCurrentSite(currentSiteResult.data)
      } else {
        console.warn('No current site assigned:', currentSiteResult.error)
        setCurrentSite(null)
      }

      // Fetch user's site history
      const historyResult = await getUserSiteHistory()
      if (historyResult.success) {
        setSiteHistory(historyResult.data || [])
      } else {
        console.error('Failed to fetch site history:', historyResult.error)
        setSiteHistory([])
      }
    } catch (error) {
      console.error('Error fetching site data:', error)
      setError('현장 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  
  // Load announcements from database
  const loadAnnouncements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No authenticated user, using fallback announcements')
        setAnnouncements([
          {
            id: crypto.randomUUID(),
            title: '안전교육 필수 이수 안내',
            content: '모든 작업자는 월 1회 안전교육을 필수로 이수해야 합니다.',
            priority: 'high',
            createdAt: new Date().toISOString().split('T')[0],
            isRead: false
          }
        ])
        return
      }

      // Query notifications for the authenticated user
      // Including system notifications (공지사항) and general info notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['system', 'info'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error loading announcements:', error)
        // Fallback announcements
        setAnnouncements([
          {
            id: crypto.randomUUID(),
            title: '안전교육 필수 이수 안내',
            content: '모든 작업자는 월 1회 안전교육을 필수로 이수해야 합니다.',
            priority: 'high',
            createdAt: new Date().toISOString().split('T')[0],
            isRead: false
          }
        ])
        return
      }

      if (!data || data.length === 0) {
        console.log('No notifications found, using fallback announcements')
        setAnnouncements([
          {
            id: crypto.randomUUID(),
            title: '안전교육 필수 이수 안내',
            content: '모든 작업자는 월 1회 안전교육을 필수로 이수해야 합니다.',
            priority: 'high',
            createdAt: new Date().toISOString().split('T')[0],
            isRead: false
          },
          {
            id: crypto.randomUUID(),
            title: '시스템 점검 안내',
            content: '매주 일요일 오전 2시-4시 시스템 점검이 진행됩니다.',
            priority: 'medium',
            createdAt: new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0],
            isRead: true
          }
        ])
        return
      }

      // Transform notifications to announcements
      const transformedAnnouncements: Announcement[] = data.map(notification => ({
        id: notification.id,
        title: notification.title || '',
        content: notification.message || '',
        priority: notification.type === 'error' ? 'high' : 
                 notification.type === 'warning' ? 'medium' : 'low',
        createdAt: notification.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        isRead: notification.read || false
      }))
      
      setAnnouncements(transformedAnnouncements)
    } catch (error) {
      console.error('Error loading announcements:', error)
      setAnnouncements([])
    }
  }

  const supabase = createClient()
  const router = useRouter()

  // Quick menu management functions
  const toggleQuickMenuItem = (itemId: string) => {
    setSelectedQuickMenuItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  const getSelectedQuickMenuItems = () => {
    // Return items in the order they appear in selectedQuickMenuItems
    return selectedQuickMenuItems
      .map(id => availableQuickMenuItems.find(item => item.id === id))
      .filter(item => item !== undefined)
  }

  const saveQuickMenuSettings = () => {
    // Save to localStorage for now - can be extended to save to database
    localStorage.setItem('quickMenuItems', JSON.stringify(selectedQuickMenuItems))
    setQuickMenuSettingsOpen(false)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    setDraggedItem(itemId)
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    if (e.preventDefault) {
      e.preventDefault()
    }
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedItem && draggedItem !== itemId) {
      setDragOverItem(itemId)
    }
    return false
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    
    // Only clear if we're actually leaving the element
    if (!target.contains(relatedTarget)) {
      setDragOverItem(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (e.stopPropagation) {
      e.stopPropagation()
    }
    e.preventDefault()
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return false
    }

    const newItems = [...selectedQuickMenuItems]
    const draggedIndex = newItems.indexOf(draggedItem)
    const targetIndex = newItems.indexOf(targetId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remove dragged item and insert at target position
      const [removed] = newItems.splice(draggedIndex, 1)
      newItems.splice(targetIndex, 0, removed)
      setSelectedQuickMenuItems(newItems)
    }

    setDraggedItem(null)
    setDragOverItem(null)
    return false
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // Touch event handlers for mobile
  const [touchItem, setTouchItem] = useState<string | null>(null)
  
  const handleTouchStart = (itemId: string) => {
    setTouchItem(itemId)
    setDraggedItem(itemId)
  }

  const handleTouchEnd = () => {
    setTouchItem(null)
    setDraggedItem(null)
    setDragOverItem(null)
  }

  // Move item up or down using buttons
  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const newItems = [...selectedQuickMenuItems]
    const currentIndex = newItems.indexOf(itemId)
    
    if (currentIndex === -1) return
    
    if (direction === 'up' && currentIndex > 0) {
      [newItems[currentIndex], newItems[currentIndex - 1]] = [newItems[currentIndex - 1], newItems[currentIndex]]
    } else if (direction === 'down' && currentIndex < newItems.length - 1) {
      [newItems[currentIndex], newItems[currentIndex + 1]] = [newItems[currentIndex + 1], newItems[currentIndex]]
    }
    
    setSelectedQuickMenuItems(newItems)
  }

  // Load saved quick menu settings and fetch site data on component mount
  useEffect(() => {
    // Load quick menu settings
    const saved = localStorage.getItem('quickMenuItems')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setSelectedQuickMenuItems(parsed)
        }
      } catch (e) {
        console.warn('Failed to parse saved quick menu items:', e)
      }
    }

    // Fetch site data and announcements
    fetchSiteData()
    loadAnnouncements()
  }, [])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // TODO: Add toast notification
      console.log(`${type} copied to clipboard`)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const makePhoneCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`)
  }

  const openTMap = (address: string) => {
    // T-Map web URL for address search
    const encodedAddress = encodeURIComponent(address)
    window.open(`https://tmapapi.tmapmobility.com/route?goalname=${encodedAddress}`, '_blank')
  }

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="space-y-3">
      {/* Work Log Creation Button - Primary CTA with Premium Gradient */}
      {(profile.role === 'worker' || profile.role === 'site_manager') && (
        <Card 
          elevation="md" 
          className="theme-transition bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0"
          aria-labelledby="work-log-section"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 id="work-log-section" className="text-white font-semibold text-sm whitespace-nowrap">
                  작업일지 작성
                </h2>
                <p className="text-white/90 text-xs mt-0.5">오늘의 작업 내용을 기록하세요</p>
              </div>
              <button
                onClick={() => router.push('/dashboard/daily-reports/new')}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/95 hover:bg-white text-blue-600 text-xs font-medium rounded-lg transition-colors touch-manipulation focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600 shadow-sm ml-2"
                aria-label="새 작업일지 작성하기"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="whitespace-nowrap">새 작업일지</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Menu Section - 2 Column Grid */}
      <Card 
        elevation="sm" 
        className="theme-transition"
        aria-labelledby="quick-menu-section"
      >
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <CardTitle id="quick-menu-section" className="text-sm font-semibold">
              빠른메뉴
            </CardTitle>
            <button
              onClick={() => setQuickMenuSettingsOpen(true)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="빠른메뉴 설정"
            >
              <Settings className="h-3 w-3" aria-hidden="true" />
              <span>설정</span>
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 pb-3 px-3">
          {/* Dynamic Quick Menu Items */}
          <nav aria-label="빠른메뉴 항목">
            <ul className="grid grid-cols-2 gap-2" role="list">
              {getSelectedQuickMenuItems().map((item: any) => (
                <li key={item.id} role="none">
                  <button 
                    onClick={() => {
                      if (item.id === 'site-info' || item.id === 'daily-reports') {
                        // Site info and daily reports use dedicated pages
                        router.push(item.path)
                      } else if (onTabChange) {
                        // Use tab change for integrated dashboard navigation
                        onTabChange(item.id)
                      } else {
                        // Fallback to router push if no onTabChange provided
                        router.push(item.path)
                      }
                    }}
                    className="w-full flex flex-col items-center py-3 px-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 active:scale-95 touch-manipulation focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[72px] theme-transition"
                    aria-label={`${item.name} - ${item.description}`}
                    role="menuitem"
                  >
                    <div className={`mb-1.5 ${item.color}`} aria-hidden="true">
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </CardContent>
      </Card>

      {/* Today's Site Information - Using TodaySiteInfo Component */}
      <TodaySiteInfo 
        siteInfo={convertToSiteInfo(currentSite)}
        loading={loading}
        error={error ? new Error(error) : null}
      />

      {/* Site History Section */}
      {siteHistory.length > 0 && (
        <Card elevation="sm" className="theme-transition overflow-hidden">
          <button
            onClick={() => setSiteHistoryExpanded(!siteHistoryExpanded)}
            className="w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">현장 참여 이력</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{siteHistory.length}개 현장</span>
              </div>
              {siteHistoryExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </button>
          
          {siteHistoryExpanded && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto">
            {siteHistory.map((site, index) => (
              <button 
                key={`${site.site_id}-${index}`} 
                onClick={() => router.push(`/dashboard/site-info?siteId=${site.site_id}`)}
                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                        {site.site_name}
                      </h4>
                      {site.is_active && (
                        <span className="px-1.5 py-0 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] rounded-full">
                          현재
                        </span>
                      )}
                      <span className={`px-1.5 py-0 text-[10px] rounded-full ${
                        site.user_role === 'site_manager' 
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : site.user_role === 'supervisor'
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                      }`}>
                        {site.user_role === 'site_manager' ? '현장관리자' : 
                         site.user_role === 'supervisor' ? '감독관' : '작업자'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">{site.site_address}</p>
                    
                    {/* Work details if available */}
                    {(site.work_process || site.work_section) && (
                      <div className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-500">
                        {site.work_process && <span>{site.work_process}</span>}
                        {site.work_process && site.work_section && <span className="mx-1">•</span>}
                        {site.work_section && <span>{site.work_section}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {new Date(site.assigned_date).toLocaleDateString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                      {site.unassigned_date && !site.is_active && (
                        <>
                          <span className="mx-0.5">~</span>
                          {new Date(site.unassigned_date).toLocaleDateString('ko-KR', {
                            year: '2-digit',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </>
                      )}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${
                      site.site_status === 'active' 
                        ? 'text-green-600 dark:text-green-400'
                        : site.site_status === 'completed'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {site.site_status === 'active' ? '진행중' :
                       site.site_status === 'completed' ? '완료' : '중지'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
            </div>
          )}
        </Card>
      )}

      {/* Announcements - Toggle */}
      <Card elevation="sm" className="theme-transition overflow-hidden">
        <button
          onClick={() => setAnnouncementExpanded(!announcementExpanded)}
          className="w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">공지사항</h3>
              {announcements.filter(a => !a.isRead).length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                  {announcements.filter(a => !a.isRead).length}
                </span>
              )}
            </div>
            {announcementExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </button>
        
        {announcementExpanded && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700 animate-in slide-in-from-top-1 duration-200">
            {announcements.map((announcement: any) => (
              <div key={announcement.id} className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {announcement.title}
                    </h4>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority === 'high' ? '긴급' : 
                       announcement.priority === 'medium' ? '중요' : '일반'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {announcement.createdAt}
                    </span>
                    {!announcement.isRead && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">{announcement.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activities - High-Density List */}
      <Card elevation="sm" className="theme-transition overflow-hidden">
        <button
          onClick={() => setRecentActivitiesExpanded(!recentActivitiesExpanded)}
          className="w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">최근 활동</h3>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">실시간</span>
            </div>
            {recentActivitiesExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </button>
        
        {recentActivitiesExpanded && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">김</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">김철수</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">10분 전</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">작업일지를 제출했습니다</p>
              </div>
            </div>
          </div>
          <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-green-700 dark:text-green-300">박</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">박현장</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">30분 전</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">작업일지를 승인했습니다</p>
              </div>
            </div>
          </div>
          <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300">이</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">이파트너</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">1시간 전</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">문서를 업로드했습니다</p>
              </div>
            </div>
          </div>
          </div>
        )}
      </Card>

      {/* Quick Menu Settings Modal */}
      {quickMenuSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card elevation="lg" className="w-full max-w-md max-h-[80vh] overflow-hidden theme-transition">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">빠른메뉴 설정</CardTitle>
                <button
                  onClick={() => setQuickMenuSettingsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors theme-transition"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                원하는 빠른메뉴 항목을 선택하고 드래그하여 순서를 변경하세요. (최대 8개)
              </p>
              
              {/* Selected Items with Drag & Drop */}
              {selectedQuickMenuItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">선택된 메뉴</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">드래그 또는 화살표로 순서 변경</span>
                  </div>
                  <div className="space-y-2">
                    {selectedQuickMenuItems.map((itemId, index) => {
                      const item = availableQuickMenuItems.find(i => i.id === itemId)
                      if (!item) return null
                      
                      return (
                        <div
                          key={item.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onDragOver={(e) => handleDragOver(e, item.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, item.id)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={() => handleTouchStart(item.id)}
                          onTouchEnd={handleTouchEnd}
                          className={`flex items-center p-3 rounded-lg border-2 transition-all cursor-move select-none ${
                            dragOverItem === item.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          } ${draggedItem === item.id ? 'opacity-50' : ''}`}
                        >
                          <GripVertical className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div className={`mr-3 ${item.color} flex-shrink-0`}>
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {index + 1}. {item.name}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="위로 이동"
                            >
                              <ArrowUp className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={index === selectedQuickMenuItems.length - 1}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="아래로 이동"
                            >
                              <ArrowDown className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => toggleQuickMenuItem(item.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                              aria-label="제거"
                            >
                              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Available Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">사용 가능한 메뉴</h4>
                <div className="space-y-2">
                  {availableQuickMenuItems
                    .filter(item => !selectedQuickMenuItems.includes(item.id))
                    .map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center p-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
                      onClick={() => {
                        if (selectedQuickMenuItems.length < 8) {
                          toggleQuickMenuItem(item.id)
                        }
                      }}
                    >
                      <div className={`mr-2 ${item.color} flex-shrink-0`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-3" />
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuickMenuItems.length >= 8 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  최대 8개까지 선택할 수 있습니다.
                </p>
              )}
            </CardContent>
            
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedQuickMenuItems.length}/8 선택됨
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setQuickMenuSettingsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors theme-transition"
                >
                  취소
                </button>
                <button
                  onClick={saveQuickMenuSettings}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors theme-transition"
                >
                  저장
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}