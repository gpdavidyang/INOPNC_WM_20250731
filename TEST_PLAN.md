# Comprehensive Test Plan - INOPNC Construction Management System
**Last Updated: 2025-07-30**

## Recent Changes Summary
- ✅ Cookie handling updated with try-catch blocks in `/lib/supabase/server.ts`
- ✅ Authentication actions now return success/error objects without redirects
- ✅ Client-side navigation using `window.location` for full page refresh
- ✅ Profile creation fallback added to dashboard
- ✅ Middleware improved with session refresh and better error handling

## 1. SUCCESS CRITERIA

### 1.1 Authentication System
- **Cookie Management**
  - ✅ No "Cookies can only be modified" errors in any component
  - ✅ Cookies properly set in Server Actions and Route Handlers only
  - ✅ Try-catch blocks handle cookie errors gracefully in server components
  - ✅ Session cookies persist correctly across page navigations
  - ✅ Secure cookie settings in production (httpOnly, sameSite: 'lax', secure)

- **Authentication Flow**
  - ✅ Users can successfully login with valid credentials
  - ✅ Failed login attempts are properly handled with error messages
  - ✅ Login actions return `{success: true}` or `{error: message}`
  - ✅ Client handles navigation with `window.location.href`
  - ✅ Session refresh works automatically in middleware
  - ✅ Logout clears all session data and returns success object
  - ✅ Password reset flow completes without errors
  - ✅ OAuth providers work if configured

- **Session Management**
  - ✅ Sessions persist for configured duration
  - ✅ Expired sessions redirect to login with return URL
  - ✅ Middleware attempts session refresh before redirect
  - ✅ Concurrent sessions handled appropriately
  - ✅ Session data accessible in both server and client components
  - ✅ getUser() used for reliable auth checks

### 1.2 Database Integrity
- **Profile Synchronization**
  - ✅ Every auth.users entry has corresponding profiles entry
  - ✅ Profile creation triggers work on signup
  - ✅ Dashboard creates profile if missing (fallback mechanism)
  - ✅ Profile updates reflect immediately
  - ✅ No orphaned profiles or auth entries
  - ✅ Login stats updated (last_login_at, login_count)

- **Relational Integrity**
  - ✅ Foreign key constraints enforced
  - ✅ Cascade deletes work properly
  - ✅ No duplicate entries in junction tables
  - ✅ Transactions complete atomically
  - ✅ Organization and site assignments created correctly

- **Data Consistency**
  - ✅ RLS policies properly enforce access control
  - ✅ Timestamps (created_at, updated_at) accurate
  - ✅ Enum values match database constraints
  - ✅ Required fields never null
  - ✅ Role assignments based on email domain

### 1.3 User Experience
- **Performance**
  - ✅ Login completes in < 2 seconds
  - ✅ Page transitions smooth without flicker
  - ✅ No loading spinners stuck indefinitely
  - ✅ API responses < 500ms for standard queries

- **Error Handling**
  - ✅ All errors display user-friendly messages
  - ✅ Network failures handled gracefully
  - ✅ Form validation provides clear feedback
  - ✅ No console errors in production

- **Navigation**
  - ✅ Role-based redirects work correctly
  - ✅ Protected routes enforce authentication
  - ✅ Back button behavior predictable
  - ✅ Deep links work after authentication

### 1.4 System Stability
- **Middleware**
  - ✅ No infinite redirect loops
  - ✅ Static assets load without authentication
  - ✅ API routes accessible as designed
  - ✅ Performance impact < 50ms per request

- **Component Architecture**
  - ✅ Server/client boundaries respected
  - ✅ No hydration mismatches
  - ✅ State management consistent
  - ✅ Memory leaks prevented

- **Error Recovery**
  - ✅ System recovers from database outages
  - ✅ Rate limiting prevents abuse
  - ✅ Logging captures critical errors
  - ✅ Monitoring alerts on failures

## 2. CRITICAL TEST SCENARIOS

### 2.1 Cookie Handling Tests
**Objective:** Verify no cookie errors occur during normal operation

**Test Steps:**
1. Clear all browser cookies and cache
2. Navigate to `/auth/login`
3. Open browser console (F12)
4. Login with valid credentials
5. Navigate through all pages:
   - Dashboard
   - Profile
   - Reports
   - Settings
