// 사용자 역할
export type UserRole = 'worker' | 'site_manager' | 'customer_manager' | 'admin' | 'system_admin'

// 사용자 상태
export type UserStatus = 'active' | 'inactive' | 'suspended'

// 사용자 프로필
export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string | null
  role: UserRole
  status?: UserStatus | null
  avatar_url?: string | null
  created_at: string
  updated_at: string
  last_login_at?: string | null
  login_count?: number | null
  notification_preferences?: {
    push_enabled?: boolean
    material_approvals?: boolean
    daily_report_reminders?: boolean
    safety_alerts?: boolean
    equipment_maintenance?: boolean
    site_announcements?: boolean
    quiet_hours_enabled?: boolean
    quiet_hours_start?: string
    quiet_hours_end?: string
    sound_enabled?: boolean
    vibration_enabled?: boolean
    show_previews?: boolean
    group_notifications?: boolean
  } | null
  push_subscription?: any | null
  push_subscription_updated_at?: string | null
}

// 건설 공정 타입 (사용자 요구사항에 맞춤)
export type ConstructionProcessType = 
  | 'crack'            // 균열
  | 'surface'          // 면
  | 'finishing'        // 마감
  | 'other'            // 기타

// 부재 타입 (사용자 요구사항에 맞춤)
export type ComponentType = 
  | 'slab'             // 슬라브
  | 'girder'           // 거더
  | 'column'           // 기둥
  | 'other'            // 기타

