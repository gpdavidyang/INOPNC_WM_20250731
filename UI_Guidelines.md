# Toss 디자인 시스템 기반 건설 작업일지 UI 가이드라인

## 핵심 디자인 철학: Simplicity

Toss의 창립 이래 변하지 않은 단일 원칙인 **"단순함(Simplicity)"**을 건설 작업일지 시스템에 적용합니다. 복잡한 건설 현장 데이터를 직관적이고 명확하게 표현하여 현장 작업자부터 관리자까지 모두가 쉽게 사용할 수 있는 시스템을 구축합니다.

### 제품 원칙 (Product Principles)
1. **"Easy to Answer"** - 모든 인터페이스 질문은 3초 내에 답할 수 있어야 함
2. **"Minimum Feature"** - 핵심 기능에만 집중, 불필요한 기능은 과감히 제거
3. **"Focus on Impact"** - 미적 완벽함보다 실제 사용자 성과에 집중

## 색상 시스템 구현

### Primary Colors
```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        'toss-blue': {
          DEFAULT: '#0064FF', // 토스 시그니처 블루
          50: '#eff9ff',
          100: '#dff0ff',
          500: '#0064FF',
          600: '#0050d9',
          900: '#001a4d'
        },
        'toss-gray': {
          DEFAULT: '#202632',
          100: '#f7f8fa',
          200: '#e5e8eb',
          500: '#8b95a1',
          900: '#202632'
        }
      }
    }
  }
}
```

### 사용 가이드라인
- **Primary Action**: `toss-blue-500` - 중요한 CTA 버튼 (작업일지 저장, 제출)
- **Secondary Action**: `toss-gray-200` - 보조 액션 (취소, 되돌리기)
- **Success State**: `green-500` - 완료된 작업, 승인 상태
- **Warning State**: `orange-500` - 주의 필요 항목
- **Error State**: `red-500` - 오류, 필수 입력 누락

## 타이포그래피 시스템

### 폰트 설정
```css
/* 시스템 폰트 우선 사용 (성능 최적화) */
font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", 
             Pretendard, Roboto, "Noto Sans KR", "Segoe UI", 
             "Malgun Gothic", sans-serif;
```

### 텍스트 크기 체계
```typescript
// components/Typography.tsx
const textSizes = {
  'xs': 'text-xs',    // 12px - 보조 텍스트
  'sm': 'text-sm',    // 14px - 캡션, 메타 정보
  'base': 'text-base', // 16px - 본문 (모바일 최적)
  'lg': 'text-lg',    // 18px - 부제목
  'xl': 'text-xl',    // 20px - 섹션 제목
  '2xl': 'text-2xl',  // 24px - 페이지 제목
  '3xl': 'text-3xl'   // 30px - 대시보드 주요 수치
}
```

## 컴포넌트 디자인 패턴

### 1. 버튼 컴포넌트
```tsx
// components/ui/Button.tsx
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-toss-blue-500 hover:bg-toss-blue-600 text-white shadow-md hover:shadow-lg',
        secondary: 'bg-toss-gray-100 hover:bg-toss-gray-200 text-toss-gray-900',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        ghost: 'hover:bg-toss-gray-100 text-toss-gray-700'
      },
      size: {
        sm: 'px-4 py-2 text-sm min-h-[40px]',
        md: 'px-6 py-3 text-base min-h-[48px]',
        lg: 'px-8 py-4 text-lg min-h-[56px]',
        full: 'w-full px-6 py-3 text-base min-h-[50px]' // 모바일 최적화
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
)
```

### 2. 카드 컴포넌트 (작업일지 카드)
```tsx
// components/ui/WorkLogCard.tsx
export const WorkLogCard = ({ log, interactive = true }) => {
  return (
    <div className={`
      bg-white/80 backdrop-blur-sm 
      border border-toss-gray-200/50 
      rounded-2xl p-4 
      shadow-sm hover:shadow-md 
      transition-all duration-300
      ${interactive ? 'cursor-pointer hover:-translate-y-1' : ''}
    `}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-toss-gray-900">
          {log.title}
        </h3>
        <span className="text-sm text-toss-gray-500">
          {log.date}
        </span>
      </div>
      
      <div className="space-y-2">
        <p className="text-base text-toss-gray-700 line-clamp-2">
          {log.description}
        </p>
        
        <div className="flex gap-2 mt-3">
          <Badge variant={log.status}>
            {log.statusText}
          </Badge>
          <Badge variant="secondary">
            {log.workerCount}명
          </Badge>
        </div>
      </div>
    </div>
  )
}
```

