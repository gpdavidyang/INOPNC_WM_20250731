'use client'

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { Profile, CurrentUserSite, UserSiteHistory } from '@/types'
import { NotificationExtended } from '@/types/notifications'
import { createClient } from '@/lib/supabase/client'
import SimpleSiteInfo from '@/components/site-info/SimpleSiteInfo'
import SiteDebugHelper from '@/components/debug/SiteDebugHelper'
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
import { useAutoLogin, syncSessionAfterAuth } from '@/hooks/use-auto-login'
interface HomeTabProps {
  profile: Profile
  onTabChange?: (tabId: string) => void
  onDocumentsSearch?: (searchTerm: string) => void
  initialCurrentSite?: any
  initialSiteHistory?: any[]
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
  backgroundColor: string
  description: string
}

function HomeTab({ profile, onTabChange, onDocumentsSearch, initialCurrentSite, initialSiteHistory }: HomeTabProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [siteInfoExpanded, setSiteInfoExpanded] = useState(false)
  const [announcementExpanded, setAnnouncementExpanded] = useState(false)
  const [siteHistoryExpanded, setSiteHistoryExpanded] = useState(false)
  const [recentActivitiesExpanded, setRecentActivitiesExpanded] = useState(false)
  const [quickMenuSettingsOpen, setQuickMenuSettingsOpen] = useState(false)
  // 빠른메뉴 기본 설정: 출력현황, 작업일지, 현장정보, 문서함
  const [selectedQuickMenuItems, setSelectedQuickMenuItems] = useState<string[]>([
    'attendance', 'daily-reports', 'site-info', 'documents'
  ])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = useState<string | null>(null)
  
  // Simplified states - removed site data fetching logic
  const [siteHistory, setSiteHistory] = useState<UserSiteHistory[]>(initialSiteHistory || [])
  
  // 빠른메뉴 사용 가능한 모든 항목들
  const availableQuickMenuItems: QuickMenuItem[] = [
    {
      id: 'attendance',
      name: '출력현황',
      icon: <Calendar className="h-5 w-5" />,
      path: '/dashboard/attendance',
      color: 'text-blue-600 dark:text-blue-400',
      backgroundColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800',
      description: '출력 및 근무 현황 확인'
    },
    {
      id: 'daily-reports',
      name: '작업일지',
      icon: <FileText className="h-5 w-5" />,
      path: '/dashboard/daily-reports',
      color: 'text-green-600 dark:text-green-400',
      backgroundColor: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800',
      description: '일일 작업 보고서'
    },
    {
      id: 'site-info',
      name: '현장정보',
      icon: <MapPin className="h-5 w-5" />,
      path: '/dashboard/site-info',
      color: 'text-purple-600 dark:text-purple-400',
      backgroundColor: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800',
      description: '현장 세부 정보 및 공가사항'
    },
    {
      id: 'documents',
      name: '문서함',
      icon: <FolderOpen className="h-5 w-5" />,
      path: '#documents-unified',
      color: 'text-amber-600 dark:text-amber-400',
      backgroundColor: 'bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800',
      description: '개인 문서 관리'
    },
    {
      id: 'emergency',
      name: '긴급연락',
      icon: <Phone className="h-5 w-5" />,
      path: '/dashboard/emergency',
      color: 'text-red-600 dark:text-red-400',
      backgroundColor: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800',
      description: '긴급전화 및 사고신고'
    },
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
      is_active: site.site_status === 'active',
      // Add document properties for compatibility
      ptw_document: site.ptw_document_url ? {
        id: site.ptw_document_id || '',
        title: site.ptw_document_title || 'PTW (작업허가서)',
        file_url: site.ptw_document_url,
        file_name: site.ptw_document_filename || 'PTW.pdf',
        mime_type: site.ptw_document_mime_type || 'application/pdf'
      } : null,
      blueprint_document: site.blueprint_document_url ? {
        id: site.blueprint_document_id || '',
        title: site.blueprint_document_title || '현장 공도면',
        file_url: site.blueprint_document_url,
        file_name: site.blueprint_document_filename || '도면.jpeg',
        mime_type: site.blueprint_document_mime_type || 'image/jpeg'
      } : null
    }
  }

  // Fetch real site data with improved session handling
  const fetchSiteData = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 1 // 재시도 횟수 줄임
    
    // 이미 로딩 중이거나 데이터가 있으면 중복 실행 방지
    if ((loading || currentSite) && retryCount === 0) {
      console.log('🔍 [HOME-TAB] Already loading or data exists, skipping duplicate request')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log(`🔍 [HOME-TAB] Starting fetchSiteData... (retry: ${retryCount}/${MAX_RETRIES})`)
      
      // Session synchronization is now handled automatically by the singleton pattern fix
      // Add small delay to ensure session has propagated after auto-login
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Now try to get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('🔍 [HOME-TAB] Session check result:', { 
        hasSession: !!session,
        sessionError: sessionError?.message,
        accessToken: session?.access_token ? 'Present' : 'Missing'
      })
      
      // If no session, try to refresh it
      if (!session && retryCount === 0) {
        console.log('🔄 [HOME-TAB] No session found, attempting to refresh...')
        const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshResult?.session) {
          console.log('✅ [HOME-TAB] Session refreshed successfully')
          // Session is automatically synchronized by the singleton pattern fix
          // Wait for the refreshed session to propagate
          await new Promise(resolve => setTimeout(resolve, 500))
          // Retry with the new session
          return fetchSiteData(retryCount + 1)
        } else {
          console.log('❌ [HOME-TAB] Session refresh failed:', refreshError?.message)
          // If refresh fails, it might be because we need to re-authenticate
          // Don't set error here, let auto-login handle it
          return
        }
      }
      
      // Now check authentication with the potentially refreshed session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('🔍 [HOME-TAB] Auth check result:', { 
        user: user?.id, 
        email: user?.email, 
        authError: authError?.message 
      })
      
      if (authError || !user) {
        console.log('❌ [HOME-TAB] User not authenticated, clearing site info')
        setCurrentSite(null)
        setSiteHistory([])
        setLoading(false)
        
        // Only set error if we've exhausted retries
        if (retryCount >= MAX_RETRIES) {
          setError('Authentication required - please log in')
        }
        return
      }

      console.log('✅ [HOME-TAB] User authenticated, fetching site data...')
      
      // Add a small delay to ensure session is fully propagated
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Fetch current user's assigned site
      // Check if we're in deployment environment
      const isDeployment = typeof window !== 'undefined' && (
        window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('netlify.app') ||
        (window.location.protocol === 'https:' && !window.location.hostname.includes('localhost'))
      )
      
      // In PWA, add cache-busting headers
      if (isPWA) {
        console.log('🔍 [HOME-TAB] PWA mode: Fetching fresh site data with cache bypass')
      }
      
      console.log('🔍 [HOME-TAB] Fetching site data...', { isDeployment, isPWA })
      
      // Use ultimate fallback that tries multiple methods
      const currentSiteResult = await getCurrentUserSiteUltimate()
        
      console.log('🔍 [HOME-TAB] Site data result:', {
        success: currentSiteResult.success,
        hasData: !!currentSiteResult.data,
        error: currentSiteResult.error,
        siteName: currentSiteResult.data?.site_name,
        isDeploymentFallback: (currentSiteResult as any).isDeploymentFallback
      })
      
      if (currentSiteResult.success) {
        setCurrentSite(currentSiteResult.data)
        console.log('✅ [HOME-TAB] Current site set:', currentSiteResult.data?.site_name)
        
        // Store in localStorage for quick access
        if (currentSiteResult.data) {
          localStorage.setItem('inopnc-current-site', JSON.stringify(currentSiteResult.data))
        }
        
        // Clear error on success
        setError(null)
      } else {
        // If the error is session-related and we haven't retried, try again
        if (currentSiteResult.error?.includes('session') && retryCount < MAX_RETRIES) {
          console.log('🔄 [HOME-TAB] Session error detected, retrying...')
          return fetchSiteData(retryCount + 1)
        }
        
        console.warn('⚠️ [HOME-TAB] No current site assigned:', currentSiteResult.error)
        
        // 배포 환경에서 서버 렌더링이 실패한 경우, fallback 데이터 제공
        // process.env.NODE_ENV는 클라이언트에서 항상 'production'이므로 window 객체로 브라우저 환경 감지
        const isDeploymentEnv = typeof window !== 'undefined' && (
          window.location.hostname.includes('vercel.app') || 
          window.location.hostname.includes('netlify.app') ||
          window.location.protocol === 'https:'
        )
        
        // Deployment-safe version already handles fallback internally
        if ((currentSiteResult as any).isDeploymentFallback) {
          setIsDeploymentFallback(true)
          console.log('✅ [HOME-TAB] Using deployment fallback data')
        }
        setCurrentSite(null)
      }

      // Fetch user's site history
      console.log('🔍 [HOME-TAB] Fetching site history...')
      
      // Use ultimate fallback that tries multiple methods
      const historyResult = await getUserSiteHistoryUltimate()
        
      console.log('🔍 [HOME-TAB] Site history result:', {
        success: historyResult.success,
        count: historyResult.data?.length || 0,
        error: historyResult.error
      })
      
      if (historyResult.success) {
        setSiteHistory(historyResult.data || [])
      } else {
        console.error('❌ [HOME-TAB] Failed to fetch site history:', historyResult.error)
        setSiteHistory([])
      }
      
      // Success - clear any previous errors
      setError(null)
      
    } catch (error) {
      console.error('❌ [HOME-TAB] Error fetching site data:', error)
      
      // If it's a network error and we haven't retried, try again
      if (retryCount < MAX_RETRIES && error instanceof Error && 
          (error.message.includes('network') || error.message.includes('fetch'))) {
        console.log('🔄 [HOME-TAB] Network error detected, retrying...')
        return fetchSiteData(retryCount + 1)
      }
      
      setError('현장 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
      console.log('🏁 [HOME-TAB] fetchSiteData completed')
    }
  }, []) // dependencies 제거하여 무한 루프 방지
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  
  // Load announcements from database
  const loadAnnouncements = useCallback(async () => {
    try {
      console.log('🔍 [HOME-TAB] Loading announcements...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      console.log('🔍 [HOME-TAB] Announcements auth check:', { 
        user: user?.id, 
        email: user?.email, 
        authError: authError?.message 
      })
      
      if (authError || !user) {
        console.log('❌ [HOME-TAB] No authenticated user, using fallback announcements')
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
      
      console.log('✅ [HOME-TAB] User authenticated for announcements')

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
  }, [])

  // Create a stable supabase client instance to maintain session consistency
  const supabase = useMemo(() => createClient(), [])
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
    const initializeComponent = async () => {
      try {
        console.log('🔍 [HOME-TAB] Initializing component...')
        console.log('🔍 [HOME-TAB] Initial data:', { 
          hasCurrentSite: !!initialCurrentSite, 
          hasSiteHistory: !!initialSiteHistory?.length 
        })
        
        // Force set default quick menu items: 출력현황, 작업일지, 현장정보, 문서함
        const defaultItems = ['attendance', 'daily-reports', 'site-info', 'documents']
        setSelectedQuickMenuItems(defaultItems)
        
        // Only update localStorage if needed to prevent unnecessary writes
        const savedItems = localStorage.getItem('quickMenuItems')
        if (savedItems !== JSON.stringify(defaultItems)) {
          localStorage.setItem('quickMenuItems', JSON.stringify(defaultItems))
        }

        // Check authentication state first
        console.log('🔍 [HOME-TAB] Checking authentication state...')
        
        // First try to get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // If we have a session, verify it's valid
        let validSession = false
        let currentUser = null
        
        if (session && !sessionError) {
          // Double-check with getUser to ensure session is truly valid
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          if (user && !userError) {
            validSession = true
            currentUser = user
            console.log('✅ [HOME-TAB] Valid session confirmed:', user.email)
          } else {
            console.log('⚠️ [HOME-TAB] Session exists but user verification failed:', userError?.message)
            // Try to refresh the session
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
            if (refreshedSession && !refreshError) {
              validSession = true
              currentUser = refreshedSession.user
              console.log('✅ [HOME-TAB] Session refreshed successfully:', refreshedSession.user?.email)
            }
          }
        }
        
        console.log('🔍 [HOME-TAB] Auth initialization result:', {
          hasSession: !!session,
          validSession,
          hasUser: !!currentUser,
          userEmail: currentUser?.email
        })

        // If we have a valid session, fetch site data
        if (validSession && currentUser) {
          console.log('✅ [HOME-TAB] User authenticated, fetching site data...')
          // fetchSiteData를 한 번만 호출하도록 보장
          if (!loading && !currentSite) {
            fetchSiteData()
          }
        } else {
          console.log('⚠️ [HOME-TAB] No valid authentication')
          
          // Clear any stale session data
          localStorage.removeItem('inopnc-login-success')
          localStorage.removeItem('inopnc-current-site')
          
          // If we have initial data from server, use it temporarily
          if (initialCurrentSite) {
            setCurrentSite(initialCurrentSite)
            setLoading(false)
            console.log('✅ [HOME-TAB] Using initial site data from server')
          } else {
            // No session and no initial data - will trigger auto-login
            setLoading(false)
            setError('Authentication required')
          }
        }
        
        // Always load announcements (they work with fallback data)
        loadAnnouncements()
      } catch (error) {
        console.error('Error during component initialization:', error)
        setLoading(false)
        setError('Failed to initialize')
      }
    }

    initializeComponent()
  }, [fetchSiteData, loadAnnouncements, initialCurrentSite, loading, currentSite]) // Add dependencies to prevent re-initialization

  // Add auth state change listener to refetch data when authentication changes
  useEffect(() => {
    console.log('🔍 [HOME-TAB] Setting up auth state change listener...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 [HOME-TAB] Auth state changed:', { event, hasSession: !!session, userEmail: session?.user?.email })
      
      // Only handle SIGNED_OUT events automatically
      // SIGNED_IN is handled manually in the login button
      if (event === 'SIGNED_OUT') {
        console.log('❌ [HOME-TAB] User signed out, clearing all data...')
        
        // Clear all state
        setCurrentSite(null)
        setSiteHistory([])
        setAnnouncements([])
        setError(null)
        setLoading(false)
        
        // Clear localStorage data we created
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('inopnc-login-success')
          localStorage.removeItem('inopnc-current-site')
          localStorage.removeItem('inopnc-auto-login-disabled') // Re-enable auto-login for next session
          localStorage.removeItem('inopnc-auto-login-attempts')  // Reset attempt counter
          localStorage.removeItem('inopnc-last-auto-login')      // Reset cooldown
          console.log('🗑️ [HOME-TAB] Cleared localStorage login data and re-enabled auto-login')
        }
        
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ [HOME-TAB] User signed in via auth state change')
        // Don't automatically fetch data here to avoid conflicts with manual login
      }
    })

    return () => {
      console.log('🔍 [HOME-TAB] Cleaning up auth state listener...')
      subscription.unsubscribe()
    }
  }, [fetchSiteData, loadAnnouncements])

  // Detect PWA environment
  useEffect(() => {
    const checkPWA = () => {
      // Check if running in standalone mode (installed PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          document.referrer.includes('android-app://') ||
                          window.location.search.includes('mode=standalone')
      
      // Check if service worker is controlling the page
      const hasServiceWorker = 'serviceWorker' in navigator && navigator.serviceWorker.controller
      
      setIsPWA(isStandalone || hasServiceWorker)
      
      if (isStandalone || hasServiceWorker) {
        console.log('🔄 [HOME-TAB] PWA environment detected, forcing data refresh')
        // Force refresh data in PWA to bypass cache
        setDataRefreshCount(prev => prev + 1)
      }
    }
    
    checkPWA()
    
    // Also check when app becomes visible (for PWA resume)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPWA) {
        console.log('🔄 [HOME-TAB] PWA became visible, refreshing data')
        setDataRefreshCount(prev => prev + 1)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isPWA])

  // Use the auto-login hook with proper session synchronization
  const { 
    isLoading: autoLoginLoading, 
    isAuthenticated: autoLoginAuthenticated, 
    user: autoLoginUser,
    error: autoLoginError 
  } = useAutoLogin(!currentSite && !loading) // Only enable when no site data
  
  // When auto-login succeeds or PWA refresh triggered, fetch site data
  useEffect(() => {
    if (autoLoginAuthenticated && autoLoginUser && (!currentSite || dataRefreshCount > 0) && !loading) {
      console.log('✅ [HOME-TAB] Auto-login successful or PWA refresh triggered, waiting for session stabilization...')
      // Add longer delay to ensure session cookies are fully propagated and client can read them
      const timer = setTimeout(async () => {
        // Double-check session is available before attempting fetch
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session && !loading) { // 추가 체크
          console.log('✅ [HOME-TAB] Session confirmed, fetching site data...')
          fetchSiteData()
        } else {
          console.warn('⚠️ [HOME-TAB] Auto-login successful but session not yet available or already loading')
        }
      }, 2000) // Longer delay for proper session propagation
      return () => clearTimeout(timer)
    }
  }, [autoLoginAuthenticated, autoLoginUser, currentSite, loading, fetchSiteData, dataRefreshCount])

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
    <div className="space-y-4">
      {/* Work Log Creation Button - Primary CTA with Premium Gradient */}
      {(profile.role === 'worker' || profile.role === 'site_manager') && (
        <Card 
          className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
          aria-labelledby="work-log-section"
        >
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 id="work-log-section" className="text-white font-semibold text-sm whitespace-nowrap">
                  작업일지 작성
                </h2>
                <p className="text-white/90 text-xs mt-0.5 whitespace-nowrap">오늘의 작업 내용을 기록하세요</p>
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

      {/* Quick Menu Section - High Contrast Design */}
      <Card 
        variant="elevated"
        elevation="md"
        className="transition-all duration-200"
        aria-labelledby="quick-menu-section"
      >
        <CardHeader className="pb-3 pt-4 px-4 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <CardTitle id="quick-menu-section" className="text-base font-semibold text-slate-900 dark:text-slate-100">
              빠른메뉴
            </CardTitle>
            <button
              onClick={() => setQuickMenuSettingsOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label="빠른메뉴 설정"
            >
              <Settings className="h-3 w-3" aria-hidden="true" />
              <span>설정</span>
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-3 pb-4 px-4">
          {/* Dynamic Quick Menu Items - Enhanced Design */}
          <nav aria-label="빠른메뉴 항목">
            <ul className="grid grid-cols-2 gap-3" role="list">
              {getSelectedQuickMenuItems().map((item: any) => (
                <li key={item.id} role="none">
                  <button 
                    onClick={() => {
                      console.log('[QuickMenu] Navigating to:', item.path)
                      
                      // Handle hash-based navigation for documents tab
                      if (item.path.startsWith('#') || item.id === 'documents') {
                        const tabId = item.path.replace('#', '')
                        console.log('[QuickMenu] Setting active tab to:', tabId)
                        
                        // Always ensure we're on the dashboard page for tab navigation
                        const currentPath = window.location.pathname
                        if (currentPath !== '/dashboard' && currentPath !== '/dashboard/') {
                          // Navigate to dashboard with the tab hash
                          router.push(`/dashboard#${tabId}`)
                        } else {
                          // We're on dashboard, just change the tab
                          onTabChange(tabId)
                          window.location.hash = tabId
                        }
                        return
                      }
                      
                      // Regular navigation for other items
                      router.push(item.path)
                    }}
                    className={`w-full flex flex-col items-center py-4 px-3 ${item.backgroundColor} rounded-xl transition-all duration-200 active:scale-[0.98] touch-manipulation focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 min-h-[72px] shadow-sm hover:shadow-md group`}
                    aria-label={`${item.name} - ${item.description}`}
                    role="menuitem"
                  >
                    <div className={`mb-2 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-slate-600 ${item.color}`} aria-hidden="true">
                      {React.cloneElement(item.icon as React.ReactElement, {
                        className: "h-5 w-5",
                        strokeWidth: 2
                      })}
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </CardContent>
      </Card>

      {/* Auto-login logic when no current site - removed yellow login box */}
      {false && (
        <Card className="mb-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                  {loading ? '현장 정보 확인 중...' : '현장 정보 확인 중'}
                </h3>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                  {loading 
                    ? '현장 배정 정보를 불러오고 있습니다...' 
                    : '현장 배정 정보를 확인하고 있습니다. 로그인이 필요할 수 있습니다.'
                  }
                </p>
                {loading && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <span className="text-sm text-yellow-600">데이터 로딩 중...</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    console.log('🔧 Redirecting to login page...')
                    window.location.href = '/auth/login?redirectTo=' + encodeURIComponent(window.location.pathname)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  로그인 페이지로 이동
                </button>
                
                <button
                  onClick={async () => {
                    console.log('🔧 Quick manager login attempt...')
                    try {
                      // First check current auth state
                      const { data: currentUser } = await supabase.auth.getUser()
                      console.log('Current auth state:', { user: currentUser.user?.email })
                      
                      // Sign in with direct approach (browser-compatible)
                      const { data, error } = await supabase.auth.signInWithPassword({
                        email: 'manager@inopnc.com',
                        password: 'password123'
                      })
                      
                      if (error || !data.session) {
                        console.error('Quick login failed:', error?.message)
                        alert(`빠른 로그인 실패: ${error?.message}`)
                        return
                      }
                      
                      console.log('✅ Quick login successful:', data.user?.email)
                      
                      // Sync session with server for immediate availability
                      const syncResult = await syncSessionAfterAuth(data.session)
                      if (!syncResult.success) {
                        console.warn('Session sync failed:', syncResult.error)
                      }
                      
                      // Wait for session to fully propagate
                      await new Promise(resolve => setTimeout(resolve, 500))
                      
                      // Now fetch site data with synchronized session
                      console.log('🔄 Fetching site data with synchronized session...')
                      
                      try {
                        const siteResult = await getCurrentUserSiteWithAuth()
                        console.log('✅ Direct site fetch result:', siteResult)
                        
                        if (siteResult.success && siteResult.data) {
                          setCurrentSite(siteResult.data)
                          setError(null)
                          setLoading(false)
                          console.log('✅ Site data set successfully:', siteResult.data.site_name)
                          
                          // Store successful login state in localStorage
                          localStorage.setItem('inopnc-login-success', 'true')
                          localStorage.setItem('inopnc-current-site', JSON.stringify(siteResult.data))
                          
                          // Also fetch site history
                          const historyResult = await getUserSiteHistoryWithAuth()
                          if (historyResult.success) {
                            setSiteHistory(historyResult.data || [])
                          }
                          
                          alert('로그인 성공! 현장 정보를 불러왔습니다: ' + siteResult.data.site_name)
                        } else {
                          console.error('❌ Site fetch failed:', siteResult.error)
                          
                          // Try once more after additional delay
                          await new Promise(resolve => setTimeout(resolve, 1000))
                          const retryResult = await getCurrentUserSiteWithAuth()
                          
                          if (retryResult.success && retryResult.data) {
                            setCurrentSite(retryResult.data)
                            setError(null)
                            setLoading(false)
                            alert('로그인 성공! 현장 정보를 불러왔습니다: ' + retryResult.data.site_name)
                          } else {
                            alert('로그인 성공! 페이지를 새로고침하여 현장 정보를 불러옵니다.')
                            window.location.reload()
                          }
                        }
                      } catch (error) {
                        console.error('❌ Site fetch error:', error)
                        alert('로그인 성공! 페이지를 새로고침하여 현장 정보를 불러옵니다.')
                        window.location.reload()
                      }
                      
                    } catch (err) {
                      console.error('Quick login error:', err)
                      alert('로그인 중 오류가 발생했습니다.')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                >
                  manager 빠른 로그인
                </button>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <div>빠른 로그인: manager@inopnc.com / password123</div>
                <div>현재 상태: currentSite={currentSite ? '있음' : '없음'}, loading={loading ? '로딩중' : '완료'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Site Information - Using TodaySiteInfo Component */}
      {isDeploymentFallback && (
        <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                배포 환경에서 임시 데이터를 사용중입니다. 로그인하시면 실제 현장 정보가 표시됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* PWA Data Refresh Button */}
      {isPWA && (
        <Card className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  PWA 모드에서 실행 중
                </p>
              </div>
              <button
                onClick={() => {
                  console.log('🔄 [HOME-TAB] Manual refresh triggered in PWA')
                  setDataRefreshCount(prev => prev + 1)
                  fetchSiteData()
                }}
                className="px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-300 
                          bg-amber-100 dark:bg-amber-800/30 rounded-lg
                          hover:bg-amber-200 dark:hover:bg-amber-800/50 
                          transition-colors duration-200"
              >
                데이터 새로고침
              </button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 새로운 간단한 사이트 정보 컴포넌트 - 클라이언트에서 직접 데이터 가져옴 */}
      <SimpleSiteInfo 
        userId={profile.id}
        userRole={profile.role}
      />

      {/* Site History Section - High Contrast Design */}
      {siteHistory.length > 0 && (
        <Card variant="elevated" elevation="md" className="overflow-hidden transition-all duration-200">
          <button
            onClick={() => setSiteHistoryExpanded(!siteHistoryExpanded)}
            className="w-full px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">현장 참여 이력</h3>
                <span className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-medium">{siteHistory.length}개 현장</span>
              </div>
              {siteHistoryExpanded ? (
                <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              )}
            </div>
          </button>
          
          {siteHistoryExpanded && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-48 overflow-y-auto">
            {siteHistory
              .sort((a, b) => new Date(b.assigned_date).getTime() - new Date(a.assigned_date).getTime())
              .map((site, index) => (
              <button 
                key={`${site.site_id}-${index}`} 
                onClick={() => router.push(`/dashboard/site-info?siteId=${site.site_id}`)}
                className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {site.site_name}
                      </h4>
                      {site.is_active && (
                        <span className="px-1.5 py-0 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-full">
                          현재
                        </span>
                      )}
                      <span className={`px-1.5 py-0 text-sm rounded-full ${
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{site.site_address}</p>
                    
                    {/* Work details if available */}
                    {(site.work_process || site.work_section) && (
                      <div className="mt-0.5 text-sm text-gray-500 dark:text-gray-500">
                        {site.work_process && <span>{site.work_process}</span>}
                        {site.work_process && site.work_section && <span className="mx-1">•</span>}
                        {site.work_section && <span>{site.work_section}</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
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
                    <div className={`text-sm mt-0.5 ${
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

      {/* Announcements Section - High Contrast Design */}
      <Card variant="elevated" elevation="md" className="overflow-hidden transition-all duration-200">
        <button
          onClick={() => setAnnouncementExpanded(!announcementExpanded)}
          className="w-full px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">공지사항</h3>
              {announcements.filter(a => !a.isRead).length > 0 && (
                <span className="px-2 py-0.5 bg-red-500/90 text-white text-sm font-medium rounded-full shadow-sm">
                  {announcements.filter(a => !a.isRead).length}
                </span>
              )}
            </div>
            {announcementExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
        </button>
        
        {announcementExpanded && (
          <div className="divide-y divide-gray-200 dark:divide-slate-600 animate-in slide-in-from-top-1 duration-200">
            {announcements.map((announcement: any) => (
              <div key={announcement.id} className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {announcement.title}
                    </h4>
                    <span className={`px-1.5 py-0.5 text-sm rounded-full ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority === 'high' ? '긴급' : 
                       announcement.priority === 'medium' ? '중요' : '일반'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {announcement.createdAt}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{announcement.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Activities Section - High Contrast Design */}
      <Card variant="elevated" elevation="md" className="overflow-hidden transition-all duration-200">
        <button
          onClick={() => setRecentActivitiesExpanded(!recentActivitiesExpanded)}
          className="w-full px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">최근 활동</h3>
              <span className="text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full font-medium">실시간</span>
            </div>
            {recentActivitiesExpanded ? (
              <ChevronUp className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            )}
          </div>
        </button>
        
        {recentActivitiesExpanded && (
          <div className="divide-y divide-slate-200 dark:divide-slate-600">
          <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">김</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">김철수</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">10분 전</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">작업일지를 제출했습니다</p>
              </div>
            </div>
          </div>
          <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">박</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">박현장</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">30분 전</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">작업일지를 승인했습니다</p>
              </div>
            </div>
          </div>
          <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">이</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">이파트너</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">1시간 전</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">문서를 업로드했습니다</p>
              </div>
            </div>
          </div>
          </div>
        )}
      </Card>

      {/* Debug Helper - Development Only */}
      <SiteDebugHelper />

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
                원하는 빠른메뉴 항목을 선택하고 드래그하여 순서를 변경하세요. (최대 5개)
              </p>
              
              {/* Selected Items with Drag & Drop */}
              {selectedQuickMenuItems.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">선택된 메뉴</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">드래그 또는 화살표로 순서 변경</span>
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
                        if (selectedQuickMenuItems.length < 5) {
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-3" />
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuickMenuItems.length >= 5 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  최대 5개까지 선택할 수 있습니다.
                </p>
              )}
            </CardContent>
            
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedQuickMenuItems.length}/5 선택됨
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

export default memo(HomeTab)