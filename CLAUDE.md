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

Before modifying ANY of these files, you MUST:
1. Run `npm run test:critical` to verify current state
2. Explain why the change is necessary
3. Create a backup with `npm run snapshot:save "reason"`
4. Get explicit user confirmation

## Development Commands

```bash
# Development
npm run dev              # Start development server (default: http://localhost:3000)

# Building & Testing
npm run build            # Create production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test             # Run Jest tests
npm run test:watch       # Run Jest in watch mode
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run Playwright with UI
npm run test:critical    # Test critical authentication features

# Code Protection
npm run snapshot:save "reason"  # Save code snapshot before critical changes
npm run protect:check          # Verify critical features are working
```

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

### User Roles
- `worker` - Basic worker, can view/create own reports
- `site_manager` - Manages specific construction sites
- `customer_manager` - External customer access
- `admin` - Organization admin
- `system_admin` - Full system access

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

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
