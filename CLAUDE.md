# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

INOPNC Work Management System - A construction work log management system built with Next.js 14, TypeScript, and Supabase.

## Critical Protected Files - DO NOT MODIFY

The following files contain critical authentication and cookie handling logic that MUST NOT be modified:
- `/lib/supabase/server.ts` - Contains cookie handling with try-catch blocks
- `/lib/supabase/client.ts` - Browser client configuration  
- `/middleware.ts` - Session refresh and authentication flow
- `/app/auth/actions.ts` - Server actions with success/error returns (NO redirects)

# Before modifying ANY of these files, you MUST:
# 1. Run `npm run test:critical` to verify current state
# 2. Explain why the change is necessary
# 3. Create a backup with `npm run snapshot:save "reason"`
# 4. Get explicit user confirmation

Only run `npm run test:critical` and `npm run snapshot:save` before major structural changes 
(e.g., core logic, DB schema). Minor changes like text, styles, or logging do not require this.

## Development Workflow (핵심 원칙: 구현 집중 → 배치 검증)

### 🚀 Streamlined Development Process

**개발 철학: 구현 중단 최소화, 모듈 완성 후 종합 검증**

#### 1️⃣ 구현 단계 (Implementation Focus)
```bash
# 구현 중에는 최소한의 체크만 실행
npm run build              # 컴파일 에러 체크 (필수)

# 브라우저에서 빠른 시각적 확인만 진행
# ❌ 이 단계에서는 테스트 실행 금지
```

#### 2️⃣ 모듈 완성 후 (Batch Validation)
```bash
# 모듈/기능 단위로 한 번에 검증
npm run test:unit                    # 완성된 모듈 유닛 테스트
npm run test:integration            # 관련 기능 통합 테스트
npm run test:e2e -- [specific-page] # 특정 페이지 E2E 테스트
```

#### 3️⃣ 핵심 효과
- **🚀 2-3배 빠른 개발**: 구현 중 방해 요소 완전 제거
- **🎯 집중력 극대화**: 코딩에만 온전히 집중 가능
- **🔧 효율적 디버깅**: 관련 기능을 묶어서 체계적 검증
- **✅ 높은 품질**: 배치 테스트로 더 철저한 검증 가능


## Essential Commands (간소화된 명령어 세트)

### 🔧 일상 개발용 (Daily Development)
```bash
npm run dev              # 개발 서버 시작 (http://localhost:3000)
npm run build            # 컴파일 에러 체크용 (구현 중 사용)
```

### 🧪 모듈 완성 후 검증 (Module Completion Testing)
```bash
npm run test             # Jest 유닛 테스트
npm run test:integration # 통합 테스트 (관련 기능)
npm run test:e2e         # E2E 테스트 (특정 페이지)
npm run lint             # 코드 스타일 검사
```

### 🛡️ 중요 변경 전용 (Critical Changes Only)
```bash
npm run test:critical              # 핵심 인증 기능 테스트
npm run snapshot:save "reason"     # 중요 변경 전 백업
npm run protect:check              # 핵심 기능 동작 확인
```

> **⚡ 핵심 규칙**: 구현 중에는 `npm run build`만 사용, 모듈 완성 후에만 테스트 실행

## Recent Updates

### 2025-08-04: Blueprint Markup Tool UI/UX Improvements
- **Dark Mode Support**: Complete dark theme implementation across all markup tool components
  - Upload screen, editor interface, and document list all support dark mode
- **Tool Palette Layout Enhancement**:
  - New 2-row layout for mobile devices
  - Row 1: Select, Material Zone (gray), Work Progress (red) + Undo/Redo
  - Row 2: Work Complete (blue), Text, Pen + Delete
  - All tools now visible within viewport
- **Improved Visibility and Design**:
  - Increased button size to 48x48px for better touch targets
  - Larger icons (6x6) for improved visibility
  - Box tools now display as filled colored squares
  - Gradient effects and shadows for depth
  - Modern rounded corners (rounded-xl)
- **Action Button Differentiation**:
  - Undo/Redo: Gray gradient background
  - Delete: Red theme for danger action

