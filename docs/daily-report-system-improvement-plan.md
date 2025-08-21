# 작업일지 시스템 통합 개선 계획
*작성일: 2025-08-21*

## 📊 현재 상태 분석

### 1. 작업일지 작성 화면 (`daily-report-form-enhanced.tsx`)
✅ **최신 기능 완비**
- CollapsibleSection UI 패턴 적용
- 10개 주요 섹션 구현
  - 작업 내용 및 사진 관리
  - 작업자 입력
  - 추가 사진 업로드 (AdditionalPhotoUploadSection)
  - 영수증 첨부
  - 진행 도면 업로드
  - 본사에게 요청
  - NPC-1000 자재관리
  - 특이사항
  - 날씨 정보
  - 기타 확장 섹션들
- localStorage 임시저장 기능
- 확장/축소 가능한 섹션 UI
- 파일 검증 로직 통합

### 2. 작업일지 상세 화면 (`DailyReportDetailView.tsx`)
❌ **구식 구조로 업데이트 필요**
- 탭 기반 UI (overview, details, photos, approval)
- 일부 섹션만 표시
- 추가 사진 업로드 섹션 없음
- CollapsibleSection 패턴 미적용
- 최신 데이터 타입 미반영

### 3. 작업일지 수정 화면 (`daily-report-form-edit.tsx`)
❌ **매우 기본적인 구조**
- 기본 필드만 존재
- 확장 섹션 없음
- 추가 사진, 영수증, 도면 등 누락
- daily-report-form-enhanced의 기능 미반영

## 🎯 개선 목표

1. **일관성**: 모든 화면에서 동일한 사용자 경험 제공
2. **완전성**: 모든 데이터 필드 지원
3. **유지보수성**: 코드 중복 제거, 재사용성 향상
4. **사용성**: 직관적인 UI로 학습 곡선 감소
5. **확장성**: 새로운 섹션 추가 용이

## 📋 구현 계획

### Phase 1: 작업일지 상세 화면 현대화

#### 1.1 UI 구조 개선
- [ ] 탭 기반 UI → CollapsibleSection 기반으로 변경
- [ ] daily-report-form-enhanced와 동일한 섹션 구조 적용
- [ ] 모든 10개 섹션 표시

#### 1.2 새로운 섹션 추가
- [ ] ✨ 추가 사진 섹션 (`additional_before_photos`, `additional_after_photos`)
- [ ] 📎 영수증 섹션 (`receipts`)
- [ ] 📐 도면 섹션 (`drawings`)
- [ ] 💬 요청사항 섹션 (`requests`)
- [ ] 🌤️ 날씨 정보 섹션 (`weather_conditions`)
- [ ] 🔧 장비 사용 섹션 (`equipment_usage`)
- [ ] ⚠️ 안전 사고 섹션 (`safety_incidents`)
- [ ] ✅ 품질 검사 섹션 (`quality_inspections`)
- [ ] 👥 협력업체 섹션 (`subcontractor_workers`, `partner_companies`)

#### 1.3 데이터 통합
- [ ] `DailyReportFormData` 타입 완전 활용
- [ ] 모든 관련 데이터 fetch 및 표시
- [ ] 파일/이미지 미리보기 기능
- [ ] 다운로드 기능 구현

### Phase 2: 작업일지 수정 화면 완전 재구축

#### 2.1 컴포넌트 통합
- [ ] `daily-report-form-enhanced` 컴포넌트 재사용
- [ ] 수정 모드 prop 추가 (`mode: 'create' | 'edit'`)
- [ ] 기존 데이터 로드 기능 추가
- [ ] `daily-report-form-edit.tsx` 대체

#### 2.2 수정 전용 기능
- [ ] 기존 파일/사진 관리 (삭제/교체)
- [ ] 변경 이력 추적
- [ ] 수정 가능 필드 제한 (status에 따라)
- [ ] 자동 저장 기능 강화

### Phase 3: 컴포넌트 통합 및 코드 최적화

#### 3.1 공통 컴포넌트 추출
```
components/daily-reports/shared/
├── SectionHeader.tsx
├── PhotoGallery.tsx
├── WorkerList.tsx
├── MaterialManagement.tsx
├── WeatherDisplay.tsx
├── ReceiptManager.tsx
├── DrawingViewer.tsx
└── CollapsibleSection.tsx
```

#### 3.2 데이터 훅 생성
```
hooks/daily-reports/
├── useDailyReportData.ts
├── useAdditionalPhotos.ts
├── useReceiptManagement.ts
└── useAutoSave.ts
```

#### 3.3 상태 관리 통합
- [ ] 모든 화면에서 동일한 데이터 구조 사용
- [ ] 일관된 CRUD 작업
- [ ] 에러 처리 통일

## 📝 구체적 작업 내용

### 1. DailyReportDetailView.tsx 개선