### 3. 입력 필드 (Progressive Disclosure)
```tsx
// components/ui/ProgressiveForm.tsx
export const WorkLogForm = () => {
  const [step, setStep] = useState(0)
  
  const formSteps = [
    { field: 'date', label: '작업 날짜를 선택해주세요' },
    { field: 'location', label: '작업 위치를 입력해주세요' },
    { field: 'workers', label: '작업 인원을 입력해주세요' },
    { field: 'description', label: '작업 내용을 설명해주세요' }
  ]
  
  return (
    <div className="min-h-screen bg-toss-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1 bg-toss-gray-200 rounded-full">
            <div 
              className="h-full bg-toss-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / formSteps.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Current Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-semibold mb-6">
              {formSteps[step].label}
            </h2>
            
            {/* Dynamic Input Component */}
            <FormField 
              type={formSteps[step].field}
              onComplete={(value) => {
                // Save value and move to next step
                if (step < formSteps.length - 1) {
                  setStep(step + 1)
                } else {
                  // Submit form
                }
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
```

## 레이아웃 및 그리드 시스템

### Spacing Scale (8px 기반)
```typescript
// tailwind.config.js - Toss 스타일 spacing
export default {
  theme: {
    spacing: {
      '0': '0px',
      '1': '4px',
      '2': '8px',   // 기본 단위
      '3': '12px',
      '4': '16px',  // 모바일 기본 패딩
      '6': '24px',  // 태블릿 패딩
      '8': '32px',  // 데스크톱 패딩
      '12': '48px',
      '16': '64px'
    }
  }
}
```

### 반응형 컨테이너
```tsx
// components/layout/Container.tsx
export const Container = ({ children, className = '' }) => {
  return (
    <div className={`
      px-4 sm:px-6 lg:px-8
      mx-auto max-w-7xl
      ${className}
    `}>
      {children}
    </div>
  )
}
```

### 모바일 최적화 네비게이션
```tsx
// components/navigation/BottomNav.tsx
export const BottomNavigation = () => {
  return (
    <nav className="
      fixed bottom-0 left-0 right-0 
      h-[50px] bg-white 
      border-t border-toss-gray-200
      flex items-center justify-around
      safe-area-bottom
    ">
      {navItems.map((item) => (
        <button
          key={item.id}
          className="
            flex flex-col items-center justify-center
            w-full h-full
            min-w-[50px] min-h-[50px]
            text-toss-gray-500
            active:text-toss-blue-500
            transition-colors
          "
        >
          <Icon size={22} />
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
```

## 애니메이션 및 인터랙션

### Framer Motion 설정
```tsx
// utils/animation.ts
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
}

export const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
}

export const buttonTap = {
  tap: { scale: 0.95 }
}
```

### 로딩 상태 (Skeleton)
```tsx
// components/ui/Skeleton.tsx
export const WorkLogSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-toss-gray-200 rounded-2xl p-4">
        <div className="h-6 bg-toss-gray-300 rounded w-3/4 mb-3" />
        <div className="h-4 bg-toss-gray-300 rounded w-full mb-2" />
        <div className="h-4 bg-toss-gray-300 rounded w-5/6" />
        
        <div className="flex gap-2 mt-3">
          <div className="h-6 w-16 bg-toss-gray-300 rounded-full" />
          <div className="h-6 w-20 bg-toss-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  )
}
```

## 접근성 고려사항

### 1. 스크린 리더 지원
```tsx
// 모든 인터랙티브 요소에 적절한 ARIA 레이블 추가
<button
  aria-label="작업일지 추가"
  aria-pressed={isActive}
  role="button"
>
  <PlusIcon aria-hidden="true" />
  <span className="sr-only">새 작업일지 작성</span>
</button>
```

### 2. 키보드 네비게이션
```tsx
// hooks/useKeyboardNavigation.ts
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation')
      }
    }
    
    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation')
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])
}
```

