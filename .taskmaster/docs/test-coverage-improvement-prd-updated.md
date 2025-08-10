# Test Coverage Improvement Plan PRD (Updated 2025-08-03)

## Overview
This document outlines a comprehensive test coverage improvement plan for the INOPNC Work Management System. The current test coverage is at 6%, and our goal is to systematically increase it to 80% through targeted testing efforts.

## Current State Analysis
- Overall Coverage: 6.08% (822/13,517 statements)
- Critical Issues:
  - `app/actions`: 0% coverage (authentication and business logic)
  - `app/actions/admin`: 0% coverage (admin operations)
  - API endpoints: Very low coverage
  - Many failing tests due to mock configuration issues

## Recent Changes Requiring Test Updates (2025-08-03)
1. **Attendance System → Labor Hours (공수) System**
   - New labor_hours field in attendance records
   - 1.0 공수 = 8 hours calculation logic
   - Calendar visualization with labor hours
   - PDF payslip generation

2. **Documents System Unification**
   - Merged "My Documents" and "Shared Documents" into single "Documents" tab
   - New card-based UI layout
   - File type color coding system

3. **PWA Implementation (Partial)**
   - Service Worker registration
   - Offline page functionality
   - Manifest.json configuration

4. **Analytics API Endpoints**
   - New analytics routes requiring testing
   - Performance monitoring endpoints

## Goals
1. Achieve 80% overall test coverage
2. 100% coverage for critical authentication flows
3. 90% coverage for API endpoints
4. Establish sustainable testing practices
5. **Ensure all recent changes are properly tested**

## Implementation Phases

### Phase 1: Critical Authentication and Security (Target: 20% coverage)
- Test all authentication flows in `/lib/supabase/` and `/app/auth/`
- Cover middleware authentication checks
- Test protected route access control
- Implement proper Supabase mocking utilities
- Priority: CRITICAL - These are the foundation of application security

### Phase 2: Core API Endpoints Testing (Target: 40% coverage)
- Test all CRUD operations for main entities:
  - `/api/markup-documents` - Document management API
  - `/api/sites` - Site management endpoints
  - `/api/health` - Health check endpoint
  - **NEW: `/api/analytics/*` - Analytics endpoints** ✨
- Test labor hours calculation in attendance endpoints
- Test document unification logic
- Implement comprehensive request/response validation tests
- Test error handling and edge cases
- Add integration tests for database operations

### Phase 3: Business Logic and Actions (Target: 60% coverage)
- Test all server actions in `/app/actions/`:
  - Daily report operations
  - **Attendance management with labor hours (공수) calculations** ✨
  - Document operations (unified system)
  - Notification system
  - **PDF generation for payslips** ✨
- Test complex business rules and calculations:
  - **Labor hours to work hours conversion (1.0 공수 = 8 hours)** ✨
  - Overtime calculations based on labor hours
  - Monthly aggregations
- Cover data validation and transformation logic
- Test transaction handling and rollback scenarios

### Phase 4: Component Testing (Target: 70% coverage)
- Test critical UI components:
  - Markup editor and canvas components
  - Dashboard components
  - **Attendance calendar with labor hours display** ✨
  - **Unified documents tab with card layout** ✨
  - Form components with validation
  - Data display components
- Test new UI features:
  - **File type color coding badges** ✨
  - **Sticky headers** ✨
  - **Mobile-optimized layouts** ✨
- Implement component interaction tests
- Test responsive behavior and accessibility
- Cover error states and loading states

### Phase 5: Integration and E2E Testing (Target: 80% coverage)
- Implement full user journey tests:
  - Login → Create Report → Submit
  - **Attendance entry with labor hours → PDF payslip generation** ✨
  - Document upload and management in unified system
  - Markup tool workflow
- Test PWA functionality:
  - **Service Worker registration and caching** ✨
  - **Offline page functionality** ✨
  - **App installation flow** ✨
- Test cross-component interactions
- Verify data persistence and retrieval
- Test real-world scenarios and edge cases

## Technical Requirements

### Testing Infrastructure
1. Fix and enhance test setup:
   - Proper Supabase mock configuration
   - Consistent test data factories
   - Reliable async operation handling
   - Test isolation and cleanup

2. Testing utilities needed:
   - `createMockSupabaseClient()` - Fully configured mock
   - `createAuthenticatedUser()` - Test user setup
   - `renderWithProviders()` - Component wrapper
   - `waitForLoadingToFinish()` - Async helper
   - **`createMockAttendanceWithLaborHours()` - Labor hours test data** ✨
   - **`createMockDocument()` - Unified document test data** ✨

### Testing Standards
1. Unit Tests:
   - All functions must have corresponding tests
   - Edge cases and error scenarios covered
   - Mocks should be realistic and maintainable
   - **Labor hours calculations must be precise** ✨

2. Integration Tests:
   - API endpoints tested with various payloads
   - Database operations verified
   - Authentication and authorization tested
   - **PDF generation tested with mock data** ✨

3. E2E Tests:
   - Critical user paths covered
   - Cross-browser compatibility verified
   - Performance benchmarks established
   - **PWA functionality validated** ✨

### Success Metrics
- Coverage increases measured weekly
- No regression in existing functionality
- All new code includes tests (TDD approach)
- CI/CD pipeline remains stable
- **All recent changes have >90% coverage** ✨

## Resource Requirements
- Estimated effort: 4-6 weeks
- Testing frameworks: Jest, React Testing Library, Playwright
- Additional tools: MSW for API mocking, jest-dom for assertions
- **PDF testing library for payslip generation tests** ✨

## Risk Mitigation
- Incremental approach to avoid breaking changes
- Maintain separate test database
- Regular backups before major test changes
- Parallel test execution for performance
- **Ensure labor hours calculations are accurate in all timezones** ✨

## Deliverables per Phase
1. Phase 1: Auth test suite, mock utilities, 20% coverage
2. Phase 2: API test suite including analytics, integration tests, 40% coverage
3. Phase 3: Business logic tests with labor hours, 60% coverage
4. Phase 4: Component test library for unified UI, 70% coverage
5. Phase 5: E2E test suite with PWA tests, 80% coverage, testing documentation

## Priority Testing Areas Based on Recent Changes
1. **Labor Hours System** - Critical business logic
2. **Document Unification** - User-facing changes
3. **PWA Functionality** - New feature requiring validation
4. **Analytics API** - New endpoints needing coverage
5. **PDF Generation** - Important output functionality