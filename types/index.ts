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
  status?: SiteStatus | null
  start_date: string
  end_date?: string | null
  created_at: string
  updated_at: string
  created_by?: string | null
}

// 작업일지 상태
export type DailyReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

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
  check_in_time?: string | null
  check_out_time?: string | null
  work_hours?: number | null
  overtime_hours?: number | null
  status?: AttendanceStatus | null
  notes?: string | null
  created_at: string
  updated_at: string
}

// 문서 타입
export type DocumentType = 'personal' | 'shared' | 'blueprint' | 'report' | 'certificate' | 'other'

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