6. **Expected:** No "Cookies can only be modified" errors in console
7. **Expected:** All pages load without authentication errors

### 2.2 Profile Synchronization Tests
**Objective:** Verify profile creation and fallback mechanisms

**Test Case 1: New User Signup**
1. Navigate to `/auth/signup`
2. Create new user with email `test.user@inopnc.com`
3. Complete signup process
4. **Expected:** Redirected to dashboard
5. Query database:
   ```sql
   SELECT * FROM auth.users WHERE email = 'test.user@inopnc.com';
   SELECT * FROM profiles WHERE email = 'test.user@inopnc.com';
   ```
6. **Expected:** Both records exist with matching IDs

**Test Case 2: Missing Profile Fallback**
1. Create auth user without profile:
   ```sql
   -- Create auth user via Supabase Auth Admin
   ```
2. Login with this user
3. **Expected:** Dashboard creates profile automatically
4. **Expected:** No errors displayed to user

### 2.3 Role-Based Access Tests
**Objective:** Verify proper access control for all 5 roles

**Test Matrix:**
| Role | Email Domain | Dashboard Access | Organization | Site Access |
|------|--------------|------------------|--------------|-------------|
| worker | @inopnc.com | Worker Dashboard | INOPNC | Site 1 |
| site_manager | @inopnc.com | Manager Dashboard | INOPNC | Site 1 |
| customer_manager | @partner.com | Customer Dashboard | Customer Org | None |
| admin | @inopnc.com | Admin Dashboard | INOPNC | All Sites |
| system_admin | @gmail.com | System Dashboard | INOPNC | All Sites |

**Test Steps for Each Role:**
1. Login with role-specific credentials
2. Verify correct dashboard variant displays
3. Check menu items match role permissions
4. Attempt to access restricted routes
5. **Expected:** Proper redirects for unauthorized access

### 2.4 Session Persistence Tests
**Objective:** Verify sessions persist and refresh correctly

**Test Case 1: Session Persistence**
1. Login successfully
2. Note auth cookies in browser
3. Close browser completely
4. Reopen browser and navigate to `/dashboard`
5. **Expected:** Still authenticated, no redirect to login

**Test Case 2: Session Refresh**
1. Login and wait near session expiry
2. Navigate to a new page
3. **Expected:** Session refreshes automatically
4. **Expected:** No authentication interruption

**Test Case 3: Expired Session**
1. Login successfully
2. Manually delete auth cookies
3. Navigate to protected route
4. **Expected:** Redirect to `/auth/login?redirectTo=/original-path`

## 3. TEST PLAN STRUCTURE

### 2.1 Unit Tests
Test individual functions and components in isolation.

**Coverage Areas:**
- Authentication helper functions
- Profile management utilities
- Cookie handling logic
- Validation functions
- Role permission checks
- Date/time utilities

### 2.2 Integration Tests
Test interactions between components and services.

**Coverage Areas:**
- Supabase client initialization
- Authentication flow integration
- Database operations with RLS
- Server action execution
- API route handlers
- Middleware processing

### 2.3 End-to-End Tests
Test complete user journeys across the application.

**User Journeys:**
1. New user registration → profile creation → dashboard access
2. Existing user login → session persistence → logout
3. Password reset request → email → reset completion
4. Role-based access → permission denial → redirect
5. Session expiry → auto-redirect → re-login
6. Multi-tab session synchronization

### 2.4 Manual Test Procedures
Human verification of critical paths and edge cases.

**Test Scenarios:**
- Browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsive behavior
- Network interruption handling
- Concurrent user sessions
- Production environment validation

## 3. TEST IMPLEMENTATION