```typescript
// 주요 변경 사항:
interface DailyReportDetailViewProps {
  report: DailyReport & {
    formData?: DailyReportFormData // 전체 데이터 구조 지원
    additional_photos?: AdditionalPhotoData[]
    receipts?: ReceiptData[]
    drawings?: DrawingData[]
  }
}

// 새로운 섹션 구조:
const sections = [
  { key: 'basic', title: '기본 정보', icon: FileText },
  { key: 'workContent', title: '작업 내용', icon: Wrench },
  { key: 'workers', title: '작업자', icon: Users },
  { key: 'additionalPhotos', title: '추가 사진', icon: Camera },
  { key: 'receipts', title: '영수증', icon: Receipt },
  { key: 'drawings', title: '도면', icon: Map },
  { key: 'requests', title: '요청사항', icon: MessageSquare },
  { key: 'materials', title: 'NPC-1000', icon: Package },
  { key: 'weather', title: '날씨', icon: Cloud },
  { key: 'notes', title: '특이사항', icon: AlertCircle }
]
```

### 2. daily-report-form-enhanced.tsx 수정 모드 통합

```typescript
interface DailyReportFormEnhancedProps {
  mode?: 'create' | 'edit'
  initialData?: DailyReportFormData
  reportId?: string
  // ... 기존 props
}

// 수정 모드 로직:
useEffect(() => {
  if (mode === 'edit' && initialData) {
    // 기존 데이터 로드
    loadExistingData(initialData)
    // 파일 URL을 File 객체로 변환
    loadExistingFiles()
  }
}, [mode, initialData])
```

### 3. API 액션 추가

```typescript
// app/actions/daily-reports.ts 추가 함수:

export async function getAdditionalPhotos(reportId: string) {
  // daily_report_additional_photos 테이블에서 조회
}

export async function updateAdditionalPhotos(
  reportId: string, 
  photos: AdditionalPhotoData[]
) {
  // 추가 사진 업데이트
}

export async function deleteAdditionalPhoto(photoId: string) {
  // 추가 사진 삭제
}

export async function getFullDailyReport(reportId: string) {
  // 모든 관련 데이터 포함한 전체 리포트 조회
}
```

## 🗂️ 데이터베이스 스키마 확인

### 기존 테이블
- `daily_reports` - 기본 정보
- `daily_report_work_logs` - 작업 로그
- `daily_report_additional_photos` - 추가 사진 (새로 추가됨)

### 필요한 추가 테이블
- `daily_report_receipts` - 영수증 관리
- `daily_report_drawings` - 도면 관리
- `daily_report_equipment_usage` - 장비 사용
- `daily_report_safety_incidents` - 안전 사고
- `daily_report_quality_inspections` - 품질 검사

## ⏱️ 예상 작업 시간

| 단계 | 작업 내용 | 예상 시간 |
|------|-----------|-----------|
| Phase 1 | 상세 화면 개선 | 3-4시간 |
| Phase 2 | 수정 화면 통합 | 2-3시간 |
| Phase 3 | 코드 최적화 | 2시간 |
| 테스트 | 통합 테스트 | 1시간 |
| **총계** | | **8-10시간** |

## 🔍 영향받는 파일 목록

### 수정 대상
1. `/components/daily-reports/DailyReportDetailView.tsx` - 완전 재작성
2. `/components/daily-reports/daily-report-form-enhanced.tsx` - 수정 모드 추가
3. `/app/dashboard/daily-reports/[id]/edit/page.tsx` - 컴포넌트 교체
4. `/app/actions/daily-reports.ts` - API 액션 추가

### 삭제 대상
1. `/components/daily-reports/daily-report-form-edit.tsx` - 통합으로 인한 삭제

### 신규 생성
1. `/components/daily-reports/shared/` - 공통 컴포넌트 폴더
2. `/hooks/daily-reports/` - 커스텀 훅 폴더

## 🚀 구현 우선순위

1. **긴급**: 작업일지 상세 화면에 추가 사진 섹션 표시
2. **높음**: 수정 화면을 enhanced 버전으로 통합
3. **중간**: 공통 컴포넌트 추출 및 코드 정리
4. **낮음**: 추가 기능 구현 (내보내기, 인쇄 등)

## ✅ 체크리스트

### 구현 전 확인
- [ ] 데이터베이스 마이그레이션 실행 여부
- [ ] 기존 데이터 백업
- [ ] 테스트 환경 준비

### 구현 후 확인
- [ ] 모든 섹션 정상 표시
- [ ] 파일 업로드/다운로드 동작
- [ ] 수정 모드 정상 동작
- [ ] 임시저장 기능 동작
- [ ] 모바일 반응형 확인
- [ ] 다크모드 지원 확인

## 📌 참고 사항

1. **기존 데이터 호환성**: 이미 생성된 작업일지들이 새 구조에서도 정상 표시되어야 함
2. **성능 최적화**: 많은 사진/파일이 있을 때 로딩 성능 고려
3. **접근 권한**: RLS 정책 확인 및 테스트 필요
4. **에러 처리**: 파일 업로드 실패, 네트워크 오류 등 처리

## 🔄 다음 단계

1. 이 문서를 기반으로 Phase 1부터 순차적 구현
2. 각 Phase 완료 후 테스트 및 피드백 수렴
3. 필요시 계획 조정 및 업데이트

---

*이 문서는 작업일지 시스템 개선을 위한 상세 계획서입니다. 재부팅 후 이 문서를 참조하여 작업을 진행하시면 됩니다.*