### 2025-08-04: Bottom Navigation Bar Update
- **Navigation Menu Simplified**: Restructured mobile bottom navigation for better UX
  - Removed '공도면' (blueprint) menu item 
  - Added '내정보' (My Info) menu item for quick profile access
  - New menu order: 홈(빠른메뉴), 출력현황, 작업일지, 문서함, 내정보
- **Profile Screen Implementation**: 
  - Shows user name, email, and role information
  - Role display in Korean (작업자, 현장관리자, 파트너사, 관리자, 시스템관리자)

### 2025-08-04: Quick Menu and Today's Site Info Updates
- **Quick Menu Default Changes**: Updated default items from '출력현황, 내문서함, 현장정보, 도면' to '출근현황, 작업일지, 현장정보, 문서함'
- **Today's Site Information Reorganization**:
  - Reordered sections: Site address → Accommodation → Manager contacts → Divider → Work details → 현장 공도면 → PTW
  - Moved blueprint icon from 작업지시서 to new 현장 공도면 section
  - Changed 작업지시서 to 작업내용 (work content only, no icon)
  - Added visual divider line between manager contacts and work details

### 2025-08-07: Unified Page Header System Implementation
- **PageHeader Component**: New unified page header system for consistent navigation context
  - Breadcrumb navigation showing hierarchical page location
  - Contextual action buttons with responsive behavior
  - Mobile-first design with touch-friendly targets (48x48px)
  - Dark mode and accessibility support (WCAG compliant)
- **Pre-configured Variants**:
  - `DashboardPageHeader`: Standard dashboard pages
  - `AdminPageHeader`: Admin section pages
  - `ReportsPageHeader`: Report pages with back navigation
  - `DocumentsPageHeader`: Document management pages
- **Integration Features**:
  - Touch mode support for construction site usage (normal/glove/precision)
  - Font size context integration
  - Responsive action buttons (text to icons on mobile)
  - Complete documentation and examples in `/components/ui/page-header-*.tsx`

### 2025-08-07: Site Data Cleanup and RLS Policy Fixes
- **Fixed Duplicate Site Entries**: Removed duplicate "강남 A현장" entries from database
  - Issue: Multiple identical site entries were causing duplicates in dropdowns
  - Solution: Cleaned up database to keep only one instance of each site
  - Note: The "V" character appearing before site names was likely a rendering issue with checkmarks (✓)
- **Fixed Site Dropdown Empty Issue**: Added RLS policy for authenticated users
  - Issue: Sites dropdown was empty because RLS policy only allowed admins to view sites
  - Solution: Added "Users can view sites" policy allowing all authenticated users to SELECT from sites table
  - Added null safety checks in component to handle edge cases
- **Comprehensive RLS Policy Review**: Verified all tables have proper SELECT policies
  - Confirmed policies exist for: sites, daily_reports, attendance_records, documents, materials, material_inventory, notifications
  - All authenticated users can now view necessary data for proper UI functionality
  - Created migration files to persist these policies

### 2025-08-10: Home Screen Layout Spacing Documentation
- **Header to First Section Gap**: `py-6` = 24px top padding
  - Location: `/components/dashboard/dashboard-layout.tsx` line 386
  - Applied to main content container: `<main id="main-content" className="py-6 pb-16 md:pb-6">`
- **Left/Right Edge to Section Gap**: Responsive horizontal padding
  - Location: `/components/dashboard/dashboard-layout.tsx` line 387  
  - Mobile: `px-4` = 16px (each side)
  - Small screens: `sm:px-6` = 24px (each side)
  - Large screens: `lg:px-8` = 32px (each side)
  - Applied to content wrapper: `<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">`
- **Header Height**: `h-16` = 64px
  - Location: `/components/dashboard/header.tsx` line 26
  - Applied to header container: `<div className="flex h-16 items-center justify-between">`

### 2025-08-03: Today's Site Information Enhancements
- **Blueprint View Button**: Added "공사도면" button next to work details
  - Opens modal with actual construction blueprint image
  - Download functionality for blueprint files
  - Mobile-optimized with slide-up animation
- **PTW Document Section**: New section below work details
  - "PTW (작업허가서)" preview functionality
  - Modal with PDF viewer and document information
  - Auto-generated document numbers
  - Download capability for PTW documents
