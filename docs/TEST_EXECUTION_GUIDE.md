# 테스트 실행 가이드

## 1. 테스트 환경 준비

### 필수 설치 항목
```bash
# Jest 및 React Testing Library (이미 설치됨)
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Playwright 설치 (브라우저 포함)
npm install --save-dev @playwright/test
npx playwright install
```

### 환경 변수 설정
```bash
# .env.test 파일 생성
cp .env.example .env.test

# 테스트용 Supabase 프로젝트 정보 입력
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key
```

## 2. 테스트 실행 명령어

### Unit Tests
```bash
# 모든 unit 테스트 실행
npm test

# watch 모드로 실행
npm run test:watch

# 특정 파일/폴더만 테스트
npm test -- components/button
npm test -- --testNamePattern="should render"

# 커버리지 포함 실행
npm test -- --coverage
```

### Integration Tests
```bash
# integration 테스트만 실행
npm test -- --testPathPattern=integration

# 특정 integration 테스트
npm test -- --testPathPattern=integration/auth
```

### E2E Tests
```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행 (디버깅용)
npm run test:e2e:ui

# 특정 브라우저만 테스트
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=mobile-chrome

# 특정 spec 파일만 실행
npm run test:e2e -- e2e/auth/login.spec.ts
```

### Critical Features Test
```bash
# 핵심 기능 테스트 (인증, 쿠키 처리 등)
npm run test:critical
```

## 3. 커버리지 목표 및 확인

### 커버리지 보고서 생성
```bash
# HTML 형식 커버리지 보고서
npm test -- --coverage --coverageReporters=html

# 브라우저에서 확인
open coverage/index.html
```

### 목표 커버리지
- **전체**: 70% 이상
- **핵심 경로** (인증, 결제): 90% 이상
- **UI 컴포넌트**: 80% 이상
- **비즈니스 로직**: 85% 이상
- **유틸리티**: 95% 이상

### 커버리지 확인 스크립트
```bash
# 커버리지 임계값 검증
npm test -- --coverage --coverageThreshold='{
  "global": {
    "branches": 70,
    "functions": 70,
    "lines": 70,
    "statements": 70
  }
}'
```

## 4. CI/CD 파이프라인 통합

### GitHub Actions 워크플로우
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Unit Tests
        run: npm test -- --coverage
      
      - name: Run E2E Tests
        run: npm run test:e2e
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
      
      - name: Comment PR with results
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const coverage = require('./coverage/coverage-summary.json');
            const comment = `## Test Results
            
            ✅ All tests passed!
            
            ### Coverage Report
            - Statements: ${coverage.total.statements.pct}%
            - Branches: ${coverage.total.branches.pct}%
            - Functions: ${coverage.total.functions.pct}%
            - Lines: ${coverage.total.lines.pct}%
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## 5. 테스트 디버깅

### Jest 디버깅
```bash
# Node 디버거 연결
node --inspect-brk ./node_modules/.bin/jest --runInBand

# VS Code 디버깅 설정 (.vscode/launch.json)
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Playwright 디버깅
```bash
# 디버그 모드 실행
PWDEBUG=1 npm run test:e2e

# 특정 테스트만 디버깅
npm run test:e2e -- --debug e2e/auth/login.spec.ts

# 브라우저 개발자 도구 활용
npm run test:e2e -- --headed --slowmo=1000
```

## 6. 테스트 실행 순서 권장사항

1. **개발 중**
   ```bash
   # TDD 접근
   npm run test:watch
   ```

2. **커밋 전**
   ```bash
   # 관련 테스트 실행
   npm test -- --related
   
   # 핵심 기능 확인
   npm run test:critical
   ```

3. **PR 생성 전**
   ```bash
   # 전체 테스트 스위트
   npm test -- --coverage
   npm run test:e2e
   ```

4. **배포 전**
   ```bash
   # 모든 테스트 + 성능 확인
   npm test -- --coverage
   npm run test:e2e -- --reporter=html
   npm run test:critical
   ```

## 7. 일반적인 문제 해결

### Supabase 연결 오류
```bash
# 테스트 DB 리셋
npm run supabase:reset:test

# RLS 정책 확인
npm run supabase:test:rls
```

### Playwright 타임아웃
```javascript
// 타임아웃 증가
test.setTimeout(60000);

// 특정 액션에만 타임아웃 설정
await page.goto('/', { timeout: 30000 });
```

### 스냅샷 업데이트
```bash
# 의도적인 UI 변경 시
npm test -- -u

# 특정 스냅샷만 업데이트
npm test -- -u Button.test.tsx
```

## 8. 테스트 성능 최적화

### 병렬 실행
```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%', // CPU 코어의 50% 사용
};
```

### 테스트 캐싱
```bash
# 캐시 지우기
npm test -- --clearCache

# 캐시 사용하여 실행
npm test -- --cache
```

### 느린 테스트 찾기
```bash
# 실행 시간 리포트
npm test -- --verbose --logHeapUsage
```

---

이 가이드를 참고하여 효율적인 테스트 실행과 관리를 수행하세요.