### 3.1 Test Environment Setup
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @playwright/test
npm install --save-dev @types/jest jest-environment-jsdom

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test -- profile-manager.test.ts
```

### 3.2 Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## 4. TROUBLESHOOTING GUIDE

### 4.1 Common Issues and Solutions

#### Issue: "Cookies can only be modified" errors
**Symptoms:** Console errors when navigating pages
**Solution:**
1. Verify `/lib/supabase/server.ts` has try-catch block
2. Ensure cookies are only set in:
   - Server Actions (use server)
   - Route Handlers (/api routes)
   - Middleware
3. Never attempt to set cookies in Server Components

#### Issue: Profile not found after login
**Symptoms:** Error or blank dashboard after successful auth
**Solution:**
1. Check dashboard fallback mechanism is working
2. Verify profile creation in signup action
3. Run manual profile creation:
   ```sql
   INSERT INTO profiles (id, email, full_name, role, status)
   SELECT id, email, email, 'worker', 'active'
   FROM auth.users
   WHERE id NOT IN (SELECT id FROM profiles);
   ```

#### Issue: Session expires too quickly
**Symptoms:** Frequent logouts, redirects to login
**Solution:**
1. Check middleware session refresh logic
2. Verify Supabase JWT expiry settings
3. Ensure middleware runs on all protected routes
4. Check for clock drift between client and server

#### Issue: Role-based redirects not working
**Symptoms:** Wrong dashboard shown for user role
**Solution:**
1. Verify profile role is set correctly
2. Check email domain logic in signup
3. Ensure dashboard reads profile.role correctly
4. Clear browser cache and cookies

### 4.2 Database Validation Queries

```sql
-- Check for missing profiles
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Check for orphaned profiles
SELECT p.id, p.email, p.created_at
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- Verify role distribution
SELECT role, COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- Check organization assignments
SELECT p.email, p.role, o.name as org_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.organization_id IS NOT NULL;

