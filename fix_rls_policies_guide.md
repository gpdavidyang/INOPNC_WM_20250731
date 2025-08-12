# RLS 정책 수정 가이드 - 503/401 오류 해결

## 현재 상황
마이그레이션 스크립트가 성공적으로 실행되어 필요한 테이블들이 생성되었지만, 여전히 503/401 오류가 발생하고 있습니다. 진단 결과 **Row-Level Security (RLS) 정책 위반**이 근본 원인입니다.

## 오류 원인
- **에러 코드 42501**: "new row violates row-level security policy for table 'analytics_metrics'"
- `aggregate_daily_analytics` 함수 호출 시 RLS 정책으로 인해 접근이 차단됨
- 이로 인해 /api/analytics/metrics에서 503 오류, /api/push/subscribe에서 401 오류 발생

## 해결 방법

### 1. Supabase 대시보드 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **"SQL Editor"** 클릭

### 2. RLS 정책 수정 스크립트 실행
아래 스크립트를 SQL Editor에 복사하고 실행하세요:

```sql
-- Fix RLS Policy Violations for Production Environment
-- This script addresses the Row-Level Security policy issues causing 503/401 errors

-- =============================================================================
-- ANALYTICS_METRICS TABLE RLS POLICY FIXES
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "analytics_metrics_access_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_insert_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_update_policy" ON analytics_metrics;
DROP POLICY IF EXISTS "analytics_metrics_delete_policy" ON analytics_metrics;

-- Create comprehensive RLS policies for analytics_metrics table
-- Policy 1: SELECT - Allow authenticated users to read analytics data
CREATE POLICY "analytics_metrics_select_policy" ON analytics_metrics
FOR SELECT 
TO authenticated
USING (
  -- System admins can see all data
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- Organization admins and site managers can see their organization's data
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager', 'customer_manager')
    AND
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  OR
  -- Workers can see their organization's aggregated data
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'worker'
    AND
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- Policy 2: INSERT - Allow system and applications to insert analytics data
CREATE POLICY "analytics_metrics_insert_policy" ON analytics_metrics
FOR INSERT 
TO authenticated
WITH CHECK (
  -- System admins can insert anything
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
  OR
  -- Admins and site managers can insert for their organization
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'site_manager')
    AND
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  OR
  -- Allow inserts with NULL organization_id for system-generated metrics
  organization_id IS NULL
  OR
  -- Allow inserts for the user's organization
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- Policy 3: UPDATE - Allow authorized updates
CREATE POLICY "analytics_metrics_update_policy" ON analytics_metrics
FOR UPDATE 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('system_admin', 'admin', 'site_manager')
  AND
  (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
    OR
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
);

-- Policy 4: DELETE - Restrict to system admins only
CREATE POLICY "analytics_metrics_delete_policy" ON analytics_metrics
FOR DELETE 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- =============================================================================
-- PUSH_SUBSCRIPTIONS TABLE RLS POLICY FIXES
-- =============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "push_subscriptions_access_policy" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert_policy" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update_policy" ON push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete_policy" ON push_subscriptions;

-- Create comprehensive RLS policies for push_subscriptions table
-- Policy 1: SELECT - Users can see their own subscriptions
CREATE POLICY "push_subscriptions_select_policy" ON push_subscriptions
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- Policy 2: INSERT - Users can create their own subscriptions
CREATE POLICY "push_subscriptions_insert_policy" ON push_subscriptions
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- Policy 3: UPDATE - Users can update their own subscriptions
CREATE POLICY "push_subscriptions_update_policy" ON push_subscriptions
FOR UPDATE 
TO authenticated
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- Policy 4: DELETE - Users can delete their own subscriptions
CREATE POLICY "push_subscriptions_delete_policy" ON push_subscriptions
FOR DELETE 
TO authenticated
USING (
  user_id = auth.uid()
  OR
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'system_admin'
);

-- =============================================================================
-- FUNCTION ACCESS FIXES
-- =============================================================================

-- Grant execute permissions on analytics functions to authenticated users
GRANT EXECUTE ON FUNCTION aggregate_daily_analytics(UUID, UUID, DATE) TO authenticated;

-- Ensure the function can access necessary tables
GRANT SELECT, INSERT, UPDATE ON analytics_metrics TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('analytics_metrics', 'push_subscriptions')
ORDER BY tablename, policyname;
```

### 3. 실행 확인
1. **"Run"** 버튼 클릭하여 스크립트 실행
2. 오류 없이 성공적으로 실행되는지 확인
3. 마지막 SELECT 쿼리 결과에서 정책들이 올바르게 생성되었는지 확인

### 4. 애플리케이션 테스트
1. 배포된 도메인에서 로그인 시도
2. 503/401 오류가 해결되었는지 확인
3. 대시보드 기능들이 정상 작동하는지 테스트

## 해결되는 문제들
- ✅ `/api/analytics/metrics` 503 오류 해결
- ✅ `/api/push/subscribe` 401 오류 해결
- ✅ `aggregate_daily_analytics` 함수 접근 권한 수정
- ✅ 인증된 사용자의 적절한 데이터 접근 허용

## 기대 결과
이 수정 후에는 프로덕션 환경에서 로그인이 정상적으로 작동하고, 모든 API 엔드포인트가 올바르게 응답해야 합니다.