// 건설 사진 데이터
export interface ConstructionPhoto {
  id: string
  component_name: string       // 부재명 (예: "기둥-1", "보-A동", "슬라브-3층")
  component_type: ComponentType
  process_type: ConstructionProcessType
  stage: 'before' | 'after'
  file_url: string
  thumbnail_url?: string
  description?: string
  coordinates?: { x: number, y: number }
  timestamp: string
  file_size?: number
  file_name?: string
  daily_report_id?: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

// 사진 그룹 (동일 부재/공정의 전후 사진 묶음)
export interface PhotoGroup {
  id: string
  component_name: string
  component_type: ComponentType
  process_type: ConstructionProcessType
  before_photos: ConstructionPhoto[]
  after_photos: ConstructionPhoto[]
  progress_status: 'not_started' | 'in_progress' | 'completed'
  notes?: string
  daily_report_id: string
  created_at: string
  updated_at: string
}

// 사진 업로드 진행률
export interface PhotoProgress {
  component_name: string
  component_type: ComponentType
  processes: {
    process_type: ConstructionProcessType
    has_before: boolean
    has_after: boolean
    completed: boolean
  }[]
  overall_progress: number // 0-100%
}

// 조직 타입
export type OrganizationType = 'head_office' | 'branch_office' | 'department'

// 조직
export interface Organization {
  id: string
  name: string
  type: OrganizationType
  parent_id?: string | null
  description?: string | null
  address?: string | null
  phone?: string | null
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

// 현장 상태
export type SiteStatus = 'active' | 'inactive' | 'completed'

// 현장
export interface Site {
  id: string
  name: string
  address: string
  description?: string | null
  construction_manager_phone?: string | null
  safety_manager_phone?: string | null
  accommodation_name?: string | null
  accommodation_address?: string | null
  // 확장된 현장 정보
  work_process?: string | null // 작업공정 (예: 슬라브 타설, 철근 배근 등)
  work_section?: string | null // 작업구간 (예: 지하 1층, B동 3층 등)
  component_name?: string | null // 부재명 (예: 기둥 C1-C5 구간)
  manager_name?: string | null // 건축 담당자 이름
  safety_manager_name?: string | null // 안전 담당자 이름
  status?: SiteStatus | null
  start_date: string
  end_date?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

// 현장 배정 역할
export type SiteAssignmentRole = 'worker' | 'site_manager' | 'supervisor'

// 현장 배정
export interface SiteAssignment {
  id: string
  site_id: string
  user_id: string
  assigned_date: string
  unassigned_date?: string | null
  role?: SiteAssignmentRole | null
  is_active: boolean
  created_at: string
  updated_at: string
  // 조인된 정보
  site?: Site
  profile?: Profile
}

// 현재 사용자 현장 정보 (DB 함수 반환 타입)
export interface CurrentUserSite {
  site_id: string
  site_name: string
  site_address: string
  work_process?: string | null
  work_section?: string | null
  component_name?: string | null
  manager_name?: string | null
  construction_manager_phone?: string | null
  safety_manager_name?: string | null
  safety_manager_phone?: string | null
  accommodation_name?: string | null
  accommodation_address?: string | null
  assigned_date: string
  user_role: SiteAssignmentRole
  site_status: SiteStatus
  start_date: string
  end_date?: string | null
  // Document fields
  ptw_document_id?: string | null
  ptw_document_title?: string | null
  ptw_document_url?: string | null
  ptw_document_filename?: string | null
  ptw_document_mime_type?: string | null
  blueprint_document_id?: string | null
  blueprint_document_title?: string | null
  blueprint_document_url?: string | null
  blueprint_document_filename?: string | null
  blueprint_document_mime_type?: string | null
}

// 사용자 현장 이력 (DB 함수 반환 타입)
export interface UserSiteHistory {
  site_id: string
  site_name: string
  site_address: string
  work_process?: string | null
  work_section?: string | null
  assigned_date: string
  unassigned_date?: string | null
  user_role: SiteAssignmentRole
  site_status: SiteStatus
  start_date: string
  end_date?: string | null
  is_active: boolean
}

// 작업일지 상태
export type DailyReportStatus = 'draft' | 'submitted'

// 작업일지
export interface DailyReport {
  id: string
  site_id?: string | null
  work_date: string
  member_name: string // 부재명 (슬라브, 거더, 기둥, 기타)
  process_type: string // 공정 (균열, 면, 마감, 기타)
  total_workers?: number | null
  npc1000_incoming?: number | null
  npc1000_used?: number | null
  npc1000_remaining?: number | null
  issues?: string | null
  status?: DailyReportStatus | null
  created_by?: string | null
  approved_by?: string | null
  approved_at?: string | null
  created_at: string
  updated_at: string
  // Join된 데이터
  site?: {
    id: string
    name: string
  } | null
}

// 작업자별 공수
export interface DailyReportWorker {
  id: string
  daily_report_id?: string | null
  worker_name: string
  work_hours: number
  created_at: string
}

// 출근 상태
export type AttendanceStatus = 'present' | 'absent' | 'holiday' | 'sick_leave' | 'vacation'

// 출근 기록
export interface AttendanceRecord {
  id: string
  user_id?: string | null
  site_id?: string | null
  work_date: string
  date?: string // Added for client compatibility (same as work_date)
  check_in_time?: string | null
  check_out_time?: string | null
  work_hours?: number | null
  overtime_hours?: number | null
  labor_hours?: number | null // 공수 (1.0 = 8 hours)
  status?: AttendanceStatus | null
  notes?: string | null
  created_at: string
  updated_at: string
  // Joined fields from server actions
  sites?: {
    id: string
    name: string
  } | null
  site_name?: string // Computed field for display
}

// 문서 타입
export type DocumentType = 'personal' | 'shared' | 'blueprint' | 'report' | 'certificate' | 'other'

// 사이트 문서 타입 (새로운 site_documents 테이블용)
export type SiteDocumentType = 'ptw' | 'blueprint' | 'other'

// 문서
export interface Document {
  id: string
  title: string
  description?: string | null
  file_url: string
  file_name: string
  file_size?: number | null
  mime_type?: string | null
  document_type?: DocumentType | null
  folder_path?: string | null
  owner_id?: string | null
  is_public?: boolean | null
  site_id?: string | null
  created_at: string
  updated_at: string
}

// 알림 타입
export type NotificationType = 'info' | 'warning' | 'error' | 'success'

// 알림
export interface Notification {
  id: string
  user_id?: string | null
  title: string
  message: string
  type?: NotificationType | null
  is_read?: boolean | null
  read_at?: string | null
  action_url?: string | null
  created_at: string
}

// 공지사항 우선순위
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'

// 공지사항
export interface Announcement {
  id: string
  title: string
  content: string
  priority?: AnnouncementPriority | null
  target_roles?: UserRole[] | null
  target_sites?: string[] | null
  is_active?: boolean | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

// 승인 요청 타입
export type ApprovalRequestType = 'daily_report' | 'document' | 'leave' | 'expense' | 'other'

// 승인 상태
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// 승인 요청
export interface ApprovalRequest {
  id: string
  request_type: ApprovalRequestType
  entity_id: string
  requested_by?: string | null
  approved_by?: string | null
  status?: ApprovalStatus | null
  comments?: string | null
  requested_at: string
  processed_at?: string | null
  created_at: string
}

// Export all construction-specific types
export * from './construction'

// 마킹 도면 문서
export interface MarkupDocument {
  id: string
  title: string
  description?: string
  original_blueprint_url: string
  original_blueprint_filename: string
  markup_data: any[] // MarkupObject[] from markup types
  preview_image_url?: string
  location: 'personal' | 'shared'
  created_by: string
  created_at: string
  updated_at: string
  site_id?: string
  is_deleted: boolean
  file_size: number
  markup_count: number
}

// 마킹 도면 권한
export interface MarkupDocumentPermission {
  id: string
  document_id: string
  user_id: string
  permission_type: 'view' | 'edit' | 'admin'
  granted_by: string
  granted_at: string
  expires_at?: string
}

// 일반 문서 공유 권한
export interface DocumentPermission {
  id: string
  document_id: string
  user_id: string
  permission_type: 'view' | 'edit' | 'admin'
  granted_by: string
  granted_at: string
  expires_at?: string
}

// 현장 문서 (새로운 site_documents 테이블)
export interface SiteDocument {
  id: string
  site_id: string
  document_type: SiteDocumentType
  file_name: string
  file_url: string
  file_size?: number | null
  mime_type?: string | null
  uploaded_by?: string | null
  is_active: boolean
  version: number
  notes?: string | null
  created_at: string
  updated_at: string
  // 조인된 정보
  site?: {
    id: string
    name: string
  } | null
  uploader?: {
    id: string
    full_name: string
    email: string
  } | null
}

// 빠른 작업
export interface QuickAction {
  id: string
  title: string
  description?: string
  icon_name: string
  link_url: string
  is_active: boolean
  display_order: number
  created_by?: string
  created_at: string
  updated_at: string
}

// Export module-specific types
export * from './attendance'
export * from './daily-reports'
export * from './documents'
export * from './materials'
export * from './site-info'