# 도면 마킹 도구 요구사항 정의서

## 1. 기능 개요

### 기능명
**도면 마킹 도구 (Blueprint Markup Tool)**

### 목적
건설 현장의 공도면(원본 도면)에 작업 진행 상황을 시각적으로 표시하고, 마킹된 도면을 저장/공유하여 현장 작업 진행률을 효율적으로 관리하는 도구

### 주요 사용자
- **작업자**: 자신의 작업 진행 상황을 도면에 마킹
- **현장관리자**: 전체 현장 진행률을 도면에 표시 및 관리  
- **파트너사**: 의뢰한 작업의 진행 상황을 시각적으로 확인
- **관리자**: 모든 마킹된 도면을 조회 및 관리

## 2. 핵심 마킹 도구 기능

### 박스 마킹 도구
| 도구 | 색상 | 의미 | 기능 |
|------|------|------|------|
| 자재구간 | 회색 (#9CA3AF) | 자재 대기/준비 구간 | 드래그로 사각형 영역 선택 |
| 작업진행 | 빨간색 (#EF4444) | 현재 진행 중인 작업 | 드래그로 사각형 영역 선택 |
| 작업완료 | 파란색 (#3B82F6) | 완료된 작업 구간 | 드래그로 사각형 영역 선택 |

### 기타 도구
- **텍스트 도구**: 도면에 텍스트 주석 추가
- **펜 그리기**: 자유곡선 그리기 (빨간색, 2px)
- **되돌리기/다시실행**: 최대 20단계 실행 취소
- **삭제**: 선택된 객체 삭제
- **확대/축소**: 25% ~ 500% 범위

## 3. UI 레이아웃

### 데스크톱 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│                    상단 툴바                             │
│  🏠홈 | 📁열기 | 💾저장 | 📤공유 | ❌닫기                 │
├─────────────────────────────────────────────────────────┤
│   좌측 도구 패널    │           메인 도면 영역            │
│  ┌─────────────┐   │                                    │
│  │  📦 회색박스  │   │                                    │
│  │  🔴 작업진행  │   │         도면 이미지               │
│  │  🔵 작업완료  │   │        (확대/축소 가능)            │
│  │  📝 텍스트    │   │                                    │
│  │  ✏️ 펜 그리기 │   │                                    │
│  │  ↶ 되돌리기   │   │                                    │
│  │  ↷ 다시실행   │   │                                    │
│  │  🗑️ 삭제      │   │                                    │
│  │  🔍 확대      │   │                                    │
│  │  🔍 축소      │   │                                    │
│  └─────────────┘   │                                    │
├─────────────────────────────────────────────────────────┤
│                    하단 상태바                           │
│  파일명: 현장A_공도면.dwg | 마킹수: 5개 | 줌: 100%       │
└─────────────────────────────────────────────────────────┘
```

### 모바일 레이아웃
```
┌─────────────────────────────────┐
│           상단 헤더             │
│  ← 뒤로  |  파일명  |  💾 저장   │
├─────────────────────────────────┤
│                                │
│         메인 도면 영역          │
│        (터치 확대/축소)         │
│                                │
│                                │
├─────────────────────────────────┤
│          하단 도구바            │
│ 📦 🔴 🔵 📝 ✏️ ↶ ↷ 🗑️        │
└─────────────────────────────────┘
```

## 4. 데이터 타입 정의

### 마킹 객체 타입

```typescript
// 파일 위치: src/types/markup.ts

// 기본 마킹 객체
interface BaseMarkupObject {
  id: string
  type: 'box' | 'text' | 'drawing'
  x: number
  y: number
  createdAt: string
  modifiedAt: string
}

// 박스 마킹
interface BoxMarkup extends BaseMarkupObject {
  type: 'box'
  width: number
  height: number
  color: 'gray' | 'red' | 'blue'  // 자재구간, 작업진행, 작업완료
  label: '자재구간' | '작업진행' | '작업완료'
}

// 텍스트 마킹
interface TextMarkup extends BaseMarkupObject {
  type: 'text'
  content: string
  fontSize: number
  fontColor: string
}

// 펜 그리기 마킹
interface DrawingMarkup extends BaseMarkupObject {
  type: 'drawing'
  path: Array<{x: number, y: number}>
  strokeColor: string
  strokeWidth: number
}

// 통합 마킹 타입
type MarkupObject = BoxMarkup | TextMarkup | DrawingMarkup

// 마킹 도면 데이터
interface MarkupDocument {
  id: string
  originalFileId: string
  fileName: string
  filePath: string
  markupObjects: MarkupObject[]
  metadata: MarkupMetadata
  permissions: {
    canView: string[]    // 조회 권한 사용자 ID 목록
    canEdit: string[]    // 편집 권한 사용자 ID 목록
  }
}

// 메타데이터
interface MarkupMetadata {
  originalFileName: string      // 원본 파일명
  markupFileName: string       // 마킹 파일명
  createdBy: string           // 생성자
  createdAt: string          // 생성일시
  modifiedAt: string         // 수정일시
  siteId: string            // 현장 ID
  description?: string       // 설명
  tags: string[]            // 태그
  markupCount: number       // 마킹 개수
}
```

### 도구 상태 타입

```typescript
// 현재 선택된 도구
type ToolType = 'select' | 'box-gray' | 'box-red' | 'box-blue' | 'text' | 'pen' | 'zoom-in' | 'zoom-out'

// 도구 상태
interface ToolState {
  activeTool: ToolType
  isDrawing: boolean
  selectedObjects: string[]  // 선택된 객체 ID 목록
  clipboard: MarkupObject[]  // 복사된 객체들
}

// 뷰어 상태
interface ViewerState {
  zoom: number           // 확대 비율 (0.25 ~ 5.0)
  panX: number          // 가로 패닝 위치
  panY: number          // 세로 패닝 위치
  imageWidth: number    // 원본 이미지 너비
  imageHeight: number   // 원본 이미지 높이
}

// 마킹 에디터 전역 상태
interface MarkupEditorState {
  // 파일 상태
  currentFile: MarkupDocument | null
  originalBlueprint: File | null
  
  // 도구 상태
  toolState: ToolState
  viewerState: ViewerState
  
  // 편집 상태
  markupObjects: MarkupObject[]
  selectedObjects: string[]
  undoStack: MarkupObject[][]
  redoStack: MarkupObject[][]
  
  // UI 상태
  isLoading: boolean
  isSaving: boolean
  showSaveDialog: boolean
  showOpenDialog: boolean
}
```

## 5. 컴포넌트 구조

```typescript
// 파일 위치: src/components/markup/
├── markup-editor.tsx           # 메인 에디터 컴포넌트
├── toolbar/
│   ├── tool-palette.tsx       # 좌측 도구 패널
│   ├── top-toolbar.tsx        # 상단 툴바
│   └── bottom-statusbar.tsx   # 하단 상태바
├── canvas/
│   ├── markup-canvas.tsx      # 마킹 캔버스
│   ├── blueprint-viewer.tsx   # 도면 뷰어
│   └── object-renderer.tsx    # 마킹 객체 렌더러
├── dialogs/
│   ├── save-dialog.tsx        # 저장 다이얼로그
│   ├── open-dialog.tsx        # 열기 다이얼로그
│   └── share-dialog.tsx       # 공유 다이얼로그
└── hooks/
    ├── use-markup-tools.ts    # 마킹 도구 훅
    ├── use-canvas-state.ts    # 캔버스 상태 훅
    └── use-file-manager.ts    # 파일 관리 훅
```

## 6. 이벤트 처리

### 마우스 이벤트

```typescript
// 캔버스 마우스 이벤트 핸들러
const handleCanvasMouseDown = (event: MouseEvent) => {
  const { activeTool } = toolState
  const { x, y } = getCanvasCoordinates(event)
  
  switch (activeTool) {
    case 'box-red':
    case 'box-blue':
    case 'box-gray':
      startDrawingBox(x, y, activeTool)
      break
    case 'text':
      createTextObject(x, y)
      break
    case 'pen':
      startDrawingPath(x, y)
      break
    case 'select':
      selectObject(x, y)
      break
  }
}
```

### 키보드 단축키

```typescript
const keyboardShortcuts = {
  'Ctrl+Z': () => undo(),
  'Ctrl+Y': () => redo(),
  'Ctrl+C': () => copySelected(),
  'Ctrl+V': () => paste(),
  'Delete': () => deleteSelected(),
  'Ctrl+S': () => openSaveDialog(),
  'Ctrl+O': () => openFileDialog(),
  'Escape': () => deselectAll()
}
```

## 7. 저장 시스템

### 파일 저장 구조

```
documents/
├── shared/              # 공유문서함
│   ├── blueprints/      # 공도면 (원본)
│   │   ├── site_a_floor1.dwg
│   │   └── site_a_floor2.dwg
│   └── markups/         # 마킹 도면
│       ├── site_a_floor1_marked_20240724.json
│       └── site_a_floor1_marked_20240725.json
└── personal/            # 내문서함
    └── [userId]/
        └── markups/
            ├── my_markup_20240724.json
            └── my_markup_20240725.json
```

### 저장 다이얼로그

```
┌─────────────────────────────────┐
│          마킹 도면 저장          │
├─────────────────────────────────┤
│  파일명: [                    ] │
│  저장위치: ○ 내문서함            │
│           ○ 공유문서함          │
│  설명: [                      ] │
│       [                      ] │
├─────────────────────────────────┤
│        [취소]      [저장]        │
└─────────────────────────────────┘
```

### JSON 저장 형식

```json
{
  "version": "1.0",
  "metadata": {
    "originalFileName": "현장A_1층평면도.dwg",
    "markupFileName": "현장A_1층_작업진행률_20240724.json",
    "createdBy": "user_kim_chulsu",
    "createdAt": "2024-07-24T09:30:00Z",
    "modifiedAt": "2024-07-24T15:45:00Z",
    "siteId": "site_a",
    "description": "1층 슬라브 작업 진행률",
    "tags": ["슬라브", "1층", "진행률"],
    "markupCount": 5
  },
  "canvas": {
    "width": 1920,
    "height": 1080,
    "backgroundImage": "shared/blueprints/site_a_floor1.dwg"
  },
  "markupObjects": [
    {
      "id": "box_001",
      "type": "box",
      "x": 100,
      "y": 150,
      "width": 200,
      "height": 100,
      "color": "blue",
      "label": "작업완료",
      "createdAt": "2024-07-24T09:35:00Z",
      "modifiedAt": "2024-07-24T09:35:00Z"
    },
    {
      "id": "text_001",
      "type": "text",
      "x": 150,
      "y": 200,
      "content": "슬라브 타설 완료",
      "fontSize": 16,
      "fontColor": "#000000",
      "createdAt": "2024-07-24T09:40:00Z",
      "modifiedAt": "2024-07-24T09:40:00Z"
    }
  ]
}
```

## 8. 권한 관리

### 권한 매트릭스

| 기능 | 작업자 | 현장관리자 | 파트너사 | 관리자 |
|------|--------|------------|----------|--------|
| 공도면 조회 | ✅ | ✅ | ✅ | ✅ |
| 마킹 편집 | ✅ | ✅ | ✅ | ✅ |
| 내문서함 저장 | ✅ | ✅ | ✅ | ✅ |
| 공유문서함 저장 | ❌ | ✅ | ✅ | ✅ |
| 다른 사용자 마킹 수정 | ❌ | ✅ | ❌ | ✅ |
| 마킹 파일 삭제 | 본인것만 | ✅ | 본인것만 | ✅ |

### 파일 권한 구조

```typescript
interface FilePermission {
  fileId: string
  ownerId: string
  permissions: {
    public: boolean          // 공개 여부
    viewers: string[]        // 조회 권한자 목록
    editors: string[]        // 편집 권한자 목록
    collaborators: string[]  // 협업 권한자 목록
  }
}
```

## 9. 기술 스택

### 프론트엔드
- **Canvas API**: HTML5 Canvas를 활용한 마킹 구현
- **Fabric.js**: 캔버스 객체 관리 및 상호작용
- **PDF.js**: PDF 파일 렌더링
- **File API**: 파일 업로드 및 다운로드

### 파일 처리
- **DWG Viewer**: AutoCAD 파일 웹 뷰어 라이브러리
- **Image Processing**: 이미지 최적화 및 썸네일 생성
- **File Conversion**: 다양한 형식 간 변환 지원

### 지원 파일 형식
- **CAD 파일**: .dwg, .dxf
- **이미지 파일**: .jpg, .png, .pdf
- **최대 파일 크기**: 50MB

## 10. 사용자 시나리오

### 시나리오 A: 작업자의 일일 진행률 마킹
1. 김철수(작업자)가 오전 작업 완료 후 도면 마킹
2. 공유문서함에서 해당 현장 공도면 열기
3. 완료된 구간을 파란색 박스로 마킹
4. 진행 중인 구간을 빨간색 박스로 마킹
5. 자재 대기 구간을 회색 박스로 마킹
6. "김철수_0724_오전진행률.json"로 내문서함에 저장

### 시나리오 B: 현장관리자의 전체 현황 관리
1. 박현장(현장관리자)가 일일 전체 진행률 취합
2. 각 작업자들의 마킹 도면 확인
3. 종합 마킹 도면 작성
4. 문제 구간에 텍스트로 이슈 사항 기록
5. "현장전체_0724_진행현황.json"로 공유문서함에 저장
6. 파트너사와 공유

### 시나리오 C: 작업일지 연동
1. 작업일지 작성 화면에서 "마킹 도면 업로드" 섹션 접근
2. 저장된 마킹 도면 목록에서 해당 파일 선택
3. 작업일지에 마킹 도면 첨부
4. 작업 내용과 시각적 진행률을 함께 보고

## 11. 개발 우선순위

### Phase 1: 기본 마킹 기능 (2-3주)
- [ ] 기본 UI 레이아웃 구성
- [ ] 도면 파일 로드 기능
- [ ] 박스 마킹 도구 (회색/빨간색/파란색)
- [ ] 텍스트 입력 도구
- [ ] 기본 편집 기능 (선택/이동/삭제)
- [ ] 저장 기능 (내문서함)

### Phase 2: 협업 및 공유 기능 (2-3주)
- [ ] 공유문서함 저장 기능
- [ ] 권한 관리 시스템
- [ ] 버전 관리 및 히스토리
- [ ] 펜 그리기 도구
- [ ] 되돌리기/다시실행

### Phase 3: 통합 및 최적화 (2-3주)
- [ ] 작업일지 연동
- [ ] 모바일 최적화
- [ ] 키보드 단축키
- [ ] 성능 최적화

### Phase 4: 고급 기능 (3-4주)
- [ ] 실시간 협업 편집
- [ ] 측정 도구
- [ ] 다양한 파일 형식 지원
- [ ] 고급 마킹 도구

## 12. 통합 연결점

### 기존 시스템과의 연동
1. **공유문서함 연동**: 기존 문서 관리 시스템과 파일 공유
2. **내문서함 연동**: 개인 문서 저장소와 연결
3. **작업일지 연동**: 작업일지 작성 시 마킹 도면 첨부 기능
4. **사용자 권한 연동**: 기존 역할 기반 권한 시스템 활용

### 데이터 흐름
```
공도면 업로드(파트너사) → 마킹 작업(현장팀) → 저장(문서함) → 작업일지 첨부 → 보고서 생성
```

이 요구사항서를 기반으로 도면 마킹 도구를 단계별로 개발하면 건설 현장의 작업 진행률을 효과적으로 시각화하고 관리할 수 있는 시스템이 완성될 것입니다.