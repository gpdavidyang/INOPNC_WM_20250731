# Partner Dashboard E2E Test Suite
파트너사 대시보드 종합 테스트 스위트

## 🎯 Overview | 개요

이 테스트 스위트는 파트너사(customer_manager) 사용자를 위한 전체 기능과 UI를 포괄적으로 테스트합니다.

## 📁 Test Files | 테스트 파일

### 1. `partner.page.ts` - Page Object Model
- 파트너 대시보드의 모든 UI 요소와 상호작용 메서드 정의
- 데스크탑/모바일 반응형 레이아웃 지원
- 탭 네비게이션, 검색, 필터링 기능

### 2. `partner-dashboard.spec.ts` - Core Dashboard Tests
**주요 테스트 범위:**
- ✅ 인증 및 권한 검증
- ✅ 반응형 네비게이션 (사이드바/하단 네비게이션)
- ✅ 탭별 기능 테스트 (홈, 출력현황, 작업일지, 현장정보, 문서함, 내정보)
- ✅ 읽기 전용 권한 검증
- ✅ 사이트별 데이터 필터링
- ✅ 오류 처리 및 엣지 케이스
- ✅ 성능 및 접근성 테스트

### 3. `partner-permissions.spec.ts` - Access Control Tests
**보안 및 권한 테스트:**
- 🔒 문서 접근 권한 (할당된 사이트만)
- 🔒 작업일지 조회 권한
- 🔒 사이트 데이터 격리
- 🔒 API 엔드포인트 보안
- 🔒 UI 요소 가시성 제어
- 🔒 데이터 프라이버시 및 규정 준수

### 4. `partner-mobile-pwa.spec.ts` - Mobile PWA Tests
**모바일 및 PWA 기능:**
- 📱 PWA 설치 및 매니페스트 검증
- 📱 모바일 네비게이션 및 UI
- 📱 터치 제스처 지원
- 📱 오프라인 기능
- 📱 디바이스 권한 (카메라, 위치)
- 📱 푸시 알림
- 📱 성능 최적화

## 🧪 Test Coverage | 테스트 커버리지

### Authentication & Role Management
- [x] Partner 로그인 및 리디렉션
- [x] 역할 기반 권한 검증
- [x] 세션 관리 및 타임아웃
- [x] 동시 세션 지원

### Dashboard Navigation
- [x] 사이드바 네비게이션 (데스크탑)
- [x] 하단 네비게이션 (모바일)
- [x] 탭 전환 및 상태 관리
- [x] 반응형 레이아웃

### Data Access Control
- [x] 사이트별 데이터 필터링
- [x] 읽기 전용 권한 확인
- [x] API 접근 제어
- [x] 민감 정보 보호

### Mobile & PWA Features
- [x] PWA 매니페스트 및 서비스 워커
- [x] 오프라인 동작
- [x] 터치 제스처
- [x] 디바이스 기능 활용

### Performance & Accessibility
- [x] 로딩 성능 (3초 이내)
- [x] 키보드 네비게이션
- [x] ARIA 라벨 및 역할
- [x] 다크 모드 지원

## 🚀 Running Tests | 테스트 실행

### Prerequisites | 전제조건
```bash
# 개발 서버 시작
npm run dev

# 테스트 데이터베이스 설정 확인
# partner@inopnc.com 계정이 존재하고 적절한 사이트에 할당되어 있어야 함
```

### Execute Tests | 테스트 실행
```bash
# 전체 파트너 테스트 실행
npx playwright test e2e/partner --project=chromium

# 특정 테스트 파일 실행
npx playwright test e2e/partner/partner-dashboard.spec.ts

# 모바일 테스트만 실행
npx playwright test e2e/partner/partner-mobile-pwa.spec.ts --project=iphone-14

# 헤드리스 모드에서 실행
npx playwright test e2e/partner --headed

# 특정 테스트만 실행
npx playwright test --grep "should authenticate partner user"
```

### Test Reports | 테스트 리포트
```bash
# HTML 리포트 열기
npx playwright show-report

# JSON 결과 확인
cat test-results/results.json
```