### 3. 모션 설정 존중
```css
/* globals.css */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 건설 작업일지 특화 패턴

### 1. 대시보드 구성
```tsx
// pages/dashboard.tsx
export const ConstructionDashboard = () => {
  return (
    <div className="min-h-screen bg-toss-gray-50">
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-2 gap-2 p-4">
        <SummaryCard
          title="오늘 작업"
          value="12"
          unit="건"
          trend="+3"
          color="blue"
        />
        <SummaryCard
          title="작업 인원"
          value="48"
          unit="명"
          trend="+5"
          color="green"
        />
      </div>
      
      {/* 최근 작업일지 */}
      <section className="px-4 pb-20">
        <h2 className="text-xl font-semibold mb-4">최근 작업일지</h2>
        <div className="space-y-3">
          {workLogs.map(log => (
            <WorkLogCard key={log.id} log={log} />
          ))}
        </div>
      </section>
      
      {/* 플로팅 액션 버튼 */}
      <motion.button
        className="
          fixed bottom-20 right-4
          w-14 h-14 
          bg-toss-blue-500 text-white
          rounded-full shadow-lg
          flex items-center justify-center
        "
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <PlusIcon size={24} />
      </motion.button>
    </div>
  )
}
```

### 2. 사진 업로드 패턴
```tsx
// components/PhotoUpload.tsx
export const PhotoUpload = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">현장 사진 추가</h3>
      
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square">
            <img 
              src={photo.url} 
              className="w-full h-full object-cover rounded-lg"
            />
            <button className="
              absolute top-1 right-1 
              w-6 h-6 
              bg-black/50 text-white
              rounded-full
              flex items-center justify-center
            ">
              <XIcon size={16} />
            </button>
          </div>
        ))}
        
        {/* 추가 버튼 */}
        <button className="
          aspect-square
          border-2 border-dashed border-toss-gray-300
          rounded-lg
          flex items-center justify-center
          hover:border-toss-blue-500
          transition-colors
        ">
          <CameraIcon size={24} className="text-toss-gray-400" />
        </button>
      </div>
    </div>
  )
}
```

### 3. 날씨 정보 통합
```tsx
// components/WeatherWidget.tsx
export const WeatherWidget = ({ location }) => {
  return (
    <div className="
      bg-gradient-to-br from-blue-400 to-blue-500
      text-white rounded-2xl p-4
      flex items-center justify-between
    ">
      <div>
        <p className="text-sm opacity-90">{location}</p>
        <p className="text-2xl font-bold">23°C</p>
        <p className="text-sm">맑음</p>
      </div>
      <SunIcon size={48} className="opacity-80" />
    </div>
  )
}
```

## 구현 로드맵

### Phase 1: 기초 설정 (1주차)
1. Tailwind Config에 Toss 디자인 토큰 설정
2. 기본 컴포넌트 라이브러리 구축 (Button, Card, Input)
3. 타이포그래피 시스템 구현

### Phase 2: 핵심 컴포넌트 (2-3주차)
1. 네비게이션 시스템 구현
2. 폼 컴포넌트 및 Progressive Disclosure 패턴
3. 대시보드 레이아웃 구성

### Phase 3: 고급 기능 (4-5주차)
1. 애니메이션 및 마이크로 인터랙션 추가
2. 접근성 기능 구현 및 테스트
3. 다크 모드 지원

### Phase 4: 최적화 (6주차)
1. 성능 최적화 (번들 사이즈, 렌더링)
2. 사용자 테스트 및 피드백 반영
3. 문서화 및 스타일 가이드 완성

## 오프라인 지원 (PWA)

### 1. Service Worker 설정
```typescript
// public/sw.js
const CACHE_NAME = 'construction-log-v1'
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/offline.html'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에서 찾으면 반환, 없으면 네트워크 요청
        return response || fetch(event.request)
      })
      .catch(() => {
        // 오프라인 페이지 표시
        return caches.match('/offline.html')
      })
  )
})
```

### 2. 오프라인 데이터 동기화
```typescript
// hooks/useOfflineSync.ts
import { useEffect } from 'react'
import { openDB } from 'idb'