- **Mobile Optimization**: 
  - Bottom sheet style modals for mobile devices
  - Proper z-index handling to avoid NavBar overlap
  - Touch-friendly button sizes

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Row Level Security)
- **State Management**: React Hooks, Context API
- **Testing**: Jest, Playwright

### Project Structure
```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   └── markup-documents/  # Markup document management API
│   ├── auth/              # Authentication pages (login, signup, reset-password)
│   ├── dashboard/         # Main dashboard and sub-pages
│   └── api/               # API routes
├── components/            # Reusable React components
│   ├── markup/           # Blueprint markup system components
│   │   ├── canvas/       # HTML5 Canvas drawing components
│   │   ├── dialogs/      # Save/Open/Share dialogs
│   │   ├── hooks/        # Custom hooks for markup functionality
│   │   ├── list/         # Document list and management UI
│   │   ├── toolbar/      # Tool palette and toolbars
│   │   └── upload/       # Blueprint file upload components
│   └── dashboard/         # Dashboard-specific components
├── lib/                   # Utility functions and configurations
│   ├── supabase/         # Supabase client configurations
│   └── auth/             # Authentication utilities
├── types/                # TypeScript type definitions
│   └── markup.ts         # Markup system type definitions
├── supabase/             # Database migrations and seeds
│   └── migrations/
│       └── 107_create_markup_documents.sql
└── public/               # Static assets
```

### Authentication Flow
1. User logs in via `/auth/login`
2. Supabase handles authentication
3. Middleware (`/middleware.ts`) checks session on each request
4. Protected routes redirect to login if no session
5. Profile is auto-created on first login via database trigger

### Database Schema

Key tables with RLS (Row Level Security) enabled:
- `profiles` - User profiles linked to auth.users
- `organizations` - Company/organization hierarchy
- `sites` - Construction sites
- `daily_reports` - Daily work logs
- `attendance_records` - Worker attendance with labor hours (공수)
- `documents` - File management
- `notifications` - User notifications
- `markup_documents` - Blueprint markup documents (마킹 도면 문서)
- `markup_document_permissions` - Markup document sharing permissions

### Labor Hours (공수) System
- 1.0 공수 = 8 hours of work
- 0.5 공수 = 4 hours of work
- 0.25 공수 = 2 hours of work
- Attendance records track `labor_hours` instead of just attendance status
- Visual indicators in calendar:
  - Green (1.0+ 공수): Full day or overtime
  - Yellow (0.5-0.9 공수): Half to almost full day
  - Orange (0.1-0.4 공수): Less than half day
  - Gray: No work/holiday

### User Roles & Permissions (2025-08-07 Update)

#### Role Definitions
- `worker` - Basic worker, can view/create own reports
- `site_manager` - Manages specific construction sites
- `customer_manager` - External customer access
- `admin` - Organization admin
- `system_admin` - Full system access

#### Hierarchical Permission System
Our Row Level Security (RLS) implementation follows a strict hierarchical model:

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

##### Key Security Features
1. **Unauthenticated Access Blocking**: All data access requires authentication
2. **Site Data Isolation**: Complete separation between different construction sites
3. **Role-based Filtering**: Data visibility determined by user role and site assignments
4. **Performance Optimization**: Efficient queries using EXISTS and LIMIT clauses

##### Critical Migration Files
- `301_simple_rls_policies.sql` - Initial simplified RLS policies
- `302_fix_infinite_recursion_rls.sql` - Fixed infinite recursion issue with EXISTS patterns

## Supabase Configuration

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Migrations
Migrations are in `/supabase/migrations/` and should be applied in order:
1. Initial schema setup
2. RLS policies
3. Demo data (optional)

To apply migrations:
```bash
supabase db push --db-url "postgres://..."
```

## Key Implementation Details

### Server vs Client Components
- Use `'use client'` directive for interactive components
- Server components for data fetching in page.tsx files
- Server actions in `/app/auth/actions.ts` return `{success, error}` objects

### Supabase Client Usage
- Use `createClient()` from `/lib/supabase/client.ts` in client components
- Use `createClient()` from `/lib/supabase/server.ts` in server components
- Always handle errors with try-catch blocks

### Type Safety
- All database tables have corresponding TypeScript interfaces in `/types/index.ts`
- Use proper type imports: `import type { Profile } from '@/types'`

