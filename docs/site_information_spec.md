# 현장정보 (Site Information) Feature Specification

## Overview
현장정보 기능은 건설 현장의 주요 정보를 한 곳에서 확인할 수 있는 핵심 기능입니다. 작업자들이 현장 주소, 숙소 정보, 작업 공정, 담당자 연락처 등을 빠르게 확인하고 활용할 수 있도록 설계되었습니다.

## Feature Components

### 1. Today's Site Information (오늘의 현장 정보)

#### 1.1 Site Address Section (현장 주소)
```typescript
interface SiteAddress {
  id: string
  site_id: string
  full_address: string
  latitude?: number
  longitude?: number
  postal_code?: string
}
```

**Features:**
- 전체 주소 표시
- 📋 클립보드 복사 기능
- 🗺️ T-Map 네비게이션 연동 (앱 딥링크)
- 터치 영역: 최소 44x44px

#### 1.2 Accommodation Address Section (숙소 주소)
```typescript
interface AccommodationAddress {
  id: string
  site_id: string
  accommodation_name: string
  full_address: string
  latitude?: number
  longitude?: number
}
```

**Features:**
- 숙소명 및 전체 주소 표시
- 📋 클립보드 복사 기능
- 🗺️ T-Map 네비게이션 연동
- 조건부 표시 (숙소 정보가 있는 경우만)

#### 1.3 Process Information Section (공정 정보)
```typescript
interface ProcessInfo {
  member_name: string      // 부재명: 슬라브, 기둥, 거더
  work_process: string     // 작업공정: 철근, 거푸집, 콘크리트
  work_section: string     // 작업구간: 3층 A구역
  drawing_id?: string      // 관련 도면 ID
}
```

**Features:**
- 당일 작업 공정 정보 표시
- 📐 도면 보기 아이콘 (클릭 시 팝업/새 창)
- 작업 진행률 표시 (optional)

#### 1.4 Manager Contacts Section (담당자 연락처)
```typescript
interface ManagerContact {
  role: 'construction_manager' | 'assistant_manager' | 'safety_manager'
  name: string
  phone: string
  email?: string
  profile_image?: string
}
```

**Features:**
- 현장소장, 부소장, 안전관리자 연락처
- 📋 번호 복사 기능
- 📞 직접 전화 연결 (tel: 프로토콜)
- 프로필 이미지 표시 (optional)

### 2. Site Search Functions (현장 검색 기능)

#### 2.1 Search Filters
```typescript
interface SiteSearchFilters {
  siteName?: string        // 현장명 검색
  region?: {              // 지역 검색
    province: string
    city?: string
    district?: string
  }
  workerName?: string     // 작업자명 검색
  dateRange?: {          // 기간 검색
    startDate: Date
    endDate: Date
  }
}
```

**Features:**
- 실시간 자동완성
- 부분 검색 지원
- 다중 필터 조합
- 빠른 선택 옵션 (이번 주, 이번 달, 최근 3개월)

#### 2.2 Search Results
```typescript
interface SiteSearchResult {
  id: string
  name: string
  address: string
  construction_period: {
    start_date: Date
    end_date: Date
  }
  progress_percentage: number
  participant_count: number
  distance?: number        // 현재 위치로부터의 거리
  is_active: boolean
}
```

**Sorting Options:**
- 현장명순
- 거리순 (현재 위치 기준)
- 시작일순
- 진행률순

### 3. Access Control

#### Role-based Permissions
```typescript
interface SiteAccessControl {
  worker: {
    view: 'participated_sites_only'
    search: 'participated_sites_only'
  }
  site_manager: {
    view: 'managed_sites_only'
    search: 'all_active_sites'
  }
  partner: {
    view: 'contracted_sites_only'
    search: 'contracted_sites_only'
  }
  admin: {
    view: 'all_sites'
    search: 'all_sites'
  }
}
```

## UI/UX Specifications

