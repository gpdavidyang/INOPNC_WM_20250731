# Supabase Migrations

## 실행 순서

아래 SQL 파일들을 Supabase SQL Editor에서 순서대로 실행해주세요:

1. **002_fix_profiles_rls.sql**
   - profiles 테이블의 RLS 정책 수정
   - 인증된 사용자가 프로필을 조회할 수 있도록 설정

2. **005_create_profile_trigger.sql**
   - 사용자 가입 시 자동으로 profile 생성하는 트리거
   - auth.users 테이블에 INSERT 시 profiles 테이블에 자동으로 레코드 생성

3. **006_fix_profile_creation.sql** (가장 중요!)
   - 기존 사용자들의 누락된 프로필 생성
   - 트리거 재생성 및 권한 설정
   - 이 스크립트를 실행하면 profiles 테이블이 채워집니다

## 실행 방법

1. Supabase Dashboard 접속
2. SQL Editor 탭 클릭
3. 각 파일의 내용을 복사하여 실행
4. 실행 후 `test-profile-creation.sql`로 결과 확인

## 테스트

`test-profile-creation.sql` 파일을 실행하여:
- 현재 사용자와 프로필 매핑 상태 확인
- 트리거와 함수가 제대로 생성되었는지 확인

## 문제 해결

프로필이 여전히 생성되지 않는다면:
1. Supabase Dashboard에서 auth.users 테이블 확인
2. public.profiles 테이블 확인
3. Database Logs에서 에러 메시지 확인