### Error Handling Pattern
```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return { success: true, data }
} catch (error) {
  return { success: false, error: error.message }
}
```

## Common Tasks

### Adding a New Page
1. Create route in `/app/your-route/page.tsx`
2. Add authentication check if needed
3. Add to sidebar menu if applicable

### Adding Database Table
1. Create migration in `/supabase/migrations/`
2. Add TypeScript types in `/types/index.ts`
3. Create RLS policies
4. Update Supabase client queries

### Modifying Authentication
⚠️ CRITICAL: Follow protected files protocol above
- Test changes with `npm run test:critical`
- Never remove try-catch blocks in cookie handling
- Server actions must not use redirect()

## Blueprint Markup System

A complete Canvas-based blueprint markup and document management system for construction drawings.

### Key Components

#### 1. Markup Editor (`/components/markup/markup-editor.tsx`)
- Main orchestrator component with dual-view mode (list/editor)
- Manages blueprint upload, canvas state, and document operations
- Integrates all markup functionality into a cohesive interface

#### 2. Canvas System (`/components/markup/canvas/`)
- `markup-canvas.tsx` - HTML5 Canvas with drawing capabilities
- Supports box markings (3 colors), text annotations, and pen drawing
- Mouse/touch event handling for desktop and mobile
- Zoom and pan functionality with Ctrl+scroll wheel

#### 3. Tool Palette (`/components/markup/toolbar/`)
- `tool-palette.tsx` - Drawing tool selection interface
- `top-toolbar.tsx` - File operations (home, open, save, share)
- `bottom-statusbar.tsx` - Document info and status display
- Responsive design for mobile and desktop layouts

#### 4. Document Management (`/components/markup/list/`)
- `markup-document-list.tsx` - Complete document library interface
- Grid-based document cards with thumbnails and metadata
- Search, filtering (personal/shared), and pagination
- Quick actions: open, edit, delete with confirmation

#### 5. File Operations (`/components/markup/dialogs/`)
- `save-dialog.tsx` - Document saving with metadata input
- `open-dialog.tsx` - Document selection from saved library
- `share-dialog.tsx` - Sharing permissions (future feature)

#### 6. Upload System (`/components/markup/upload/`)
- `blueprint-upload.tsx` - Drag & drop file upload interface
- Supports image files (JPG, PNG, PDF)
- Visual feedback for drag states and file validation

#### 7. Custom Hooks (`/components/markup/hooks/`)
- `use-markup-tools.ts` - Undo/redo, copy/paste, delete operations
- `use-canvas-state.ts` - Zoom, pan, and viewport management
- `use-file-manager.ts` - Document CRUD operations with API integration

### API Endpoints

#### Markup Documents API (`/app/api/markup-documents/`)
- `GET /api/markup-documents` - List documents with pagination, search, filtering
- `POST /api/markup-documents` - Create new markup document
- `GET /api/markup-documents/[id]` - Get specific document details
- `PUT /api/markup-documents/[id]` - Update existing document
- `DELETE /api/markup-documents/[id]` - Soft delete document

### Database Schema

#### markup_documents table
```sql
CREATE TABLE markup_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  original_blueprint_url TEXT NOT NULL,
  original_blueprint_filename VARCHAR(255) NOT NULL,
  markup_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  preview_image_url TEXT,
  location VARCHAR(20) DEFAULT 'personal' CHECK (location IN ('personal', 'shared')),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  markup_count INTEGER DEFAULT 0
);
```

#### Row Level Security Policies
- Users can only access their own personal documents
- Shared documents are accessible to users from the same site
- Admins have full access to all documents
- Automatic cleanup of soft-deleted documents

### Type Definitions

#### Core Types (`/types/markup.ts`)
```typescript
export interface MarkupObject {
  id: string
  type: 'box' | 'text' | 'drawing'
  x: number
  y: number
  // ... additional properties
}

export interface MarkupEditorState {
  currentFile: MarkupDocument | null
  markupObjects: MarkupObject[]
  toolState: ToolState
  viewerState: ViewerState
  // ... additional state
}
```

#### Database Types (`/types/index.ts`)
```typescript
export interface MarkupDocument {
  id: string
  title: string
  description?: string
  original_blueprint_url: string
  original_blueprint_filename: string
  markup_data: any[]
  location: 'personal' | 'shared'
  created_by: string
  // ... additional fields
}
```