### Mobile Layout (320px - 768px)
```
┌─────────────────────────────┐
│       오늘의 현장 정보        │
├─────────────────────────────┤
│ 📍 현장 주소                 │
│ 서울시 강남구 테헤란로 123    │
│ [📋 복사] [🗺️ T-Map]        │
├─────────────────────────────┤
│ 🏠 숙소 주소                 │
│ 강남 게스트하우스            │
│ 서울시 강남구 역삼동 456     │
│ [📋 복사] [🗺️ T-Map]        │
├─────────────────────────────┤
│ 🔧 작업 공정                 │
│ 부재: 슬라브                 │
│ 공정: 철근                   │
│ 구간: 3층 A구역 [📐 도면]    │
├─────────────────────────────┤
│ 👷 담당자 연락처             │
│ ┌─────────────────────────┐ │
│ │ 현장소장: 김철수         │ │
│ │ 010-1234-5678          │ │
│ │ [📋] [📞]              │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 안전관리자: 박안전       │ │
│ │ 010-9876-5432          │ │
│ │ [📋] [📞]              │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Desktop Layout (769px+)
- 2-column layout with sidebar for search
- Expanded card view with more details
- Persistent search filters

### Interaction Design

#### Touch Targets
- Minimum size: 44x44px (iOS HIG standard)
- Padding: 8px around interactive elements
- Visual feedback: 0.95 scale on tap

#### Animations
- Expand/collapse: 300ms ease-in-out
- Loading states: Skeleton screens
- Success feedback: Toast notifications

#### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader optimized
- High contrast mode support

## Technical Implementation

### API Endpoints

#### GET /api/sites/current
Get current site information for logged-in user
```typescript
Response: {
  site: SiteInfo
  address: SiteAddress
  accommodation?: AccommodationAddress
  process: ProcessInfo
  managers: ManagerContact[]
}
```

#### GET /api/sites/search
Search sites with filters
```typescript
Query: SiteSearchFilters
Response: {
  results: SiteSearchResult[]
  total: number
  page: number
  limit: number
}
```

#### POST /api/sites/switch
Switch to different site
```typescript
Body: { site_id: string }
Response: { success: boolean, site: SiteInfo }
```

### External App Integration

#### T-Map Deep Linking
```typescript
// iOS
tmap://route?goalname={name}&goalx={longitude}&goaly={latitude}

// Android  
tmap://search?name={name}&lon={longitude}&lat={latitude}

// Web Fallback
https://tmap.co.kr/tmap2/mobile/route.jsp?name={name}&lon={longitude}&lat={latitude}
```

#### Phone Integration
```typescript
// Direct call
tel:+821012345678

// Save to contacts (vCard)
BEGIN:VCARD
VERSION:3.0
FN:김철수 현장소장
TEL:010-1234-5678
END:VCARD
```

### State Management

#### Site Context Provider
```typescript
interface SiteContextValue {
  currentSite: SiteInfo | null
  isLoading: boolean
  error: Error | null
  switchSite: (siteId: string) => Promise<void>
  refreshSite: () => Promise<void>
}
```

#### Custom Hooks
- `useCurrentSite()` - Get current site info
- `useSiteSearch()` - Site search functionality
- `useSiteManagers()` - Manager contacts

### Performance Optimization

#### Caching Strategy
- Site info: 5 minutes cache
- Manager contacts: 30 minutes cache
- Search results: Session storage
- Images: Browser cache + CDN

#### Loading Performance
- Initial load: < 1s (fast 3G)
- Search response: < 500ms
- App launch: < 2s (native feel)

### Error Handling

#### Network Errors
- Offline mode with cached data
- Retry mechanism (3 attempts)
- User-friendly error messages

#### App Integration Errors
- Fallback to web version
- Alternative app suggestions
- Copy fallback for unsupported features

## Security Considerations

### Data Protection
- Phone numbers: Masked by default
- Location data: User permission required
- API rate limiting: 100 requests/minute

### Access Control
- RLS policies for site data
- JWT token validation
- Role-based data filtering

## Migration Plan

### Database Schema Updates
```sql
-- Add manager contact fields to sites table
ALTER TABLE sites ADD COLUMN construction_manager_name VARCHAR(100);
ALTER TABLE sites ADD COLUMN construction_manager_phone VARCHAR(20);
ALTER TABLE sites ADD COLUMN assistant_manager_name VARCHAR(100);
ALTER TABLE sites ADD COLUMN assistant_manager_phone VARCHAR(20);
ALTER TABLE sites ADD COLUMN safety_manager_name VARCHAR(100);
ALTER TABLE sites ADD COLUMN safety_manager_phone VARCHAR(20);

-- Add site preferences table
CREATE TABLE site_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  preferred_site_id UUID REFERENCES sites(id),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Rollout Strategy
1. Phase 1: Basic site info display (Week 1)
2. Phase 2: Search functionality (Week 2)
3. Phase 3: External app integration (Week 3)
4. Phase 4: Performance optimization (Week 4)

## Success Metrics

### User Engagement
- Daily active users accessing site info
- Average time to find information
- Click-through rate on navigation/call buttons

### Performance Metrics
- Page load time < 1s
- Search response time < 500ms
- Error rate < 0.1%

### Business Impact
- Reduced calls to office for site info
- Increased navigation app usage
- Improved worker satisfaction scores