export const useOfflineSync = () => {
  const syncData = async () => {
    const db = await openDB('ConstructionLogs', 1, {
      upgrade(db) {
        db.createObjectStore('pendingLogs', { keyPath: 'id' })
      }
    })

    // 온라인 상태 확인
    if (navigator.onLine) {
      const pendingLogs = await db.getAll('pendingLogs')
      
      for (const log of pendingLogs) {
        try {
          await fetch('/api/logs', {
            method: 'POST',
            body: JSON.stringify(log),
            headers: { 'Content-Type': 'application/json' }
          })
          
          // 성공적으로 동기화되면 로컬에서 삭제
          await db.delete('pendingLogs', log.id)
        } catch (error) {
          console.error('Sync failed:', error)
        }
      }
    }
  }

  useEffect(() => {
    // 온라인 상태 변경 감지
    window.addEventListener('online', syncData)
    
    return () => {
      window.removeEventListener('online', syncData)
    }
  }, [])
}
```

### 3. 오프라인 상태 표시
```tsx
// components/OfflineIndicator.tsx
export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-4 py-2 text-center z-50">
      <span className="text-sm">오프라인 모드 - 데이터는 연결 시 자동 동기화됩니다</span>
    </div>
  )
}
```

## 폼 검증 패턴

### 1. 폼 검증 스키마 (Zod 사용)
```typescript
// schemas/workLog.schema.ts
import { z } from 'zod'

export const workLogSchema = z.object({
  date: z.date({
    required_error: "작업 날짜를 선택해주세요",
    invalid_type_error: "올바른 날짜 형식이 아닙니다"
  }),
  
  location: z.string()
    .min(1, "작업 위치를 입력해주세요")
    .max(100, "위치는 100자 이내로 입력해주세요"),
  
  workerCount: z.number()
    .min(1, "최소 1명 이상의 작업자가 필요합니다")
    .max(999, "작업자 수는 999명을 초과할 수 없습니다"),
  
  description: z.string()
    .min(10, "작업 내용은 최소 10자 이상 입력해주세요")
    .max(1000, "작업 내용은 1000자를 초과할 수 없습니다"),
  
  materials: z.array(z.object({
    name: z.string().min(1, "자재명을 입력해주세요"),
    quantity: z.number().positive("수량은 0보다 커야 합니다"),
    unit: z.enum(['kg', 'ton', 'm³', '개', 'set'])
  })).optional(),
  
  photos: z.array(z.instanceof(File))
    .max(10, "사진은 최대 10장까지 업로드 가능합니다")
    .refine(
      files => files.every(file => file.size <= 5 * 1024 * 1024),
      "각 사진은 5MB 이하여야 합니다"
    )
})

export type WorkLogFormData = z.infer<typeof workLogSchema>
```

### 2. 폼 컴포넌트 with 검증
```tsx
// components/forms/WorkLogForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workLogSchema, WorkLogFormData } from '@/schemas/workLog.schema'

