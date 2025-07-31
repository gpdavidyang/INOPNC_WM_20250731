# Phase 1: Daily Report System - Sprint Task Breakdown

## Sprint 1.1: Enhanced Daily Report Form (Week 1)

### Day 1-2: Form Structure & UI Components

#### Task 1.1.1: Create Collapsible Section Component
**Priority**: High  
**Estimated Hours**: 4  
**Description**: Build reusable collapsible section component with animation
```typescript
// Components needed:
- CollapsibleSection.tsx
- Props: title, icon, defaultOpen, children
- Smooth expand/collapse animation
- State persistence in localStorage
```

#### Task 1.1.2: Implement 부재명 & 작업공정 Dropdowns
**Priority**: High  
**Estimated Hours**: 6  
**Description**: Create dynamic dropdowns with "기타" option handling
```typescript
// Implementation:
- 부재명 options: ['슬라브', '거더', '기둥', '기타']
- 작업공정 options: ['균열', '면', '마감', '기타']
- Show text input when '기타' selected
- Form validation for custom input
```

#### Task 1.1.3: Build Worker Assignment Section
**Priority**: High  
**Estimated Hours**: 8  
**Description**: Multi-select worker list with 공수 input
```typescript
// Features:
- Fetch assigned workers from site_assignments
- Multi-select checkbox list
- 공수 dropdown per worker: [0.0, 1.0, 1.5, 2.0, 2.5, 3.0]
- Calculate total work hours
- Validation: at least one worker required
```

### Day 3-4: Photo Upload System

#### Task 1.1.4: Create Photo Upload Component
**Priority**: Critical  
**Estimated Hours**: 12  
**Description**: Comprehensive photo upload with multiple sources
```typescript
// Requirements:
- Support gallery selection (mobile)
- Camera capture (mobile)
- File drag-and-drop (desktop)
- Max 30 photos per section
- Max 10MB per photo
- Image preview with delete
- Progress indicators
```

#### Task 1.1.5: Integrate Supabase Storage
**Priority**: Critical  
**Estimated Hours**: 6  
**Description**: Set up storage buckets and upload logic
```typescript
// Implementation:
- Create buckets: 'daily-report-before', 'daily-report-after'
- Implement chunked upload for large files
- Generate unique file names with timestamps
- Handle upload errors gracefully
- Store URLs in database
```

### Day 5: Additional Form Sections

#### Task 1.1.6: Receipt Attachment Section
**Priority**: Medium  
**Estimated Hours**: 4  
**Description**: Receipt upload with metadata
```typescript
// Fields:
- Receipt type dropdown
- Amount input (number)
- Date picker
- File upload (image/pdf)
- Preview functionality
```

#### Task 1.1.7: Drawing Upload Section
**Priority**: Medium  
**Estimated Hours**: 3  
**Description**: Blueprint/drawing file selection
```typescript
// Features:
- File selection for drawings
- Support PDF, DWG, image formats
- Preview for supported formats
- Link to marking tool (placeholder)
```

#### Task 1.1.8: HQ Request Section
**Priority**: Medium  
**Estimated Hours**: 3  
**Description**: Request form with attachments
```typescript
// Components:
- Rich text editor for request
- File attachment support
- Priority selection
- Character limit indicator
```

#### Task 1.1.9: NPC-1000 Material Section
**Priority**: High  
**Estimated Hours**: 4  
**Description**: Material tracking inputs
```typescript
// Fields:
- 입고량 (incoming): number input
- 사용량 (used): number input
- 재고량 (remaining): calculated or manual
- Validation: used cannot exceed incoming + previous remaining
```

## Sprint 1.2: Auto-save & Progress Features

### Day 6-7: Auto-save Implementation

#### Task 1.2.1: Auto-save Mechanism
**Priority**: Critical  
**Estimated Hours**: 8  
**Description**: Implement 5-minute auto-save with conflict resolution
```typescript
// Features:
- Save to localStorage first
- Sync to database every 5 minutes
- Detect changes using form state
- Handle offline scenarios
- Conflict resolution for concurrent edits
```

#### Task 1.2.2: Progress Indicator
**Priority**: Medium  
**Estimated Hours**: 4  
**Description**: Visual progress tracking
```typescript
// Implementation:
- Calculate completion percentage
- Show progress bar at top
- Section completion indicators
- Required vs optional field tracking
```

### Day 8-9: Data Integration

#### Task 1.2.3: Previous Report Reference
**Priority**: High  
**Estimated Hours**: 6  
**Description**: Load and display last 3 reports
```typescript
// Features:
- Quick access sidebar/modal
- Copy data from previous report
- Show report summaries
- Filter by site and date
```