-- Recent login activity
SELECT email, role, last_login_at, login_count
FROM profiles
WHERE last_login_at IS NOT NULL
ORDER BY last_login_at DESC
LIMIT 10;
```

## 5. VERIFICATION CHECKLIST

### 5.1 Pre-Deployment Verification
Execute this checklist before deploying to production:

#### Environment Setup
- [ ] Verify all environment variables are set correctly
  ```bash
  echo $NEXT_PUBLIC_SUPABASE_URL
  echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
  echo $DATABASE_URL
  ```
- [ ] Confirm Supabase project is properly configured
- [ ] Verify RLS policies are enabled on all tables
- [ ] Check database migrations are up to date
- [ ] Ensure all try-catch blocks are in place

#### Authentication System
- [ ] **Cookie Error Resolution**
  1. Start development server: `npm run dev`
  2. Open browser console (F12)
  3. Navigate through all pages
  4. Verify NO "Cookies can only be modified" errors appear
  5. Check Network tab for proper Set-Cookie headers
  6. Verify try-catch blocks in server.ts prevent errors
  7. Test with both server and client components

- [ ] **Login Flow**
  1. Navigate to `/auth/login`
  2. Enter valid credentials
  3. Click login button
  4. Verify loading state shows "로그인 중..."
  5. **Expected:** Full page refresh via window.location
  6. **Expected:** Redirect to appropriate dashboard
  7. Check browser cookies for auth tokens
  8. Verify no console errors
  9. Check login_count incremented in profiles table

- [ ] **Session Persistence**
  1. Login successfully
  2. Close browser completely
  3. Reopen and navigate to protected route
  4. Verify still authenticated
  5. Check session refresh works

- [ ] **Profile Synchronization**
  1. Create new user via signup
  2. Query database: `SELECT * FROM auth.users WHERE email = 'test@example.com';`
  3. Query profiles: `SELECT * FROM profiles WHERE email = 'test@example.com';`
  4. Verify both records exist and match
  5. Check organization and site assignments

#### Database Integrity
- [ ] **Run Database Validation Script**
  ```sql
  -- Check for orphaned profiles
  SELECT p.* FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  WHERE u.id IS NULL;

  -- Check for users without profiles
  SELECT u.* FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE p.id IS NULL;

  -- Verify foreign key constraints
  SELECT * FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';
  ```

- [ ] **Test RLS Policies**
  1. Login as worker
  2. Try to access another user's data via Supabase client
  3. Verify access denied
  4. Repeat for each role

#### Performance Testing
- [ ] **Load Time Metrics**
  1. Use Chrome DevTools Performance tab
  2. Measure login page load: < 1s
  3. Measure dashboard load: < 2s
  4. Check Time to First Byte (TTFB): < 200ms

- [ ] **Concurrent User Testing**
  1. Open 5 browser sessions
  2. Login with different users simultaneously
  3. Verify all sessions work independently
  4. Check server response times remain stable

#### Security Verification
- [ ] **Authentication Security**
  1. Verify passwords are hashed (check database)
  2. Test SQL injection on login form
  3. Test XSS on all input fields
  4. Verify HTTPS in production
  5. Check security headers (HSTS, CSP, etc.)

- [ ] **Session Security**
  1. Verify httpOnly cookies
  2. Check secure flag on cookies (production)
  3. Test session fixation attacks
  4. Verify CSRF protection

### 4.2 Post-Deployment Verification

#### Smoke Tests
- [ ] **Critical Path Testing**
  1. Sign up new user
  2. Login with existing user
  3. Create daily report
  4. View reports list
  5. Logout successfully

- [ ] **Role-Based Access**
  1. Test each role (worker, site_manager, customer_manager, admin, system_admin)
  2. Verify correct dashboard access
  3. Check menu items match role permissions
  4. Test unauthorized access attempts

#### Monitoring Setup
- [ ] **Error Tracking**
  1. Verify error logging service connected
  2. Test sample error capture
  3. Check alert notifications work
  4. Monitor for authentication errors

- [ ] **Performance Monitoring**
  1. Set up uptime monitoring
  2. Configure response time alerts
  3. Monitor database query performance
  4. Track failed login attempts

### 4.3 Manual Test Scripts

#### Test User Credentials
```
Worker: worker@inopnc.com / password123
Site Manager: manager@inopnc.com / password123
Admin: admin@inopnc.com / password123
Customer: customer@partner.com / password123
System Admin: system@inopnc.com / password123
Special Admin: davidswyang@gmail.com / password123
```

#### Browser Test Matrix
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

#### Network Conditions
- [ ] Fast 3G
- [ ] Slow 3G
- [ ] Offline behavior
- [ ] Intermittent connection

### 5.4 Rollback Plan
If critical issues are discovered:

1. **Immediate Actions**
   - [ ] Revert to previous deployment
   - [ ] Clear CDN cache
   - [ ] Notify users of temporary issues

2. **Database Rollback**
   - [ ] Have migration rollback scripts ready
   - [ ] Backup current data before changes
   - [ ] Test rollback procedure in staging

3. **Communication**
   - [ ] Prepare user communication templates
   - [ ] Have support team ready
   - [ ] Document all issues found

## 6. EXECUTION PLAN

### 6.1 Prerequisites
- [ ] Local development environment setup
- [ ] Access to Supabase project
- [ ] Test user accounts created
- [ ] Database backup completed
- [ ] Browser dev tools ready

### 6.2 Step-by-Step Testing Procedure

**Phase 1: Environment Verification (15 min)**
1. Verify all services running
2. Check database connectivity
3. Confirm environment variables
4. Clear all test data

**Phase 2: Authentication Testing (30 min)**
1. Test each user role login
2. Verify cookie handling
3. Check session persistence
4. Test logout functionality
5. Verify error handling

**Phase 3: Database Integrity (20 min)**
1. Run validation queries
2. Test profile creation
3. Verify role assignments
4. Check foreign keys

**Phase 4: User Experience (25 min)**
1. Test all navigation paths
2. Verify loading states
3. Check error messages
4. Test responsive design

**Phase 5: Edge Cases (20 min)**
1. Test network interruptions
2. Concurrent sessions
3. Session expiry
4. Invalid data inputs

### 6.3 Expected Results Summary
- ✅ Zero cookie-related errors
- ✅ 100% profile synchronization
- ✅ All role-based access working
- ✅ Session management stable
- ✅ < 2 second login time
- ✅ Graceful error handling
- ✅ No console errors

## 7. CONTINUOUS TESTING

### 7.1 Automated CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
```

### 7.2 Monitoring Dashboards
- Authentication success/failure rates
- Average login time
- Session duration metrics
- Error rates by component
- Database query performance

### 7.3 Regular Security Audits
- Monthly dependency updates
- Quarterly security scans
- Annual penetration testing
- Continuous RLS policy review