export const WorkLogForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm<WorkLogFormData>({
    resolver: zodResolver(workLogSchema)
  })

  const onSubmit = async (data: WorkLogFormData) => {
    try {
      await submitWorkLog(data)
    } catch (error) {
      // 에러 처리
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 날짜 입력 */}
      <FormField>
        <Label htmlFor="date">작업 날짜</Label>
        <Input
          type="date"
          id="date"
          {...register('date')}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'date-error' : undefined}
        />
        {errors.date && (
          <ErrorMessage id="date-error">
            {errors.date.message}
          </ErrorMessage>
        )}
      </FormField>

      {/* 실시간 글자 수 표시 */}
      <FormField>
        <Label htmlFor="description">
          작업 내용
          <span className="text-sm text-gray-500 ml-2">
            ({watch('description')?.length || 0}/1000)
          </span>
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={4}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <ErrorMessage>{errors.description.message}</ErrorMessage>
        )}
      </FormField>

      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? '저장 중...' : '작업일지 저장'}
      </Button>
    </form>
  )
}
```

### 3. 에러 메시지 컴포넌트
```tsx
// components/ui/ErrorMessage.tsx
export const ErrorMessage = ({ children, id }: { children: React.ReactNode, id?: string }) => {
  return (
    <motion.p
      id={id}
      role="alert"
      className="mt-2 text-sm text-red-600 flex items-center gap-1"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <AlertCircleIcon className="w-4 h-4" />
      {children}
    </motion.p>
  )
}
```

## 데이터 시각화

### 1. 차트 컴포넌트 설정
```typescript
// components/charts/ChartConfig.ts
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Toss 스타일 차트 옵션
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#202632',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#e5e8eb',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      displayColors: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#8b95a1'
      }
    },
    y: {
      grid: {
        color: '#e5e8eb'
      },
      ticks: {
        color: '#8b95a1'
      }
    }
  }
}
```

### 2. 진행률 컴포넌트
```tsx
// components/charts/ProgressChart.tsx
export const ProgressChart = ({ value, total, label }: ProgressChartProps) => {
  const percentage = Math.round((value / total) * 100)
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-2xl font-bold text-toss-blue-500">
          {percentage}%
        </span>
      </div>
      
      {/* 프로그레스 바 */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-toss-blue-400 to-toss-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      
      {/* 상세 정보 */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>완료: {value.toLocaleString()}</span>
        <span>전체: {total.toLocaleString()}</span>
      </div>
    </div>
  )
}
```

### 3. 대시보드 통계 카드
```tsx
// components/charts/StatCard.tsx
export const StatCard = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  color = 'blue' 
}: StatCardProps) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600'
  }
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        
        {trend && (
          <div className={`
            flex items-center gap-1 text-sm font-medium
            ${trend > 0 ? 'text-green-600' : 'text-red-600'}
          `}>
            {trend > 0 ? <TrendingUpIcon size={16} /> : <TrendingDownIcon size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      
      {change && (
        <p className="text-sm text-gray-500 mt-2">
          전일 대비 {change > 0 ? '+' : ''}{change}
        </p>
      )}
    </div>
  )
}
```

## 컴포넌트 네이밍 규칙

### 1. 네이밍 컨벤션
```typescript
// constants/naming.ts
export const ComponentNaming = {
  // 작업일지 관련
  WorkLog: {
    List: 'WorkLogList',
    Card: 'WorkLogCard',
    Form: 'WorkLogForm',
    Detail: 'WorkLogDetail',
    Filter: 'WorkLogFilter'
  },
  
  // 현장 관련
  Site: {
    List: 'SiteList',
    Card: 'SiteCard',
    Map: 'SiteMap',
    Info: 'SiteInfo',
    Manager: 'SiteManager'
  },
  
  // 보고서 관련
  Report: {
    Dashboard: 'ReportDashboard',
    Summary: 'ReportSummary',
    Export: 'ReportExport',
    Preview: 'ReportPreview',
    Generator: 'ReportGenerator'
  },
  
  // 작업자 관련
  Worker: {
    List: 'WorkerList',
    Card: 'WorkerCard',
    Assignment: 'WorkerAssignment',
    Schedule: 'WorkerSchedule',
    Profile: 'WorkerProfile'
  }
}
```

### 2. 파일 구조
```
components/
├── worklog/
│   ├── WorkLogList.tsx
│   ├── WorkLogCard.tsx
│   └── WorkLogForm.tsx
├── site/
│   ├── SiteList.tsx
│   └── SiteMap.tsx
├── report/
│   ├── ReportDashboard.tsx
│   └── ReportSummary.tsx
└── worker/
    ├── WorkerList.tsx
    └── WorkerAssignment.tsx
```

## 상태 관리 패턴

### 1. Zustand Store 설정
```typescript
// store/workLogStore.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface WorkLogState {
  logs: WorkLog[]
  filters: WorkLogFilters
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchLogs: () => Promise<void>
  addLog: (log: WorkLog) => void
  updateLog: (id: string, updates: Partial<WorkLog>) => void
  deleteLog: (id: string) => void
  setFilters: (filters: Partial<WorkLogFilters>) => void
}

export const useWorkLogStore = create<WorkLogState>()(
  devtools(
    persist(
      (set, get) => ({
        logs: [],
        filters: {
          dateRange: 'week',
          status: 'all',
          siteId: null
        },
        isLoading: false,
        error: null,

        fetchLogs: async () => {
          set({ isLoading: true, error: null })
          try {
            const response = await fetch('/api/worklogs')
            const data = await response.json()
            set({ logs: data, isLoading: false })
          } catch (error) {
            set({ error: error.message, isLoading: false })
          }
        },

        addLog: (log) => {
          set((state) => ({
            logs: [log, ...state.logs]
          }))
        },

        updateLog: (id, updates) => {
          set((state) => ({
            logs: state.logs.map(log =>
              log.id === id ? { ...log, ...updates } : log
            )
          }))
        },

        deleteLog: (id) => {
          set((state) => ({
            logs: state.logs.filter(log => log.id !== id)
          }))
        },

        setFilters: (filters) => {
          set((state) => ({
            filters: { ...state.filters, ...filters }
          }))
        }
      }),
      {
        name: 'worklog-storage',
        partialize: (state) => ({ filters: state.filters })
      }
    )
  )
)
```

### 2. Context API 패턴
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 초기 인증 상태 확인
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const userData = await response.json()
    setUser(userData)
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const updateProfile = async (updates: Partial<User>) => {
    const response = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (response.ok) {
      const updatedUser = await response.json()
      setUser(updatedUser)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

## 테스트 가이드

### 1. 컴포넌트 테스트
```typescript
// __tests__/components/WorkLogCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkLogCard } from '@/components/worklog/WorkLogCard'