#### Task 1.2.4: Weather Integration
**Priority**: Low  
**Estimated Hours**: 4  
**Description**: Auto-capture weather data
```typescript
// Implementation:
- Integrate weather API
- Get weather by site location
- Store temperature, conditions, precipitation
- Manual override option
```

### Day 10: Form Validation & Submission

#### Task 1.2.5: Comprehensive Validation
**Priority**: Critical  
**Estimated Hours**: 6  
**Description**: Client and server-side validation
```typescript
// Validations:
- Required field checks
- Data type validation
- Business rule validation
- Cross-field dependencies
- Error message display
```

#### Task 1.2.6: Submit Workflow
**Priority**: Critical  
**Estimated Hours**: 4  
**Description**: Handle form submission
```typescript
// Process:
- Final validation
- Upload pending images
- Create database transaction
- Update status to 'submitted'
- Send notifications
- Success/error handling
```

## Database Schema Updates

### Task 1.3.1: Enhance daily_reports Table
```sql
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS
  work_section TEXT,
  member_name_other TEXT,
  process_type_other TEXT,
  weather_condition TEXT,
  weather_temperature DECIMAL(4,1),
  hq_request TEXT,
  hq_request_priority TEXT,
  receipt_total_amount DECIMAL(10,2),
  auto_saved_at TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0;
```

### Task 1.3.2: Create Photo Storage Tables
```sql
CREATE TABLE daily_report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  photo_type TEXT CHECK (photo_type IN ('before', 'after')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  upload_order INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE daily_report_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  receipt_type TEXT,
  amount DECIMAL(10,2),
  receipt_date DATE,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Task 1.4.1: Create Server Actions
```typescript
// app/dashboard/daily-reports/actions.ts

export async function autoSaveDailyReport(data: Partial<DailyReport>)
export async function uploadReportPhoto(file: File, type: 'before' | 'after')
export async function deleteReportPhoto(photoId: string)
export async function submitDailyReport(reportId: string)
export async function getRecentReports(siteId: string, limit: number = 3)
export async function copyFromPreviousReport(sourceId: string)
```

## Testing Requirements

### Task 1.5.1: Unit Tests
- Form component rendering
- Validation logic
- Auto-save functionality
- Photo upload limits

### Task 1.5.2: Integration Tests
- Complete form submission flow
- Photo upload to Supabase
- Database transactions
- Error handling

### Task 1.5.3: E2E Tests
- Create report workflow
- Auto-save recovery
- Mobile photo upload
- Offline functionality

## Performance Optimizations

### Task 1.6.1: Image Optimization
- Client-side compression before upload
- Lazy loading for photo previews
- Thumbnail generation
- CDN integration

### Task 1.6.2: Form Performance
- Debounced auto-save
- Virtual scrolling for long lists
- Memoized components
- Optimistic UI updates

## Mobile-Specific Tasks

### Task 1.7.1: Touch Optimizations
- Larger touch targets
- Swipe gestures for photos
- Native camera integration
- Responsive layout adjustments

### Task 1.7.2: Offline Support
- Service worker setup
- IndexedDB for offline storage
- Background sync for uploads
- Offline indicator UI

## Definition of Done

### For Each Task:
1. ✅ Code implemented and reviewed
2. ✅ Unit tests written and passing
3. ✅ Integration with existing code verified
4. ✅ Mobile and desktop tested
5. ✅ Documentation updated
6. ✅ Performance benchmarks met

### For Sprint 1.1:
1. ✅ All form sections functional
2. ✅ Photo upload working end-to-end
3. ✅ Auto-save operational
4. ✅ Form validation complete
5. ✅ Database schema updated
6. ✅ Basic tests passing

## Risk Mitigation

### Identified Risks:
1. **Photo Upload Performance**
   - Mitigation: Implement chunked uploads and compression
   
2. **Offline Sync Conflicts**
   - Mitigation: Timestamp-based conflict resolution
   
3. **Mobile Browser Compatibility**
   - Mitigation: Progressive enhancement approach
   
4. **Large Form State Management**
   - Mitigation: Use form library like React Hook Form

## Success Metrics

### Sprint 1.1 KPIs:
- Form load time < 2 seconds
- Photo upload success rate > 95%
- Auto-save reliability > 99%
- Zero data loss incidents
- Mobile usability score > 90

This detailed task breakdown provides:
1. Specific implementation tasks with time estimates
2. Technical requirements and code snippets
3. Database schema updates needed
4. API endpoints to create
5. Testing requirements
6. Performance optimization tasks
7. Mobile-specific considerations
8. Clear definition of done
9. Risk mitigation strategies
10. Success metrics to track

Each task is actionable and can be directly assigned to developers with clear expectations and deliverables.