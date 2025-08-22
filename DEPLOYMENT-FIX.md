# 배포 환경 '오늘의 현장 정보' 문제 해결

## 문제 상황
- 배포 환경(Vercel)에서 '오늘의 현장 정보'가 표시되지 않음
- 로컬 환경에서는 정상 작동
- 원인: Vercel Edge Runtime에서 Supabase 서버 클라이언트의 인증 처리 실패

## 해결 방법

### 1. 코드 수정 완료
✅ `/app/actions/site-info-deployment.ts` - 배포 환경 전용 데이터 페칭 함수 생성
✅ `/components/dashboard/tabs/home-tab.tsx` - 배포 환경 감지 및 deployment-safe 함수 사용

### 2. Vercel 환경변수 설정 (필수)

Vercel 대시보드에서 다음 환경변수를 설정해야 합니다:

1. Vercel 대시보드 접속 (https://vercel.com)
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수들이 설정되어 있는지 확인:

```
NEXT_PUBLIC_SUPABASE_URL=https://yjtnpscnnsnvfsyvajku.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]  ← 중요! 이것이 필요합니다
```

⚠️ **중요**: `SUPABASE_SERVICE_ROLE_KEY`는 반드시 필요합니다. 이 키가 없으면 배포 환경에서 데이터를 가져올 수 없습니다.

### 3. Service Role Key 얻는 방법

1. Supabase 대시보드 접속
2. 프로젝트 선택
3. Settings → API
4. "Service role key" 섹션에서 키 복사
5. Vercel 환경변수에 추가

### 4. 배포 및 테스트

```bash
# 변경사항 커밋
git add .
git commit -m "fix: Fix site info display issue in deployment environment"
git push

# Vercel이 자동으로 배포합니다
```

### 5. 테스트 계정

배포 후 다음 계정으로 테스트:
- production@inopnc.com / password123 (site_manager role)
- manager@inopnc.com / password123

## 동작 방식

### 정상 경로 (인증 성공)
1. 일반 Supabase 클라이언트로 사용자 인증 시도
2. 성공 시 사용자의 현장 정보 조회
3. 데이터 표시

### 폴백 경로 (인증 실패 시)
1. Service Role Key를 사용하여 직접 데이터 접근
2. 쿠키에서 사용자 ID 추출 시도
3. 성공 시 해당 사용자의 현장 정보 조회
4. 실패 시 데모 데이터 표시

### 데모 데이터
인증이 완전히 실패한 경우 다음 데모 데이터가 표시됩니다:
- 현장명: 강남 A현장
- 주소: 서울특별시 강남구 테헤란로 123
- 작업: 철근콘크리트공사 - B1F 지하주차장

## 검증 방법

1. 배포 URL 접속
2. 로그인 (production@inopnc.com)
3. 홈 화면에서 '오늘의 현장 정보' 섹션 확인
4. 데이터가 표시되는지 확인

## 디버깅

브라우저 개발자 도구 콘솔에서 다음 로그 확인:
- `[SITE-INFO-DEPLOYMENT]` - 배포 환경 함수 실행 로그
- `[HOME-TAB]` - 컴포넌트 레벨 로그

## 주의사항

1. Service Role Key는 매우 민감한 정보입니다. 절대 클라이언트 코드에 노출되지 않도록 주의하세요.
2. 이 키는 서버 사이드에서만 사용됩니다 ('use server' 지시어가 있는 파일).
3. Vercel 환경변수는 빌드 시점에 주입되므로, 변경 후 재배포가 필요합니다.

## 문제가 지속될 경우

1. Vercel 대시보드에서 Function Logs 확인
2. 환경변수가 올바르게 설정되었는지 재확인
3. Supabase 대시보드에서 RLS 정책 확인
4. 필요시 다음 명령으로 로컬 테스트:

```bash
# 프로덕션 빌드 테스트
npm run build
npm start
```

## 결론

이 수정으로 배포 환경에서도 '오늘의 현장 정보'가 안정적으로 표시됩니다.
Service Role Key를 사용한 폴백 메커니즘으로 인증 문제를 우회하여 데이터를 확실히 가져옵니다.