describe('WorkLogCard', () => {
  const mockLog = {
    id: '1',
    title: '1층 철근 작업',
    date: '2024-01-20',
    status: 'completed',
    workerCount: 5
  }

  it('renders work log information correctly', () => {
    render(<WorkLogCard log={mockLog} />)
    
    expect(screen.getByText('1층 철근 작업')).toBeInTheDocument()
    expect(screen.getByText('2024-01-20')).toBeInTheDocument()
    expect(screen.getByText('5명')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    const handleClick = jest.fn()
    render(<WorkLogCard log={mockLog} onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('article'))
    expect(handleClick).toHaveBeenCalledWith(mockLog)
  })

  it('shows correct status badge color', () => {
    render(<WorkLogCard log={mockLog} />)
    
    const badge = screen.getByText('완료')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })
})
```

### 2. 접근성 테스트
```typescript
// __tests__/a11y/WorkLogForm.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { WorkLogForm } from '@/components/worklog/WorkLogForm'

expect.extend(toHaveNoViolations)

describe('WorkLogForm Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<WorkLogForm />)
    const results = await axe(container)
    
    expect(results).toHaveNoViolations()
  })

  it('has proper ARIA labels', () => {
    const { getByLabelText } = render(<WorkLogForm />)
    
    expect(getByLabelText('작업 날짜')).toBeInTheDocument()
    expect(getByLabelText('작업 위치')).toBeInTheDocument()
    expect(getByLabelText('작업 인원')).toBeInTheDocument()
  })

  it('shows error messages with proper ARIA attributes', async () => {
    const { getByRole, findByRole } = render(<WorkLogForm />)
    
    const submitButton = getByRole('button', { name: '작업일지 저장' })
    fireEvent.click(submitButton)
    
    const errorMessage = await findByRole('alert')
    expect(errorMessage).toBeInTheDocument()
  })
})
```

### 3. 통합 테스트
```typescript
// __tests__/integration/worklog-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkLogPage } from '@/pages/worklog'
import { server } from '@/mocks/server'
import { rest } from 'msw'

describe('Work Log Flow', () => {
  it('completes full work log creation flow', async () => {
    const user = userEvent.setup()
    render(<WorkLogPage />)

    // 1. 작업일지 추가 버튼 클릭
    const addButton = screen.getByRole('button', { name: '작업일지 추가' })
    await user.click(addButton)

    // 2. 폼 입력
    await user.type(screen.getByLabelText('작업 위치'), '현장 A동 1층')
    await user.type(screen.getByLabelText('작업 인원'), '10')
    await user.type(screen.getByLabelText('작업 내용'), '철근 배근 작업 완료')

    // 3. 제출
    const submitButton = screen.getByRole('button', { name: '저장' })
    await user.click(submitButton)

    // 4. 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByText('작업일지가 저장되었습니다')).toBeInTheDocument()
    })

    // 5. 목록에 추가됨 확인
    expect(screen.getByText('현장 A동 1층')).toBeInTheDocument()
  })
})
```

## 핵심 도구 설치
```bash
# 필수 패키지 설치
npm install @toss/es-toolkit overlay-kit @suspensive/react
npm install framer-motion class-variance-authority
npm install @radix-ui/react-* # 접근성 컴포넌트
npm install zustand immer # 상태 관리
npm install react-hook-form @hookform/resolvers zod # 폼 검증
npm install chart.js react-chartjs-2 # 데이터 시각화
npm install idb workbox-webpack-plugin # PWA & 오프라인

# 개발 도구
npm install -D @tailwindcss/forms @tailwindcss/typography
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jest-axe
npm install -D msw # API 모킹
```

이 가이드라인을 통해 Toss의 검증된 디자인 시스템을 건설 작업일지 시스템에 효과적으로 적용할 수 있습니다. 핵심은 **단순함(Simplicity)**을 유지하면서도 현장 작업자들이 필요로 하는 모든 기능을 직관적으로 제공하는 것입니다.