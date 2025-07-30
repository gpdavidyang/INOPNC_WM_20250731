# Authentication System Fix Guide

This guide explains the comprehensive authentication system fix implemented for the construction worklog application.

## Overview

The authentication system has been completely overhauled to provide:
- Proper role-based access control (RBAC)
- Organization and site-based data isolation
- Comprehensive RLS policies
- User profile management with automatic setup
- Authentication audit logging

## Files Created

### 1. SQL Migration File
**Location:** `/supabase/migrations/102_fix_authentication_system.sql`

This migration file:
- Adds missing `organization_id` and `site_id` columns to profiles table
- Creates default organizations and sites
- Updates the `handle_new_user()` trigger function
- Fixes existing user profiles with proper roles and assignments
- Implements comprehensive RLS policies for all tables
- Creates helper functions for role and access checking
- Adds authentication audit logging

### 2. Profile Manager Utility
**Location:** `/lib/auth/profile-manager.ts`

The ProfileManager class provides:
- User profile checking and validation
- Automatic profile creation/update on login
- Login statistics tracking
- Authentication event logging
- Site access management
- Role-based redirect logic

### 3. Authentication Hook
**Location:** `/hooks/use-auth.tsx`

The useAuth hook provides:
- Complete authentication state management
- Automatic profile fetching with organization/site data
- Role-based access control helpers
- Protected route HOC (`withAuth`)
- Role-based UI rendering helpers

## How to Apply the Fix

### Option 1: Using the Script (Recommended)
```bash
cd /Users/davidyang/workspace/INOPNC_WM_20250731
./scripts/fix-auth-system.sh
```

### Option 2: Manual Application
```bash
cd /Users/davidyang/workspace/INOPNC_WM_20250731
supabase db push
```

## User Role Assignments

After applying the migration, the following users will have these roles:

| Email | Role | Organization | Site |
|-------|------|--------------|------|
| admin@inopnc.com | admin | INOPNC | - |
| manager@inopnc.com | site_manager | INOPNC | Site 1 |
| worker@inopnc.com | worker | INOPNC | Site 1 |
| customer@inopnc.com | customer_manager | Customer Corp | - |
| davidswyang@gmail.com | system_admin | INOPNC | - |

## Role Permissions

### system_admin
- Full system access
- Can manage all organizations, sites, and users
- Can view and modify all data

### admin
- Organization-wide access
- Can manage sites within their organization
- Can manage users and approve reports
- Can view all data within their organization

### site_manager
- Site-specific access with management capabilities
- Can approve daily reports
- Can manage workers at their site
- Can view all data for their assigned sites

### customer_manager
- Read-only access to organization data
- Can view reports from all sites in their organization
- Cannot create or modify data

### worker
- Limited access to own data and assigned site
- Can create daily reports
- Can view own attendance and reports
- Can only modify draft reports they created

## Using the Authentication System

### In React Components

```tsx
import { useAuth, useRoleBasedAccess } from '@/hooks/use-auth'

function MyComponent() {
  const { user, profile, loading } = useAuth()
  const { isAdmin, canApproveReports } = useRoleBasedAccess()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>Welcome, {profile?.full_name}</h1>
      <p>Role: {profile?.role}</p>
      <p>Organization: {profile?.organization_name}</p>
      
      {canApproveReports && (
        <button>Approve Reports</button>
      )}
    </div>
  )
}
```

### Protected Routes

```tsx
import { withAuth } from '@/hooks/use-auth'

// Protect a page - only authenticated users
export default withAuth(MyPage)

// Protect with specific roles
export default withAuth(AdminPage, {
  requiredRoles: ['admin', 'system_admin'],
  redirectTo: '/unauthorized'
})
```

### Checking Site Access

```tsx
const { canAccessSite, getUserSites } = useAuth()

// Check if user can access a specific site
const hasAccess = await canAccessSite('site-id-here')

// Get all sites user can access
const sites = await getUserSites()
```

## Troubleshooting

### Profile Not Loading
If a user's profile isn't loading properly:
1. Check the browser console for errors
2. Verify the user exists in the auth.users table
3. Check if the profile exists in the profiles table
4. Ensure the trigger function is working properly

### Access Denied Issues
If users can't access data they should be able to:
1. Verify their role assignment in the profiles table
2. Check their organization_id and site_id assignments
3. Review the RLS policies for the affected table
4. Check if they have entries in user_organizations and site_assignments tables

### Migration Errors
If the migration fails:
1. Check if you have the correct database permissions
2. Verify no conflicting migrations exist
3. Check the Supabase logs for detailed error messages
4. Ensure the organizations and sites tables exist

## Security Considerations

1. **Password Security**: All passwords are hashed using Supabase Auth
2. **Session Management**: Sessions are managed by Supabase with secure httpOnly cookies
3. **RLS Policies**: All tables have row-level security enabled
4. **Audit Logging**: All authentication events are logged for security monitoring
5. **Role Validation**: Roles are validated at both application and database levels

## Next Steps

After applying this fix:
1. Test login with each of the 5 user accounts
2. Verify role-based access is working correctly
3. Check that users can only see appropriate data
4. Monitor the auth_audit_logs table for any issues
5. Consider implementing additional security measures like MFA