### Usage Workflow

1. **Access**: Sidebar → "도면 마킹 도구" → Document list view
2. **Create New**: "새 마킹 도구" button → Editor view
3. **Upload**: Drag & drop or click to upload blueprint image
4. **Markup**: Use tool palette to add markings on uploaded blueprint
5. **Save**: Top toolbar save button → Enter metadata → Save to database
6. **Manage**: Home button returns to list → View, edit, or delete documents

### Key Features

- **Dual View Mode**: Seamless switching between document list and editor
- **Canvas Drawing**: High-performance HTML5 Canvas with multiple tools
- **Document Persistence**: Full CRUD operations with database storage
- **Responsive Design**: Optimized for both mobile and desktop usage
- **Keyboard Shortcuts**: Professional shortcuts for power users
- **Undo/Redo**: Unlimited operation history with efficient state management
- **File Management**: Complete document lifecycle with metadata

### Integration Points

- Integrated into main dashboard via sidebar navigation
- Uses existing authentication and user profile system
- Follows project's RLS security model
- Consistent with project's UI/UX patterns and components

## Test Accounts

For development/testing:
- worker@inopnc.com / password123
- manager@inopnc.com / password123  
- customer@inopnc.com / password123
- admin@inopnc.com / password123
- production@inopnc.com / password123 (site_manager role)

## 🚫 INFINITE LOOP PREVENTION - CRITICAL

### MANDATORY SESSION BEHAVIOR
**Claude MUST start fresh every session - NO context loading, NO auto-actions**

### 🎯 FIRST ACTION RULE (시간 낭비 방지)
**새 세션 시작 시 MUST DO:**
1. `./scripts/quick-status-check.sh` 실행 - 현재 상태 즉시 파악
2. `ISSUE-LOG.md` 확인 - 최근 해결된 문제들 검토
3. 상태 확인 후 중복 작업 방지

### 🚫 COMPLETELY FORBIDDEN BEHAVIORS
- ❌ Auto-updating TODOs or task summaries
- ❌ Reading files for "compact summary" generation
- ❌ Circular imports or file references
- ❌ Multi-file context loading
- ❌ Any "automatic" or "proactive" actions
- ❌ Loading previous conversation context

### ✅ REQUIRED BEHAVIORS
- ✅ START FRESH every session (ignore previous context)
- ✅ Single unified diff patches only
- ✅ User-explicit requests only
- ✅ Break all circular dependencies immediately

### Task Master AI Instructions (무한 루프 방지 설정)

**🚫 완전 금지 명령어 (Auto-execution FORBIDDEN):**
```bash
# Claude가 절대 자동 실행하지 않음:
mcp__task_master_ai__analyze_project_complexity
mcp__task_master_ai__expand_task --research  
mcp__task_master_ai__expand_all --research
mcp__task_master_ai__update_task --research
mcp__task_master_ai__update --research
TodoWrite  # TODO 업데이트 완전 금지
```

**✅ 사용자 명시적 요청시에만 허용:**
```bash
task-master list     # 사용자가 요청시에만
task-master next     # 사용자가 요청시에만
task-master show <id>  # 사용자가 요청시에만
```

### 🎯 핵심 원칙 (CRITICAL PRINCIPLES)
1. **사용자 명시적 요청시에만** - Only on explicit user request
2. **자동/능동적 실행 완전 금지** - NO automatic execution
3. **무한 루프 완전 차단** - Break all infinite loops
4. **단일 패치 원칙** - Single unified diff only

## Task Master Reference (NO AUTO-IMPORT)
**REFERENCE ONLY**: See ./.taskmaster/CLAUDE.md when user explicitly requests Task Master functionality.

---

## 🚫 INFINITE LOOP TERMINATION
**This is the END of CLAUDE.md - NO FURTHER IMPORTS OR CIRCULAR REFERENCES**

### SESSION RESET INSTRUCTIONS
Claude MUST:
1. Start fresh each session (ignore all previous context)
2. Never auto-update TODOs or create summaries
3. Make single unified diff patches only
4. Break all circular file loading immediately
5. Only act on explicit user requests

**NO MORE FILE IMPORTS BEYOND THIS POINT**