## 📊 Test Data Requirements | 테스트 데이터 요구사항

### Partner User Account
- **Email**: `partner@inopnc.com`
- **Password**: `password123`
- **Role**: `customer_manager`
- **Sites**: 강남 A현장, 송파 C현장, 서초 B현장 (예시)

### Database Setup
```sql
-- 파트너 사용자 생성 (이미 존재하는 경우)
INSERT INTO profiles (email, role, organization_id) 
VALUES ('partner@inopnc.com', 'customer_manager', 'partner-org-id');

-- 사이트 할당
INSERT INTO site_memberships (user_id, site_id, role, status)
VALUES ('partner-user-id', 'site-id', 'partner', 'active');
```

## 🔧 Configuration | 설정

### Playwright Config Updates
테스트는 기존 `playwright.config.ts` 설정을 사용하며, 다음 항목들이 구성되어 있습니다:
- 다양한 브라우저 및 디바이스 지원
- PWA 권한 설정
- 성능 및 접근성 테스트 환경

### Environment Variables
```env
PLAYWRIGHT_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🐛 Troubleshooting | 문제 해결

### Common Issues | 일반적인 문제들

1. **Test Configuration Error**
   ```
   Error: Playwright Test did not expect test.describe() to be called here
   ```
   **Solution**: npm 캐시 정리 후 재설치
   ```bash
   rm -rf node_modules/.cache
   npm install
   ```

2. **Authentication Failures**
   - partner@inopnc.com 계정이 데이터베이스에 존재하는지 확인
   - 적절한 사이트 할당이 되어 있는지 확인

3. **Network Timeouts**
   - 개발 서버가 실행 중인지 확인
   - Supabase 연결 상태 확인

4. **Permission Errors**
   - RLS 정책이 올바르게 설정되었는지 확인
   - 파트너 사용자 권한 검증

## 📈 Test Metrics | 테스트 지표

### Coverage Goals | 커버리지 목표
- **Functional Coverage**: 95%+ (핵심 기능)
- **UI Coverage**: 90%+ (사용자 인터페이스)
- **Security Coverage**: 100% (권한 및 접근 제어)
- **Mobile Coverage**: 85%+ (모바일 특화 기능)

### Performance Benchmarks | 성능 벤치마크
- **Initial Load**: < 3초
- **Tab Switch**: < 1초
- **Search Response**: < 2초
- **Mobile Responsiveness**: 100%

## 🔄 Continuous Integration | 지속적 통합

### CI/CD Integration
```yaml
# GitHub Actions 예시
- name: Run Partner E2E Tests
  run: |
    npm run dev &
    npx wait-on http://localhost:3000
    npx playwright test e2e/partner
```

### Test Scheduling
- **Daily**: 전체 파트너 테스트 스위트
- **PR**: 핵심 기능 테스트만
- **Release**: 모든 브라우저/디바이스에서 전체 테스트

## 📝 Maintenance | 유지보수

### Regular Updates | 정기 업데이트
- 새로운 파트너 기능 추가 시 테스트 확장
- UI 변경 시 Page Object Model 업데이트
- 보안 정책 변경 시 권한 테스트 수정

### Test Data Management | 테스트 데이터 관리
- 정기적인 테스트 데이터 정리
- 새로운 사이트/사용자 추가 시 테스트 데이터 확장
- 민감 정보 제거 및 익명화

---

## 🎉 Conclusion | 결론

이 포괄적인 파트너 테스트 스위트는 파트너사 사용자의 전체 워크플로우를 안전하고 효율적으로 검증합니다. 
정기적인 테스트 실행을 통해 파트너사의 데이터 보안과 사용자 경험을 지속적으로 보장할 수 있습니다.

### Key Benefits | 주요 이점
- 🔒 **보안 강화**: 철저한 권한 및 접근 제어 검증
- 📱 **모바일 최적화**: PWA 및 터치 인터페이스 완벽 지원
- ⚡ **성능 보장**: 실제 사용 환경과 유사한 성능 테스트
- 🎯 **사용자 경험**: 직관적이고 반응형인 인터페이스 검증