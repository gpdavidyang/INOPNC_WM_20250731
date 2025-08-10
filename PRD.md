# INOPNC Work Management System - Product Requirements Document

## Executive Summary

INOPNC Work Management System (INOPNC WMS) is a comprehensive construction project management platform designed specifically for INOPNC and its partner organizations. Built with Next.js 14 and Supabase, the system provides role-based access control, real-time data management, and comprehensive construction workflow support from daily operations to material management.

The system serves multiple user types including construction workers, site managers, customer partners, and administrators, providing each with tailored functionality while maintaining data security through row-level security policies.

## Product Overview

### Vision
To digitize and streamline construction project management processes, enabling efficient collaboration between INOPNC, subcontractors, and customers while maintaining strict data security and compliance standards.

### Mission
Provide a unified platform that eliminates paper-based workflows, improves data accuracy, enhances communication, and enables real-time project visibility across all stakeholders.

### Core Value Propositions
- **Unified Data Management**: Single source of truth for all project information
- **Role-Based Access Control**: Secure, permission-based access to relevant data
- **Real-Time Collaboration**: Instant updates and notifications across teams
- **Mobile-First Design**: Optimized for field use on various devices
- **Compliance Ready**: Built-in audit trails and approval workflows

## Target Users and Personas

### Primary Users

#### 1. Construction Workers (작업자)
**Profile**: Front-line construction workers
**Primary Needs**:
- Submit daily work reports
- Record attendance and working hours
- View project information and schedules
- Access personal documents and certifications

**System Access**:
- Daily report creation and submission
- Personal attendance records
- Site information viewing
- Document management (personal files)

#### 2. Site Managers (현장관리자)
**Profile**: On-site supervisors and project managers
**Primary Needs**:
- Oversee daily operations and worker activities
- Approve work reports and timesheets
- Manage material requests and inventory
- Coordinate with subcontractors and partners

**System Access**:
- Full daily report management
- Worker attendance oversight
- Material management
- Partner and subcontractor coordination

#### 3. Customer Managers (파트너사)
**Profile**: External partner company representatives
**Primary Needs**:
- Monitor project progress
- Access relevant project documentation
- Coordinate with INOPNC teams

**System Access**:
- Project progress visibility
- Shared document access
- Limited administrative functions

#### 4. Organization Administrators (관리자)
**Profile**: INOPNC internal administrators
**Primary Needs**:
- Manage user accounts and permissions
- Oversee multiple projects and sites
- Generate reports and analytics
- Configure system settings

**System Access**:
- User and organization management
- Cross-project visibility
- System configuration and settings

#### 5. System Administrators (시스템관리자)
**Profile**: Technical administrators with full system access
**Primary Needs**:
- System maintenance and configuration
- Cross-organization data access
- Technical troubleshooting
- System monitoring and optimization

**System Access**:
- Full system administration
- Cross-organization access
- Technical configuration
- System monitoring and maintenance

## Core Features

### 1. Authentication and User Management

#### 1.1 Supabase-Based Authentication
- **Email/Password Authentication**: Secure login with password validation
- **Session Management**: Automatic session refresh and persistence
- **Password Reset**: Self-service password reset with email verification
- **Multi-Organization Support**: Users can belong to multiple organizations

#### 1.2 Profile Management
- **Automatic Profile Creation**: Profiles created on first login with role detection
- **Role-Based Access**: Five distinct user roles with granular permissions
- **Organization Assignment**: Users automatically assigned to appropriate organizations
- **Site Assignment**: Workers and managers assigned to specific construction sites

#### 1.3 Security Features
- **Row Level Security (RLS)**: Database-level security ensuring data isolation with hierarchical permissions
- **Cookie-Based Sessions**: Secure session management with HTTP-only cookies
- **Middleware Protection**: Route-level authentication checks
- **Audit Logging**: Login/logout events tracked for security monitoring
- **Infinite Recursion Prevention**: Special RLS patterns to prevent circular references in policies
- **Site-based Data Isolation**: Complete separation between different construction sites

### 2. Dashboard System

#### 2.1 Role-Based Dashboard
- **Personalized Home View**: Welcome message with role-specific quick actions
- **Statistics Cards**: Real-time metrics relevant to user role
- **Quick Actions**: One-click access to common tasks
- **Recent Activity Feed**: Latest system activities and notifications
- **Daily Report Button**: Prominent "작업일지 작성" button for workers, site managers, and partners
- **Quick Menu Section**: 
  - 2-column grid layout (2x1, 2x2, 2x3 expandable)
  - Customizable menu items (add/remove functionality)
  - Default items: 출근현황, 작업일지, 현장정보, 문서함
- **Today's Site Info**: Collapsible section with:
  - Site address: Full address with copy icon and T맵 navigation icon
  - Accommodation address: Full address with copy icon and T맵 navigation icon
  - Manager contacts (displayed first):
    - Construction manager: Name, title, phone with copy and call icons
    - Safety manager: Name, title, phone with copy and call icons
  - Divider line (구분선)
  - Work details:
    - 부재명 (Member name): e.g., 슬라브, 기둥, 거더
    - 작업공정 (Work process): e.g., 철근, 거푸집, 콘크리트
    - 작업구간 (Work section): e.g., 3층 A구역
  - 현장 공도면 (Site blueprint): Map icon with preview button for technical drawings
  - PTW (작업허가서): Document icon with preview button for work permit
- **Announcements**: Collapsible section for headquarters notices

#### 2.2 Navigation System

##### Desktop Navigation (Enhanced - 2025-08-03)
- **Responsive Sidebar**: Collapsible navigation with role-filtered menu items
  - General users (worker, site_manager, customer_manager): 홈, 출력현황, 작업일지, 현장정보, 내문서함, 공유문서함, **도면 마킹 도구** ✅, 내정보
  - Admin users: 홈, 현장 관리, 사용자 관리, 공유 문서함 관리, 급여 관리, NPC-1000 자재 관리, **도면 마킹 관리** ✅, 그 외 관리자 메뉴, 시스템 관리, 내정보
- **URL-Based Tab Management**: Dynamic activeTab detection based on current pathname
  - Automatic tab activation when navigating via direct URLs
  - Support for browser back/forward navigation
  - Persistent tab state across page refreshes
- **Tab-Based Content**: Clean organization of functional areas
- **Breadcrumb Navigation**: Clear navigation hierarchy
- **Enhanced Accessibility** (2025-08-03):
  - Replaced `aria-hidden` with `inert` attribute for proper focus management
  - Mobile sidebar prevents focus on hidden elements when closed
  - Improved screen reader support with semantic navigation landmarks

##### Mobile Navigation - Bottom Navigation Bar (Updated 2025-08-04)
**Purpose**: Fixed bottom navigation for mobile devices providing quick access to primary functions

**Menu Configuration**:
| 순서 | 메뉴명 | 아이콘 | 동작 설명 |
|------|--------|--------|-----------|
| 1 | 홈(빠른메뉴) | Home | 홈 화면으로 이동, 빠른메뉴 섹션 표시 |
| 2 | 출력현황 | Calendar | 출력현황 메뉴로 직접 이동 |
| 3 | 작업일지 | FileText | 작업일지 목록 화면으로 이동 |
| 4 | 문서함 | FolderOpen | 통합 문서함 메뉴로 직접 이동 |
| 5 | 내정보 | User | 사용자 프로필 정보 화면으로 이동 |

