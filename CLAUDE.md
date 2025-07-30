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
│   ├── auth/              # Authentication pages (login, signup, reset-password)
│   ├── dashboard/         # Main dashboard and sub-pages
│   └── api/               # API routes
├── components/            # Reusable React components
│   └── dashboard/         # Dashboard-specific components
├── lib/                   # Utility functions and configurations
│   ├── supabase/         # Supabase client configurations
│   └── auth/             # Authentication utilities
├── types/                # TypeScript type definitions
├── supabase/             # Database migrations and seeds
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
- `attendance_records` - Worker attendance
- `documents` - File management
- `notifications` - User notifications

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

## Test Accounts

For development/testing:
- worker@inopnc.com / password123
- manager@inopnc.com / password123
- customer@inopnc.com / password123
- admin@inopnc.com / password123