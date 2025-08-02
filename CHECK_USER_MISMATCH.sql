-- 🔍 사용자 ID 불일치 확인 SQL
-- SQL Editor 사용자와 웹 앱 사용자 비교

-- ==========================================
-- 1. SQL Editor에서 현재 사용자 확인
-- ==========================================
SELECT 
  '=== SQL Editor 사용자 (관리자) ===' as info,
  auth.uid() as sql_editor_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as sql_editor_email;

-- ==========================================
-- 2. 모든 사용자 목록 확인
-- ==========================================
SELECT 
  '=== 전체 사용자 목록 ===' as info;

SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- ==========================================
-- 3. 테스트 계정 찾기
-- ==========================================
SELECT 
  '=== 테스트 계정 정보 ===' as info;

SELECT 
  id as user_id,
  email
FROM auth.users
WHERE email IN ('worker@inopnc.com', 'manager@inopnc.com', 'customer@inopnc.com', 'admin@inopnc.com');

-- ==========================================
-- 4. 현재 배정 상태 확인
-- ==========================================
SELECT 
  '=== 현재 배정 상태 ===' as info;

SELECT 
  sa.user_id,
  u.email,
  sa.site_id,
  s.name as site_name,
  sa.is_active,
  sa.assigned_date
FROM public.site_assignments sa
JOIN auth.users u ON sa.user_id = u.id
JOIN public.sites s ON sa.site_id = s.id
WHERE sa.is_active = true
ORDER BY u.email;