**Design Specifications**:
- **Layout**: 5개 메뉴 균등 배치, 중앙 정렬
- **Height**: iOS 56px (Safe Area 제외), Android 48px
- **Background**: 기본 흰색 (#FFFFFF), 다크모드 대응
- **Icons**: 24x24px, Outline/Filled 스타일
- **Labels**: 10px 폰트, 아이콘 하단 4px 간격
- **Colors**:
  - 비활성: #666666
  - 활성: Primary Color (#007AFF 또는 브랜드 컬러)

**Special Features**:
- **Safe Area Support**: iOS Home Indicator와 충돌 방지
- **Touch Optimization**: 44x44px 최소 터치 영역
- **Accessibility**: 스크린 리더 지원, 키보드 네비게이션
- **Responsive**: 세로/가로 모드, 태블릿, 폴더블 디바이스 대응

#### 2.3 Statistics and Metrics
- **Daily Reports Count**: Today's submitted work reports
- **Pending Approvals**: Reports awaiting manager approval
- **Active Workers**: Current workforce statistics
- **Notification Count**: Unread alerts and messages

### 3. Daily Work Report Management

#### 3.1 Report Creation and Submission
- **Structured Forms**: Standardized daily report templates
- **Site Selection**: Choose from assigned construction sites
- **Work Details**: Record work type, location, and activities
- **Material Usage**: Track NPC-1000 materials (incoming, used, remaining)
- **Worker Count**: Record number of workers involved
- **Issue Reporting**: Document problems and challenges encountered

#### 3.2 Approval Workflow
- **Status Tracking**: Draft → Submitted → Approved/Rejected
- **Manager Review**: Site managers can approve or reject reports
- **Approval Comments**: Feedback mechanism for rejected reports
- **Audit Trail**: Complete history of report changes and approvals

#### 3.3 Report Viewing and Management  
- **작업일지 작성 Button**: Button to create new daily report
- **Report List Table**:
  - Title Format: 소속약어 + 현장약어 + 부재명 (e.g., "INO_강남A_슬라브")
  - Date: Report creation date (YYYY-MM-DD format)
  - Status: 임시저장 (draft) or 작성완료 (completed)
- **Sorting Options**: Sort by title, date, or status
- **List View**: Paginated list of all reports with filtering
- **Detail View**: Comprehensive report information with edit capabilities
- **Status Filtering**: Filter reports by approval status
- **Date Range Filtering**: View reports for specific time periods
- **Access Restriction**: Users can only view and edit their own reports

## 작업일지 시스템 상세 요구사항

### 개요
작업일지는 INOPNC 작업 관리 시스템의 핵심 기능으로, 건설 현장의 일일 작업 내용을 체계적으로 기록하고 관리하는 디지털 솔루션입니다. 기존의 수기 작성 방식에서 벗어나 실시간 데이터 입력, 자동화된 승인 프로세스, 통합 보고서 생성을 통해 현장 관리의 효율성을 극대화합니다.

### 작업일지 작성 화면 구성

#### 1. 헤더 영역
- **소속정보**: 작업자의 소속 조직 정보 표시
- **현장 선택**: 드롭다운으로 작업자가 배정된 현장 선택
- **작업 날짜**: 날짜 선택기 (기본값: 오늘 날짜)
- **작성자 정보**: 자동 입력 (로그인 사용자 정보)

#### 2. 현장 정보 (접기/펼치기 가능)
- 선택된 현장의 상세 정보 표시

#### 3. 작업 내용 입력 (접기/펼치기 가능)
- **부재명** (필수): 드롭다운 선택
  - 옵션: 슬라브, 거더, 기둥, 기타
  - 기타 선택 시 텍스트 입력 필드 제공
- **작업공정** (필수): 드롭다운 선택
  - 옵션: 균열, 면, 마감, 기타
  - 기타 선택 시 텍스트 입력 필드 제공
- **작업 구간**: 텍스트 입력 필드

#### 4. 작업자 입력 (접기/펼치기 가능)
- **작업자명**: 본사가 현장에 배정한 작업자 중 다중 선택 가능
- **공수**: 각 배정된 작업자별로 공수 입력
  - 선택 옵션: 0.0, 1.0, 1.5, 2.0, 2.5, 3.0
  - 1.0은 8시간 근무를 의미

#### 5. 사진 업로드 (접기/펼치기 가능)
- **작업전 사진**
  - 최대 30개 사진 업로드 가능
  - 각 사진당 최대 10MB
  - 업로드 방법: 갤러리 선택, 카메라 촬영, 파일 직접 선택
- **작업후 사진**
  - 최대 30개 사진 업로드 가능
  - 각 사진당 최대 10MB
  - 업로드 방법: 갤러리 선택, 카메라 촬영, 파일 직접 선택
- **사진 삭제 기능**: 업로드된 사진을 삭제할 수 있는 기능

#### 6. 영수증 첨부 (접기/펼치기 가능)
- **구분**: 영수증 구분 선택
- **금액**: 영수증 금액 입력
- **일자**: 영수증 발행 날짜
- **파일첨부**: 영수증 이미지/파일 첨부

#### 7. 진행 도면 업로드 (접기/펼치기 가능) ✅ **구현완료**
- 별도 화면의 '도면 마킹 도구'에서 생성된 마킹 도면 첨부
- 자재구간, 작업완료, 작업진행 등이 표기된 도면 파일 선택 및 첨부
- **구현 상태**: Canvas 기반 도면 마킹 시스템 완전 구현
  - HTML5 Canvas 기반 고성능 그리기 도구
  - 박스 마킹 (회색/빨간/파란), 텍스트, 펜 도구
  - 완전한 문서 관리 시스템 (저장/불러오기/목록/삭제)
  - 반응형 모바일/데스크톱 지원

#### 8. 본사에게 요청 (접기/펼치기 가능)
- **요청 내용**: 본사에게 요청하고 싶은 사항을 텍스트로 작성
- **파일 첨부**: 요청 관련 파일 첨부 기능
- 본사 화면에서 이 정보를 취합하여 볼 수 있는 기능 제공

#### 9. NPC-1000 자재관리 (접기/펼치기 가능)
- **입고량**: 자재 입고 수량 입력
- **사용량**: 자재 사용 수량 입력
- **재고량**: 현재 재고 수량 입력
- 본사 담당자가 현장별 재고 부족 여부를 판단하여 추가 생산 및 배송 결정 지원

#### 10. 특이사항 (접기/펼치기 가능)
- **텍스트 입력**: 특이사항을 자유 텍스트로 입력할 수 있는 기능

#### 11. 하단 액션 영역
- **임시 저장**: 작성 중인 내용 임시 저장
- **제출(저장)**: 작업일지 제출 및 저장

**참고: 헤더 영역과 하단 액션 영역을 제외한 모든 섹션(2-10)은 접기/펼치기 기능을 지원하여 사용자가 필요한 섹션만 열어서 작업할 수 있도록 함**

### 사용자 경험 (UX) 요구사항

#### 1. 반응형 디자인
- **데스크톱 뷰**: 2컬럼 레이아웃 (좌측: 입력, 우측: 미리보기)
- **태블릿 뷰**: 탭 형식으로 섹션 구분
- **모바일 뷰**: 단일 컬럼, 스크롤 기반 네비게이션

#### 2. 입력 편의성
- **자동 완성**: 자주 사용하는 데이터 자동 완성
- **입력 검증**: 실시간 유효성 검사 및 오류 메시지
- **진행 상태 표시**: 작성 완료율 표시 (프로그레스 바)
- **단축키 지원**: Tab 키 네비게이션, Ctrl+S 임시저장
- **섹션 접기/펼치기**: 
  - 각 섹션 헤더 클릭으로 접기/펼치기 토글
  - 모두 펼치기/모두 접기 버튼 제공
  - 사용자 선호도 저장 (마지막 상태 기억)
  - 필수 입력 섹션은 기본적으로 펼쳐진 상태

#### 3. 데이터 연동
- **이전 일지 참조**: 최근 3일간 일지 빠른 참조
- **마스터 데이터 연동**: 인력, 자재, 장비 정보 실시간 연동
- **일정 연동**: 프로젝트 일정과 연계된 작업 정보
- **날씨 정보**: 작업일 날씨 자동 기록

### 기능 요구사항

#### 1. 작성 프로세스
- **단계별 작성**: 필수 항목 우선 입력 후 선택 항목
- **자동 저장**: 5분마다 자동 임시 저장
- **작성 시간 추적**: 작성 시작/종료 시간 자동 기록
- **중복 방지**: 동일 날짜/현장 중복 작성 방지

#### 2. 검증 및 승인
- **필수 항목 검증**: 제출 전 필수 항목 입력 확인
- **자동 알림**: 제출 시 승인권자에게 즉시 알림
- **승인 프로세스**: 
  - 1차: 현장 관리자
  - 2차: 본사 담당자 (필요시)
- **반려 처리**: 반려 사유 명시 및 수정 요청

#### 3. 데이터 활용
- **일일 보고서 생성**: 작업일지 기반 자동 보고서
- **주간/월간 집계**: 기간별 작업 실적 자동 집계
- **KPI 대시보드**: 진척률, 인력 투입률 등 실시간 표시
- **검색 및 필터링**: 다양한 조건으로 일지 검색

### 기술 요구사항

#### 1. 성능 요구사항
- **페이지 로딩**: 3초 이내 (3G 네트워크 기준)
- **자동 저장**: 백그라운드 처리로 UX 영향 최소화
- **파일 업로드**: 청크 업로드로 대용량 파일 처리
- **동시 사용자**: 현장당 50명 동시 작성 지원

#### 2. 보안 요구사항
- **접근 권한**: 역할 기반 작성/조회 권한 관리
- **데이터 암호화**: 전송 구간 및 저장 데이터 암호화
- **감사 로그**: 모든 작성/수정/삭제 이력 추적
- **세션 관리**: 30분 미활동시 자동 로그아웃

#### 3. 통합 요구사항
- **ERP 연동**: 인력, 자재 정보 실시간 동기화
- **모바일 앱**: 네이티브 앱과 데이터 동기화
- **외부 시스템**: RESTful API를 통한 데이터 제공
- **보고서 시스템**: 작업일지 데이터 자동 연계

### 모바일 특화 기능

#### 1. 하단 네비게이션 바 (Bottom Navigation Bar)
**Fixed bottom navigation providing instant access to essential functions**

##### 1.1 Interaction Design
- **터치 피드백**: 
  - Android: Material Design 리플 효과
  - iOS: 배경색 하이라이트 변화
  - 지속 시간: 200ms
- **활성 상태 표시**:
  - 아이콘 및 레이블 컬러 변경
  - 선택적 연한 배경색 추가
  - 상단/하단 2px 인디케이터 (선택적)
- **전환 애니메이션**:
  - 터치 시 95% 스케일 다운
  - 페이드 인/아웃 효과 (300ms)

##### 1.2 플랫폼별 대응
**iOS 특화**:
- Safe Area 대응: iPhone X 이상 34px 추가 여백
- Home Indicator 충돌 방지
- 스와이프 제스처와의 충돌 방지

**Android 특화**:
- 시스템 네비게이션 구분 (3버튼/제스처)
- 뒤로 가기 버튼 연동
- MaterialYou 테마 대응

##### 1.3 성능 최적화
- **렌더링**: 하드웨어 가속 활용
- **메모리**: 아이콘 캐싱 시스템
- **애니메이션**: 60fps 유지 보장
- **터치 응답**: 즉각적인 피드백 (<16ms)

#### 2. 오프라인 모드
- **로컬 저장**: 네트워크 없이 작성 가능
- **자동 동기화**: 네트워크 연결시 자동 업로드
- **충돌 해결**: 버전 관리 및 병합 기능

#### 3. 모바일 최적화
- **터치 UI**: 손가락 터치에 최적화된 입력 필드
- **음성 입력**: 작업 내용 음성 입력 지원
- **제스처**: 스와이프로 섹션 이동
- **카메라 연동**: 즉시 사진 촬영 및 첨부

#### 4. 위치 기반 서비스
- **GPS 태깅**: 작성 위치 자동 기록
- **현장 인식**: GPS 기반 현장 자동 선택
- **출퇴근 연동**: 작업일지 작성과 출퇴근 기록 연계

#### 5. 모바일 접근성
- **터치 영역**: Apple HIG 기준 44x44px 최소 크기 보장
- **스크린 리더**: 전체 내비게이션 요소에 대한 접근성 레이블
- **키보드 네비게이션**: Tab키를 통한 순차적 접근 지원
- **다크모드**: 시스템 설정 자동 감지 및 대응
- **폰트 크기**: 시스템 폰트 크기 설정 반영

### 4. Attendance and Time Management (출력현황)

#### 4.1 Worker/Site Manager View (A2, B2)
##### Attendance Info Tab
- **Site Selection**: Dropdown menu for site selection (single select only)
- **Calendar Function**: 
  - Year and month selection controls
  - Default shows current month
  - Displays sites where user registered daily reports (site abbreviations)
  - Shows data registered through daily reports
  - Shows assignments scheduled by headquarters
- **Site Summary Below Calendar**:
  - Site name and abbreviation
  - Location and project period
  - Additional site information

##### Salary Info Tab (Enhanced - 2025-08-03)
- **Compact Table View**: Monthly salary overview in optimized table format
  - Columns: Month, Site, Work Days, Basic Salary, Overtime Pay, Total Pay, PDF Download
  - Simplified monetary units (만원) for better readability
  - Site names abbreviated for compact display
- **Detailed Calculation Formula**: Interactive calculation breakdown below table
  - **Step-by-step calculation**: Basic salary + Overtime + Allowances - Deductions = Total
  - **Work-based analysis**: Daily/hourly average calculations
  - **Visual formula presentation**: Color-coded calculation steps with clear mathematical flow
- **Monthly Detail Section**: 
  - Most recent month's detailed breakdown
  - All salary components with full amounts
  - Enhanced visual design with proper spacing and typography
- **Payslip Download**: Direct PDF download from table rows
- **Access Restriction**: Users can only view their own attendance and salary information
- **Mobile Optimization**: Responsive design with horizontal scrolling for table

#### 4.2 Partner Company View (C2)
##### Attendance Info Tab
- **Site Selection**: Select specific sites to view
- **Total Working Days**: View total days worked by all company workers
- **Total Work Hours**: View total work hours (공수) across all workers

##### Salary Info Tab
- **Site-based Salary Overview**: Salary status by construction site
- **Worker-based Salary Overview**: Salary status by individual worker  
- **Access Restriction**: Can only view data for their own company's workers

#### 4.3 Terminology
- **출력**: Work attendance history
- **공수**: Worker hours or days invested in work

### 5. Document Management System

#### 5.1 My Documents (내문서함) - A5, B5
##### Document Categories
- **Personal Salary Statements**: 개인 급여 명세서
- **Daily Report Backups**: 작업일지 (백업)  
- **Contracts/Agreements**: 계약서/협약서
- **Certificates/Licenses**: 자격증/수료증
- **Safety Education Certificates**: 안전교육 이수증
- **Other Personal Documents**: 기타 개인 문서

##### Document Management Features
- **Search Functions**: Search by document name, author, or date
- **Filtering**: Filter by category or time period
- **Sorting**: Sort by latest, name, or file size
- **Upload Methods**: 
  - File selection or drag & drop
  - Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX
  - Maximum file size: 10MB per file
- **Download Options**: Individual or bulk download
- **Delete Function**: Users can only delete their own uploaded documents
- **Preview Support**: PDF and image file preview capabilities
- **Storage Limit**: 1GB per user with remaining capacity display

#### 5.2 Shared Documents (공유문서함) - All Users
##### Document Categories with Access Control
- **Safety Documents** (안전보건 문서):
  - Access: All users can view
  - Upload: Admin only
  - Content: Safety education materials, MSDS, safety rules, emergency manuals
- **Construction Standards/Manuals** (시공 표준/매뉴얼):
  - Access: Workers, site managers, partners can view
  - Upload: Admin and site managers only
  - Content: Standard specifications, work manuals, quality standards
- **Company Regulations/Notices** (회사 규정/공지):
  - Access: All users can view
  - Upload: Admin only
  - Content: Employment rules, service regulations, announcements
- **Education Materials** (교육 자료):
  - Access: All users can view
  - Upload: Admin and trainers only
  - Content: Technical education, safety education, quality education materials
- **Drawings/Design Documents** (도면/설계 문서):
  - Access: Only related site personnel
  - Upload: Admin and site managers only
  - Content: Architectural, structural, equipment, and construction detail drawings

##### Features
- **Search**: Integrated and category-specific search
- **Filters**: Document type, upload date, site-specific
- **Downloads**: Permission-based download access
- **Favorites**: Bookmark frequently used documents
- **Version Control**: Document version history with latest version display
- **Notifications**: Alerts for new documents, important notices, and updates

### 6. Site and Project Information (현장정보)

#### 6.1 Today's Site Information ✅ **Updated 2025-08-04**
##### Display Order
1. **Site Address Section**
2. **Accommodation Address Section** (if exists)
3. **Manager Contacts Section** (displayed first after addresses)
4. **Divider Line** (구분선)
5. **Work Details Section**
6. **Site Blueprint Section** (현장 공도면)
7. **PTW Document Section**

##### Site Address Section
- **Components**:
  - Full address display
  - Copy icon for clipboard copy
  - T-Map navigation link icon
- **Functions**:
  - Address copy: Copy address to clipboard
  - T-Map link: Launch T-Map app for navigation

##### Accommodation Address Section
- **Components**:
  - Full address display
  - Copy icon for clipboard copy  
  - T-Map navigation link icon
- **Functions**:
  - Address copy: Copy address to clipboard
  - T-Map link: Launch T-Map app for navigation

##### Manager Contacts Section (Moved Up)
- **Construction Manager** (건축관리자):
  - Name and title display
  - Phone number
  - Copy icon for number copy
  - Phone icon for direct calling
- **Safety Manager** (안전관리자):
  - Name and title display
  - Phone number
  - Copy icon for number copy
  - Phone icon for direct calling

##### Work Details Section
- **Display Information** (no icons):
  - 부재명 (Member name): e.g., 슬라브, 기둥, 거더
  - 작업공정 (Work process): e.g., 철근, 거푸집, 콘크리트
  - 작업구간 정보 (Work section): e.g., 3층 A구역

##### Site Blueprint Section ✅ **New Location**
- **Title**: "현장 공도면"
- **Components**:
  - Map icon with blueprint label
  - Preview button with eye icon
- **Modal Features**:
  - Blueprint image display
  - Site construction drawings
  - Download functionality for blueprint files
  - Mobile-optimized modal with slide-up animation

##### PTW Document Section ✅
- **Location**: Bottom of Today's Site Info
- **Components**:
  - Document type label: "PTW (작업허가서)"
  - Preview button with eye icon
- **Modal Features**:
  - PTW document information display
  - Auto-generated document number: PTW-2025-[site-id]
  - Work location, date, content, and worker information
  - PDF preview in iframe
  - Download functionality for PTW documents
- **Mobile Optimization**:
  - Bottom sheet style modal for mobile
  - Full-width buttons for easy touch
  - Proper z-index to avoid NavBar overlap

##### UI/UX Enhancements ✅
- **Modal Design**:
  - Responsive modals with mobile-first approach
  - Slide-up animation on mobile devices
  - Center positioning on desktop
  - Dark mode support
  - Smooth transitions and hover effects
- **File Integration**:
  - Blueprint image: `/docs/샘플도면5.png`
  - PTW document: `/docs/[양식]PTW양식_이노피앤씨.pdf`
- **Accessibility**:
  - Touch-friendly button sizes
  - Clear visual feedback
  - Proper contrast ratios

### 6A. Blueprint Markup Management System (도면 마킹 관리 시스템) ✅ **구현완료**

#### 6A.1 System Overview
A comprehensive Canvas-based blueprint markup and document management system designed for construction drawing annotation and collaboration.

##### Key Features ✅
- **HTML5 Canvas Drawing**: High-performance drawing interface optimized for construction blueprints
- **Dual-View Architecture**: Seamless navigation between document library and markup editor
- **Complete Document Lifecycle**: Upload, edit, save, organize, and delete markup documents
- **Multi-Tool Support**: Box markings (3 colors), text annotations, pen drawing, and selection tools
- **Professional Shortcuts**: Full keyboard shortcut support for power users
- **Responsive Design**: Optimized for both mobile field use and desktop office work

##### Recent UI/UX Improvements (2025-08-04) ✅
- **완벽한 다크모드 지원**: 업로드 화면, 에디터, 문서 목록 모두 다크 테마 적용
- **2행 도구 팔레트 레이아웃**: 모바일에서 모든 도구를 효율적으로 표시
  - 1행: 선택, 자재구간(회색), 작업진행(빨강) + Undo/Redo
  - 2행: 작업완료(파랑), 텍스트, 펜 + Delete
- **향상된 가독성 및 디자인**:
  - 48x48px 터치 타겟으로 모바일 사용성 개선
  - 아이콘 크기 6x6으로 확대
  - 박스 도구는 채워진 색상 사각형으로 표시
  - 그라디언트 효과와 그림자로 깊이감 추가
  - rounded-xl로 현대적인 디자인 적용
- **액션 버튼 차별화**:
  - Undo/Redo: 회색 그라디언트 배경
  - Delete: 빨간색 테마로 위험 액션 표시

#### 6A.2 Document Management Interface ✅

##### Document Library View (Default Landing)
- **Grid Layout**: Visual document cards with thumbnails and metadata
- **Smart Search**: Real-time search by document title and description
- **Category Filtering**: Personal documents vs. shared site documents
- **Pagination**: Efficient handling of large document collections
- **Quick Actions**: One-click open, edit, or delete operations
- **Document Metadata**: Creation date, markup count, file information

#### 6A.3 Markup Editor Interface ✅

##### Blueprint Upload System
- **Drag & Drop Support**: Intuitive file upload with visual feedback
- **File Format Support**: JPG, PNG, PDF with automatic processing
- **Upload States**: Clear visual indicators for drag-over and processing states

##### Drawing Tools and Interface
- **Tool Palette Layout**:
  - Desktop: Left sidebar with icon-based tools
  - Mobile: Bottom toolbar with optimized touch targets
- **Available Tools**:
  - 회색 박스: General area marking
  - 빨간 박스: Problem/attention area marking  
  - 파란 박스: Completed/confirmed area marking
  - 텍스트 도구: Text annotation placement
  - 펜 도구: Freehand drawing
  - 선택 도구: Object selection and manipulation

##### Canvas Functionality
- **High-Performance Rendering**: Optimized Canvas implementation for smooth drawing
- **Zoom and Pan**: Ctrl+scroll wheel zoom, drag-to-pan navigation
- **Precision Drawing**: Accurate mouse and touch input handling
- **Object Manipulation**: Select, move, and modify existing markup objects

#### 6A.4 Technical Implementation ✅

##### Database Schema
```sql
markup_documents (
  id, title, description, original_blueprint_url,
  markup_data JSONB, location ('personal'|'shared'),
  created_by, site_id, markup_count, created_at, updated_at
)
```

##### API Endpoints
- `GET /api/markup-documents` - List with pagination, search, filters
- `POST /api/markup-documents` - Create new markup document
- `GET /api/markup-documents/[id]` - Retrieve specific document
- `PUT /api/markup-documents/[id]` - Update existing document
- `DELETE /api/markup-documents/[id]` - Soft delete document

#### 6.2 Site Search Functions
##### Search Filters
1. **Site Name Search**
   - Input type: Text field
   - Auto-complete functionality
   - Partial search support
   
2. **Regional Search**
   - Input type: Dropdown selection
   - Hierarchical structure: Province/City → District/County
   - Multiple selection capability
   
3. **Worker Name Search**
   - Input type: Text field
   - Auto-complete functionality
   - Search by name or ID
   
4. **Date Range Search**
   - Input type: Date range picker
   - Start date ~ End date
   - Quick selection options: This week, This month, Last 3 months

##### Search Results Display
- **List Format**:
  - Site name
  - Site address
  - Construction period
  - Current progress percentage
  - Number of participants
- **Sorting Options**:
  - By site name
  - By distance (from current location)
  - By start date
  - By progress percentage

##### Access Control
- **View Permission**: All users (A4, B4, C4) can view site information
- **Restrictions**:
  - Workers (A4): Only sites they participate in
  - Site Managers (B4): Only sites they manage
  - Partners (C4): Only contracted sites

#### 6.3 UI/UX Guidelines for Site Information

##### Layout Design
###### Today's Site Section
- **Card Format**: Group information in card-style containers
- **Clear Separation**: Visual distinction between sections
- **Collapsible Sections**: Expand/collapse functionality (optional)

###### Site Search Section
- **Search Filters**: Positioned at the top
- **Search Results**: Displayed below filters
- **Scrolling**: Infinite scroll or pagination for results

##### Icons and Action Buttons
###### Icon Styling
- **Intuitive Icons**: Use recognizable icons for actions
- **Touch Area**: Minimum 44x44px touch targets
- **Feedback**: Hover/tap state visual feedback

###### Action Button Behaviors
- **Copy**: Display toast message for successful copy
- **T-Map**: Check app installation before launching
- **Phone**: Direct connection to phone app
- **View Drawing**: Display in modal or new tab

##### Responsive Design
###### Mobile Layout
- **Vertical Layout**: Single column scrollable design
- **Touch Optimization**: Larger button sizes for touch
- **Section Priority**: Most important information first

###### Tablet/Desktop Layout
- **Two-Column Layout**: Consider sidebar for filters
- **Main Area**: Results display in primary content area
- **Persistent Filters**: Keep search filters visible

##### Empty State Handling
- **No Results**: Clear message when no search results
- **No Site Info**: Informative message when no site data
- **Action Suggestions**: Provide relevant next actions

#### 6.4 Technical Implementation

##### Location-Based Services
- **Location Permission**: Request current location access
- **Distance Calculation**: Algorithm for site proximity
- **Map API Integration**: Connection to mapping services

##### External App Integration
- **T-Map URL Scheme**: Deep linking to T-Map app
- **Phone App Integration**: Direct calling functionality
- **Drawing Viewer**: Integration with document viewer

##### Data Caching Strategy
- **Site Information Cache**: Local caching of frequently accessed data
- **Offline Mode Support**: Access to cached data without network
- **Synchronization**: Smart sync strategy for data updates

#### 6.5 Organization Structure
- **Multi-Level Hierarchy**: Head office, branch offices, departments
- **Partner Management**: External company relationships
- **Site Assignments**: Partner company assignments to specific sites
- **Contract Management**: Partner contract details and terms

### 7. Material Management (NPC-1000 System)

#### 7.1 Material Master Data
- **Hierarchical Categories**: Multi-level material classification system
- **Material Specifications**: Detailed material information and specifications
- **Unit Management**: Standardized units of measurement
- **Supplier Information**: Material supplier database with contact details

#### 7.2 Inventory Management
- **Site-Level Inventory**: Stock levels tracked per construction site
- **Stock Thresholds**: Minimum and maximum stock level alerts
- **Purchase History**: Historical purchase data and pricing
- **Storage Locations**: Physical storage location tracking

#### 7.3 Material Requests and Procurement
- **Request System**: Formal material request workflow
- **Priority Levels**: Urgent, high, normal, low priority classification
- **Approval Process**: Manager approval for material requests
- **Supplier Selection**: Preferred supplier management
- **Delivery Tracking**: Request status from order to delivery

#### 7.4 Material Transactions
- **Transaction Types**: In, out, return, waste, adjustment
- **Automatic Inventory Updates**: Real-time stock level updates
- **Cost Tracking**: Material costs and project impact
- **Audit Trail**: Complete transaction history


### 8. Communication and Workflow

#### 8.1 Notification System
- **Real-Time Alerts**: Instant notifications for important events
- **Multi-Channel**: In-app, email notification options
- **Notification Types**: Info, warning, error, success categories
- **Read Tracking**: Notification read status management

#### 8.2 Announcement System
- **Site Announcements**: Site-specific announcements
- **Role-Based Targeting**: Announcements targeted to specific user roles
- **Priority Levels**: Urgent, high, normal, low priority announcements
- **Publication Control**: Active/inactive announcement management

#### 8.3 Approval Workflows
- **Multi-Type Approvals**: Daily reports, documents, leave requests, expenses
- **Approval Chain**: Configurable approval hierarchies
- **Status Tracking**: Pending, approved, rejected, cancelled statuses
- **Comments System**: Approval comments and feedback

### 9. Reporting and Analytics

#### 9.1 Standard Reports
- **Daily Activity Reports**: Comprehensive daily operation summaries
- **Attendance Reports**: Worker attendance and payroll reports
- **Material Usage Reports**: Material consumption and inventory reports

#### 9.2 Custom Analytics
- **Performance Dashboards**: Key performance indicator tracking
- **Trend Analysis**: Historical data analysis and trending
- **Comparative Reports**: Cross-site and cross-period comparisons
- **Executive Summaries**: High-level management reports

## Technical Architecture

### Technology Stack

#### Frontend
- **Next.js 14**: React framework with App Router for modern web applications
- **TypeScript**: Type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for user interface elements
- **Class Variance Authority**: Component variant management

#### Backend
- **Supabase**: Backend-as-a-Service providing database, authentication, and real-time features
- **PostgreSQL**: Relational database with advanced features
- **Row Level Security**: Database-level security policies
- **Real-time Subscriptions**: Live data updates across clients

#### Authentication
- **Supabase Auth**: Managed authentication service
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Automatic session refresh and persistence
- **Cookie Storage**: Secure HTTP-only cookie session storage

#### Deployment
- **Vercel**: Modern hosting platform optimized for Next.js
- **Edge Functions**: Serverless functions for API endpoints
- **CDN**: Global content delivery network for performance
- **SSL/TLS**: Encrypted connections for security

### System Architecture

#### Client-Server Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │◄──►│   Next.js App   │◄──►│   Supabase      │
│   (Browser)     │    │   (Server)      │    │   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### Data Flow
1. **Client Request**: User interaction triggers request to Next.js application
2. **Authentication**: Middleware validates user session and permissions
3. **Server Processing**: Server-side functions process business logic
4. **Database Access**: Supabase client queries PostgreSQL with RLS policies
5. **Response**: Data returned to client with appropriate transformations

#### Security Layers
1. **Network Security**: HTTPS encryption for all communications
2. **Authentication**: JWT-based user authentication
3. **Authorization**: Role-based access control at application level
4. **Database Security**: Row Level Security policies at database level
5. **Input Validation**: Client and server-side input sanitization

### Database Schema

#### Core Entity Relationships
```
organizations (1) ──── (N) profiles
organizations (1) ──── (N) sites
sites (1) ──── (N) daily_reports
daily_reports (1) ──── (N) work_logs
daily_reports (1) ──── (N) attendance_records
profiles (1) ──── (N) notifications
```

#### Key Tables
- **profiles**: User information and role assignments
- **organizations**: Company hierarchy and structure
- **sites**: Construction site information
- **daily_reports**: Primary work log entries
- **attendance_records**: Time and attendance tracking
- **documents**: File storage and management
- **materials**: Material master data
- **material_inventory**: Site-level stock tracking
- **notifications**: User communication system

#### Security Policies
All tables implement Row Level Security with policies based on:
- User organization membership
- Site assignment relationships
- Role-based permissions (system_admin > admin/site_manager > worker)
- Document ownership
- EXISTS clauses to prevent infinite recursion
- LIMIT 1 optimization for performance

### API Design

#### Server Actions
Server actions provide secure, server-side processing for:
- **Authentication**: Sign in, sign up, sign out operations
- **Daily Reports**: CRUD operations with approval workflow
- **Attendance**: Time tracking and calculation
- **Documents**: File upload and management
- **Materials**: Inventory and request management

#### Real-Time Features
Supabase real-time subscriptions enable:
- **Live Notifications**: Instant notification delivery
- **Status Updates**: Real-time approval status changes
- **Collaborative Editing**: Multi-user document editing
- **Dashboard Updates**: Live statistics and metrics

### Performance Considerations

#### Optimization Strategies
- **Server-Side Rendering**: Initial page load optimization
- **Static Generation**: Pre-built pages for public content
- **Code Splitting**: Lazy loading of application components
- **Database Indexing**: Optimized queries with proper indexing
- **Caching**: Client-side and server-side caching strategies

#### Mobile Performance Requirements
- **Bottom Navigation Bar Performance**:
  - Hardware acceleration for rendering
  - Icon caching with efficient memory management
  - 60fps animation performance guarantee
  - Touch response time under 16ms
  - Load time optimization for mobile networks (3G/4G/5G)

#### Scalability Features
- **Horizontal Scaling**: Supabase auto-scaling database
- **CDN Integration**: Global content distribution
- **Edge Computing**: Serverless functions at edge locations
- **Database Partitioning**: Large table partitioning for performance

#### Mobile-Specific Optimizations
- **Touch Interface**: Optimized for finger navigation with 44x44px minimum touch targets
- **Network Resilience**: Offline capability with intelligent sync
- **Battery Optimization**: Efficient rendering and reduced background processing
- **Platform Integration**: Native-like performance through platform-specific optimizations

## User Flows

### 1. User Registration and Onboarding

#### New User Registration
1. **Account Creation**: User provides email, password, full name, phone, role
2. **Email Verification**: Supabase sends verification email
3. **Profile Creation**: System creates profile with appropriate organization/site assignment
4. **Role Assignment**: Automatic role detection based on email domain
5. **First Login**: User completes profile and accesses role-appropriate dashboard

#### Organization Assignment Logic
- `@inopnc.com` emails → INOPNC organization with appropriate role
- `@customer.com` emails → Customer organization as customer_manager
- Special handling for system administrators

### 2. Daily Work Report Workflow

#### Report Creation (Worker/Manager)
1. **Navigate to Reports**: Access daily reports section from dashboard
2. **Create New Report**: Click "New Report" button
3. **Fill Report Details**: 
   - Select construction site
   - Enter work date
   - Specify work content and location
   - Record material usage (NPC-1000)
   - Note any issues or special circumstances
4. **Submit for Approval**: Submit report to site manager
5. **Status Tracking**: Monitor approval status

#### Report Approval (Manager)
1. **Review Pending Reports**: Access pending approval queue
2. **Review Report Details**: Examine submitted work information
3. **Approve or Reject**: Make approval decision with optional comments
4. **Notification**: Automatic notification sent to report submitter

### 3. Attendance Management Workflow

#### Daily Check-in Process
1. **Morning Check-in**: Worker records arrival time
2. **Location Verification**: Optional GPS location recording
3. **Work Period**: System tracks elapsed time
4. **Break Recording**: Optional break time recording
5. **Check-out**: Worker records departure time
6. **Hours Calculation**: System calculates regular and overtime hours

#### Manager Attendance Review
1. **Team Overview**: Manager views team attendance summary
2. **Individual Review**: Drill-down into individual worker records
3. **Exception Handling**: Address attendance discrepancies
4. **Approval**: Approve attendance records for payroll processing

### 4. Material Request Workflow

#### Request Creation
1. **Identify Need**: Worker or manager identifies material requirement
2. **Create Request**: Fill material request form with:
   - Required materials and quantities
   - Required delivery date
   - Priority level
   - Justification
3. **Submit Request**: Send request to appropriate approver
4. **Track Status**: Monitor request through approval and fulfillment

#### Request Approval and Fulfillment
1. **Manager Review**: Review material request details
2. **Requirements Review**: Review material requirements
3. **Supplier Selection**: Choose appropriate supplier
4. **Purchase Order**: Generate purchase order
5. **Delivery Tracking**: Monitor delivery status
6. **Receipt Confirmation**: Confirm material receipt and update inventory

### 5. Document Management Workflow

#### Document Upload
1. **Access Document Section**: Navigate to personal or shared documents
2. **Select File**: Choose file from local storage
3. **Categorize**: Assign document category and folder
4. **Set Permissions**: Configure access permissions (for shared documents)
5. **Upload**: Complete file upload with metadata
6. **Verify**: Confirm successful upload and accessibility

#### Document Access and Sharing
1. **Browse Documents**: Navigate document hierarchy
2. **Search**: Use search functionality to locate specific documents
3. **Preview**: View document preview if supported
4. **Download**: Download document for offline use
5. **Share**: Configure sharing permissions for team members

## Security and Permissions

### Row Level Security (RLS) Policies (2025-08-07 Update)

#### Hierarchical Permission System
Our RLS implementation follows a strict hierarchical model with infinite recursion prevention:

##### 🔧 System Administrator (system_admin)
- Complete unrestricted access to all data across the system
- Can manage all user profiles and system settings
- Bypass all RLS restrictions for maintenance and troubleshooting
- Special assignment: davidswyang@gmail.com

##### 👔 Administrator/Site Manager (admin, site_manager)
- Access to all data within assigned construction sites
- Can view and manage team member profiles within their sites
- Site-specific data management permissions
- Cross-site data isolation enforced

##### 👷 General Worker (worker)
- Access limited to personal data (attendance, daily reports)
- Can view team data within the same construction site
- Cannot access data from other sites
- Basic profile management for own account

#### RLS Implementation Details

##### Profile Table Protection
- **Infinite Recursion Prevention**: Uses EXISTS clauses instead of direct self-references
- **Separate Policies**: INSERT, UPDATE, and SELECT policies for granular control
- **Auto-creation Support**: Profiles are created automatically on first login
- **Example Policy**:
```sql
CREATE POLICY "profiles_access_policy" ON profiles
FOR ALL USING (
  id = auth.uid()  -- Own profile always accessible
  OR
  EXISTS (          -- System admin check without recursion
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'system_admin'
    LIMIT 1
  )
);
```

#### User Profile Access
- Users can view and update their own profile
- Managers can view profiles of users in their sites
- Admins can view all profiles in their organization
- System admins have full access

#### Daily Report Access
- Users can create and view their own reports
- Site managers can view all reports for their assigned sites
- Customers can view reports for sites they have access to
- Organization restriction applies to all access

#### Document Access
- Personal documents: Owner access only
- Shared documents: Site-based or role-based access
- Public documents: Organization-wide access
- Admin documents: Admin and system admin access only

#### Material and Inventory Access
- Site-specific access for workers and managers
- Organization-wide access for admins
- Read-only access for customers on assigned sites
- Full access for system administrators

### Authentication Security

#### Session Management
- JWT-based authentication with automatic refresh
- Secure HTTP-only cookie storage
- Session timeout with automatic renewal
- Logout clearing all session data

#### Password Security
- Minimum complexity requirements
- Secure password hashing (bcrypt)
- Password reset with email verification
- Account lockout after failed attempts

#### Access Control
- Role-based permission system
- Route-level authentication checks
- API endpoint protection
- Database-level security policies

### Data Protection

#### Encryption
- HTTPS encryption for all communications
- Database encryption at rest
- File storage encryption
- API key protection

#### Audit Trail
- User action logging
- Login/logout event tracking
- Document access logging
- Data modification history

#### Privacy Compliance
- Personal data protection
- User consent management
- Data retention policies
- Right to data deletion

## API Specifications

### Authentication Endpoints

#### POST /auth/signin
**Purpose**: User authentication
**Request**:
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST /auth/signup  
**Purpose**: New user registration
**Request**:
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "fullName": "User Name",
  "phone": "+1234567890",
  "role": "worker"
}
```
**Response**:
```json
{
  "success": true,
  "message": "User created successfully"
}
```

#### POST /auth/signout
**Purpose**: User logout
**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Daily Reports API

#### GET /api/daily-reports
**Purpose**: Retrieve daily reports list
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `date_from`: Start date filter
- `date_to`: End date filter

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "site_id": "uuid",
      "work_date": "2025-07-31",
      "member_name": "슬라브",
      "process_type": "균열",
      "total_workers": 5,
      "status": "submitted",
      "created_at": "2025-07-31T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50
  }
}
```

#### POST /api/daily-reports
**Purpose**: Create new daily report
**Request**:
```json
{
  "site_id": "uuid",
  "work_date": "2025-07-31",
  "member_name": "슬라브",
  "process_type": "균열",
  "total_workers": 5,
  "npc1000_incoming": 100,
  "npc1000_used": 80,
  "npc1000_remaining": 20,
  "issues": "Minor issue with materials"
}
```

### Material Management API

#### GET /api/materials/inventory
**Purpose**: Get material inventory for site
**Query Parameters**:
- `site_id`: Construction site ID
- `low_stock`: Show only low stock items

**Response**:
```json
{
  "data": [
    {
      "material_id": "uuid",
      "material_name": "NPC-1000",
      "current_stock": 150,
      "minimum_stock": 100,
      "unit": "kg",
      "last_updated": "2025-07-31T10:00:00Z"
    }
  ]
}
```

#### POST /api/materials/requests
**Purpose**: Create material request
**Request**:
```json
{
  "site_id": "uuid",
  "required_date": "2025-08-05",
  "priority": "normal",
  "items": [
    {
      "material_id": "uuid",
      "requested_quantity": 200,
      "notes": "Urgent requirement for construction"
    }
  ]
}
```

### Document Management API

#### POST /api/documents/upload
**Purpose**: Upload document file
**Request**: Multipart form data
- `file`: Document file
- `title`: Document title
- `description`: Document description
- `document_type`: Document category
- `is_public`: Public access flag

**Response**:
```json
{
  "success": true,
  "document": {
    "id": "uuid",
    "title": "Daily Report",
    "file_url": "https://storage.url/document.pdf",
    "created_at": "2025-07-31T10:00:00Z"
  }
}
```

#### GET /api/documents
**Purpose**: List user documents
**Query Parameters**:
- `type`: Document type filter
- `folder`: Folder path filter
- `search`: Search term

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Daily Report",
      "file_name": "daily_report.pdf",
      "file_size": 1024000,
      "document_type": "report",
      "created_at": "2025-07-31T10:00:00Z"
    }
  ]
}
```

### Real-Time Subscriptions

#### Notifications Channel
**Purpose**: Real-time notification delivery
**Subscribe**: `notifications:user_id`
**Payload**:
```json
{
  "id": "uuid",
  "title": "Report Approved",
  "message": "Your daily report has been approved",
  "type": "success",
  "created_at": "2025-07-31T10:00:00Z"
}
```

#### Report Status Updates
**Purpose**: Live status updates for reports
**Subscribe**: `daily_reports:status_changes`
**Payload**:
```json
{
  "report_id": "uuid",
  "old_status": "submitted",
  "new_status": "approved",
  "updated_by": "uuid",
  "updated_at": "2025-07-31T10:00:00Z"
}
```

## Admin Dashboard Enhancements (Phase 1 - August 2025)

### 1. Analytics Dashboard
**Purpose**: Comprehensive analytics and reporting for administrators
**Features**:
- **Real-time KPI Monitoring**: Live dashboard with key performance indicators
- **Site Productivity Analysis**: Comparison of productivity across different sites
- **Cost Analysis**: Budget vs. actual cost tracking and analysis
- **Worker Performance Metrics**: Individual and team performance tracking
- **Trend Analysis**: Historical data trends and forecasting
- **Custom Date Range Selection**: Flexible reporting periods
- **Export Capabilities**: Download reports in PDF, Excel formats

**Implementation**:
- Utilize existing analytics API endpoints
- Interactive charts using recharts library
- Real-time data updates via WebSocket
- Responsive design for mobile and desktop

### 2. Unified Notification Center
**Purpose**: Centralized notification management for administrators
**Features**:
- **Notification Management**: 
  - View all system notifications in one place
  - Filter by type, status, and recipient
  - Mark as read/unread functionality
  - Bulk actions for notification management
- **Push Notification Settings**:
  - Configure push notification preferences
  - User group targeting
  - Schedule notifications
  - Template management
- **Emergency Alerts**:
  - Send urgent notifications to specific users or groups
  - Real-time delivery tracking
  - Read receipt confirmation
- **Notification History**:
  - Complete audit trail of all notifications
  - Search and filter capabilities
  - Analytics on notification effectiveness

**Implementation**:
- Extend existing push notification system
- Add notification management API endpoints
- Create admin interface for notification control
- Implement notification analytics

### 3. Unified Search System
**Purpose**: System-wide search functionality for administrators
**Features**:
- **Global Search Bar**: Accessible from all admin pages
- **Multi-Entity Search**:
  - Users (name, email, phone)
  - Sites (name, location, status)
  - Documents (title, content, metadata)
  - Reports (daily reports, materials, attendance)
  - System logs and activities
- **Advanced Filters**:
  - Date range filtering
  - Entity type selection
  - Status filtering
  - Custom field search
- **Search Results**:
  - Grouped by entity type
  - Quick preview on hover
  - Direct navigation to details
  - Recent search history
- **Smart Suggestions**:
  - Auto-complete functionality
  - Popular searches
  - Related results

**Implementation**:
- PostgreSQL full-text search
- Elasticsearch integration for advanced search (optional)
- Debounced search input
- Cached search results for performance

## Future Considerations

### Phase 2 Enhancements

#### Advanced Analytics
- **Predictive Analytics**: Machine learning for project completion prediction
- **Cost Optimization**: AI-driven cost optimization recommendations
- **Performance Benchmarking**: Cross-project performance comparisons
- **Resource Optimization**: Intelligent resource allocation suggestions

#### Mobile Application
- **Native Mobile Apps**: iOS and Android native applications
- **Enhanced Bottom Navigation**: 
  - Dynamic menu customization based on user role and preferences
  - Context-aware menu items that adapt to current task
  - Advanced gesture navigation (swipe between tabs)
  - Haptic feedback integration for iOS and Android
- **Offline Capability**: Offline data entry with sync capabilities
- **Push Notifications**: Native mobile push notification support
- **Camera Integration**: Photo and video capture for documentation

#### Integration Capabilities
- **ERP Integration**: Integration with existing ERP systems
- **ERP Systems**: Connection to enterprise resource planning systems
- **Third-Party Tools**: Integration with popular construction management tools
- **API Marketplace**: Public API for third-party developers

#### Advanced Workflows
- **Automated Approvals**: AI-assisted approval workflows
- **Smart Notifications**: Context-aware notification system
- **Workflow Automation**: Business process automation capabilities
- **Custom Workflows**: User-configurable workflow builder

### Phase 3 Vision

#### Industry Expansion
- **Multi-Industry Support**: Adaptation for other industries beyond construction
- **White Label Solution**: Customizable solution for other organizations
- **SaaS Platform**: Software-as-a-Service offering for external customers
- **Marketplace Features**: Third-party add-on marketplace

#### Advanced Technologies
- **IoT Integration**: Internet of Things device integration
- **Augmented Reality**: AR features for on-site visualization
- **Blockchain**: Blockchain for contract and payment automation
- **AI Assistants**: Intelligent virtual assistants for user guidance

#### Global Scalability
- **Multi-Language Support**: Internationalization and localization
- **Multi-Currency**: Support for multiple currencies and regions
- **Compliance Frameworks**: Support for international compliance standards
- **Regional Customization**: Customizable features for different markets

### Technical Roadmap

#### Performance Optimization
- **Database Optimization**: Advanced indexing and query optimization
- **Caching Strategy**: Multi-level caching implementation
- **CDN Enhancement**: Advanced content delivery optimization
- **Load Balancing**: Multi-region deployment with load balancing

#### Security Enhancements
- **Advanced Authentication**: Multi-factor authentication support
- **Zero Trust Architecture**: Comprehensive zero trust security model
- **Advanced Monitoring**: AI-powered security monitoring
- **Compliance Automation**: Automated compliance checking and reporting

#### Infrastructure Evolution
- **Microservices Architecture**: Migration to microservices architecture
- **Container Orchestration**: Kubernetes-based deployment
- **Service Mesh**: Advanced service communication and monitoring
- **Event-Driven Architecture**: Transition to event-driven patterns

---

## Conclusion

INOPNC Work Management System represents a comprehensive solution for modern construction project management. By leveraging modern web technologies and robust backend services, the system provides secure, scalable, and user-friendly tools for all construction stakeholders.

The system's role-based architecture ensures appropriate access control while enabling efficient collaboration. The comprehensive feature set covers all aspects of construction management from daily operations to material management.

Future enhancements will focus on advanced analytics, mobile capabilities, and broader industry integration, positioning INOPNC WMS as a leading construction management platform.

## Recent Updates

### 2025-08-03: UI Consistency Improvements and Drag-and-Drop Implementation

#### 1. Documents Screen UI Consistency (문서함 화면)
**Objective**: Achieve complete UI consistency across all three tabs in the Documents screen

**Completed Improvements**:
- **내문서함 (My Documents) Tab**:
  - ✅ Removed 'size' sorting option as requested
  - ✅ Converted dropdown sorting to toggle buttons (날짜순/이름순)
  - ✅ Fixed issue where clicking "날짜순" still showed dropdown with 3 options
  - ✅ TypeScript types updated to exclude 'size' from sortBy options

- **공유문서함 (Shared Documents) Tab**:
  - ✅ Added complete file upload functionality for all users
  - ✅ Implemented drag-and-drop support matching 내문서함 tab
  - ✅ Applied toggle button sorting pattern (날짜순/이름순)
  - ✅ Added comprehensive file validation (type, size restrictions)
  - ✅ Added visual feedback for drag states and upload progress

- **도면마킹 (Drawing Markup) Tab**:
  - ✅ Complete UI overhaul to match other tabs' design pattern
  - ✅ Changed location selection from dropdown to toggle buttons
  - ✅ Added card/list view toggle functionality
  - ✅ Unified card list design across all screen sizes
  - ✅ Improved list view consistency with other tabs

**Technical Implementation**:
- Updated all TypeScript interfaces to remove 'size' sorting option
- Implemented consistent toggle button components across tabs
- Added drag-and-drop handlers with proper error handling
- Optimized file upload workflow with progress indicators
- Fixed document.createElement browser compatibility issue

#### 2. Site Information Page Optimization (현장정보 화면)
**Objective**: Make the site information page as compact and efficient as the home screen

**UI Improvements**:
- ✅ Reduced header padding from `p-4` to `px-3 py-3`
- ✅ Optimized title sizes from `3xl/2xl` to `2xl/xl`
- ✅ Minimized content spacing from `space-y-6 p-4` to `space-y-4 p-3`
- ✅ Improved card spacing throughout the component
- ✅ Made dropdown controls more compact (200px → 180px width)

**Result**: Site information page now matches the compact and efficient layout style of the home screen

#### 3. Technical Achievements
- **TypeScript Error Resolution**: Fixed all compilation and type errors
- **Cross-tab Consistency**: Achieved uniform UI patterns across all document tabs
- **Mobile Optimization**: Enhanced touch targets and responsive design
- **Performance**: Optimized rendering and interaction performance

#### 4. User Experience Impact
- **Consistency**: Users now experience identical UI patterns across all document management tabs
- **Efficiency**: Faster document management with improved toggle interfaces
- **Mobile-First**: Better mobile experience with optimized spacing and controls
- **Accessibility**: Improved touch targets and visual feedback

### 2025-08-03: Terminology Updates for Mobile UX Optimization
- **UI Text Simplification**: Simplified terminology for better mobile user experience
  - "T맵지도" → "T맵" (Navigation links in site information)
  - "공사도면" → "도면" (Blueprint button and modal title)
  - "공도면" → "도면" (Quick menu item name)
- **Rationale**: Shorter terms improve readability on mobile devices and maintain consistency across the interface
- **Impact**: Enhanced mobile UX with cleaner, more concise interface labels

### 2025-08-04: Bottom Navigation Update
- **Bottom Navigation Menu Changes**: Simplified navigation structure for better user experience
  - Removed '공도면' (blueprint) menu item
  - Added '내정보' (My Info) menu item for quick access to user profile
  - Updated menu order: 홈(빠른메뉴), 출력현황, 작업일지, 문서함, 내정보
  - Implemented profile view showing user name, email, and role information
- **Rationale**: Streamlined navigation by consolidating document access under single '문서함' entry and providing direct access to user profile

### 2025-08-04: Quick Menu and Today's Site Information Updates
- **Quick Menu Default Changes**: Updated default quick menu items for better workflow
  - Changed from: 출력현황, 내문서함, 현장정보, 도면
  - Changed to: 출근현황, 작업일지, 현장정보, 문서함
  - Rationale: Better alignment with user's daily workflow priorities
- **Today's Site Information Reorganization**: Improved information hierarchy
  - Moved manager contacts (건축관리자, 안전관리자) above work details
  - Added divider line between managers and work content
  - Changed "작업지시서" to "작업내용" (removed blueprint icon)
  - Added new "현장 공도면" section with Map icon and preview button
  - Maintained PTW section at the bottom
  - Rationale: More logical information flow with contact information prioritized

**Document Version**: 1.3  
**Last Updated**: August 4, 2025  
**Status**: Active Development  
**Next Review**: August 31, 2025