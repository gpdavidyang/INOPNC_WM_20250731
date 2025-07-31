# INOPNC WMS Implementation Workflow Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 14 App Router]
        B[React Components]
        C[Tailwind CSS]
        D[TypeScript]
    end
    
    subgraph "Authentication Layer"
        E[Supabase Auth]
        F[JWT Sessions]
        G[RLS Policies]
    end
    
    subgraph "API Layer"
        H[Server Actions]
        I[REST APIs]
        J[Real-time Subscriptions]
    end
    
    subgraph "Data Layer"
        K[PostgreSQL]
        L[Supabase Storage]
        M[Redis Cache]
    end
    
    A --> E
    A --> H
    H --> K
    E --> G
    G --> K
    B --> L
    J --> K
```

## Phase 1: Daily Report System Workflow

```mermaid
sequenceDiagram
    participant W as Worker
    participant UI as Report Form UI
    participant API as Server Actions
    participant DB as Database
    participant S as Storage
    participant M as Manager
    
    W->>UI: Access Daily Report
    UI->>API: Load previous reports
    API->>DB: Query last 3 reports
    DB-->>UI: Return reference data
    
    W->>UI: Fill report sections
    UI->>UI: Auto-save every 5 min
    UI->>API: Save draft
    API->>DB: Update draft status
    
    W->>UI: Upload photos
    UI->>S: Store images
    S-->>UI: Return URLs
    
    W->>UI: Submit report
    UI->>API: Create report
    API->>DB: Save with 'submitted' status
    API->>M: Send notification
    
    M->>UI: Review report
    M->>UI: Approve/Reject
    UI->>API: Update status
    API->>DB: Record approval
    API->>W: Notify result
```

## Implementation Phases Timeline

```mermaid
gantt
    title INOPNC WMS Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Daily Report Form       :p1a, 2025-08-01, 5d
    Photo Upload System     :p1b, after p1a, 3d
    Approval Workflow       :p1c, after p1b, 3d
    Report Generation       :p1d, after p1c, 2d
    
    section Phase 2
    Material Master Data    :p2a, after p1d, 5d
    Inventory Management    :p2b, after p2a, 3d
    Request Workflow        :p2c, after p2b, 3d
    Transaction Tracking    :p2d, after p2c, 2d
    
    section Phase 3
    GPS Integration         :p3a, after p2d, 3d
    Advanced Attendance     :p3b, after p3a, 3d
    Workforce Management    :p3c, after p3b, 4d
    
    section Phase 4
    Safety Management       :p4a, after p3c, 5d
    Quality Control         :p4b, after p4a, 5d
    
    section Phase 5
    Communication Hub       :p5a, after p4b, 5d
    Analytics & Reporting   :p5b, after p5a, 5d
    
    section Phase 6
    Advanced Features       :p6a, after p5b, 5d
    Mobile & Performance    :p6b, after p6a, 5d
```

## Daily Report Form Component Structure

```mermaid
graph TD
    subgraph "Daily Report Form"
        A[Header Section]
        A --> A1[Site Selection]
        A --> A2[Work Date]
        A --> A3[Worker Info]
        
        B[Work Content<br/>Collapsible]
        B --> B1[부재명 Dropdown]
        B --> B2[작업공정 Dropdown]
        B --> B3[Work Location]
        
        C[Worker Assignment<br/>Collapsible]
        C --> C1[Worker Selection]
        C --> C2[공수 Input 0-3.0]
        
        D[Photo Upload<br/>Collapsible]
        D --> D1[Before Photos<br/>Max 30]
        D --> D2[After Photos<br/>Max 30]
        
        E[Receipt<br/>Collapsible]
        E --> E1[Receipt Type]
        E --> E2[Amount]
        E --> E3[File Upload]
        
        F[Drawing Upload<br/>Collapsible]
        F --> F1[Blueprint Selection]
        F --> F2[Marking Tool]
        
        G[HQ Request<br/>Collapsible]
        G --> G1[Request Text]
        G --> G2[Attachments]
        
        H[NPC-1000<br/>Collapsible]
        H --> H1[입고량]
        H --> H2[사용량]
        H --> H3[재고량]
        
        I[Special Notes<br/>Collapsible]
        I --> I1[Free Text]
        
        J[Actions]
        J --> J1[Save Draft]
        J --> J2[Submit]
    end
```

## Material Management Workflow

```mermaid
flowchart LR
    subgraph "Material Request Process"
        A[Worker Identifies Need] --> B[Create Request]
        B --> C{Manager Review}
        C -->|Approve| D[Generate PO]
        C -->|Reject| E[Return with Comments]
        D --> F[Supplier Selection]
        F --> G[Order Placement]
        G --> H[Delivery Tracking]
        H --> I[Receipt & Inspection]
        I --> J[Inventory Update]
        J --> K[Site Stock Updated]
    end
```

## Security & Permission Matrix

```mermaid
graph TD
    subgraph "Role-Based Access Control"
        A[User Roles]
        A --> B[Worker]
        A --> C[Site Manager]
        A --> D[Customer Manager]
        A --> E[Admin]
        A --> F[System Admin]
        
        B --> B1[Own Reports]
        B --> B2[Own Attendance]
        B --> B3[Site Info View]
        
        C --> C1[All Site Reports]
        C --> C2[Approve Reports]
        C --> C3[Material Requests]
        C --> C4[Worker Management]
        
        D --> D1[Project Progress]
        D --> D2[Read-Only Reports]
        D --> D3[Limited Docs]
        
        E --> E1[All Org Data]
        E --> E2[User Management]
        E --> E3[System Config]
        
        F --> F1[Full System Access]
        F --> F2[Cross-Org Access]
        F --> F3[Database Admin]
    end
```

## Data Flow Architecture

```mermaid
flowchart TB
    subgraph "Client Side"
        A[React Components]
        B[Form Validation]
        C[Local Storage]
        D[Service Worker]
    end
    
    subgraph "Server Side"
        E[Next.js Middleware]
        F[Server Actions]
        G[API Routes]
        H[Background Jobs]
    end
    
    subgraph "Supabase"
        I[Authentication]
        J[PostgreSQL]
        K[Storage Buckets]
        L[Realtime]
    end
    
    A --> E
    E --> I
    A --> F
    F --> J
    C --> D
    D --> F
    A --> K
    L --> A
    H --> J
    G --> J
```

## Mobile-First Responsive Design

```mermaid
graph LR
    subgraph "Responsive Breakpoints"
        A[Mobile<br/>< 640px] --> A1[Single Column]
        A --> A2[Bottom Nav]
        A --> A3[Touch UI]
        
        B[Tablet<br/>640-1024px] --> B1[Two Column]
        B --> B2[Side Nav]
        B --> B3[Hybrid UI]
        
        C[Desktop<br/>> 1024px] --> C1[Multi Column]
        C --> C2[Full Sidebar]
        C --> C3[Mouse UI]
    end
```

## Offline Sync Strategy

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant LS as Local Storage
    participant SW as Service Worker
    participant API as Server API
    participant DB as Database
    
    Note over App,DB: Online Mode
    App->>API: Save Report
    API->>DB: Store Data
    API-->>App: Success
    
    Note over App,DB: Offline Mode
    App->>LS: Save to Local
    App->>SW: Queue Sync
    SW-->>App: Queued
    
    Note over App,DB: Back Online
    SW->>API: Sync Queued Data
    API->>DB: Store Data
    API-->>SW: Success
    SW->>LS: Clear Local
    SW-->>App: Sync Complete
```

## Performance Optimization Strategy

```mermaid
graph TD
    subgraph "Optimization Techniques"
        A[Code Splitting]
        A --> A1[Route-based]
        A --> A2[Component-based]
        
        B[Caching]
        B --> B1[CDN Cache]
        B --> B2[Browser Cache]
        B --> B3[API Cache]
        
        C[Image Optimization]
        C --> C1[Compression]
        C --> C2[Lazy Loading]
        C --> C3[Responsive Images]
        
        D[Database]
        D --> D1[Indexes]
        D --> D2[Materialized Views]
        D --> D3[Connection Pooling]
    end
```

## Testing Strategy

```mermaid
graph LR
    subgraph "Testing Pyramid"
        A[Unit Tests<br/>70%] --> A1[Components]
        A --> A2[Utils]
        A --> A3[Hooks]
        
        B[Integration<br/>20%] --> B1[API Tests]
        B --> B2[DB Tests]
        B --> B3[Auth Tests]
        
        C[E2E Tests<br/>10%] --> C1[Critical Paths]
        C --> C2[User Flows]
        C --> C3[Cross-browser]
    end
```

## Deployment Pipeline

```mermaid
flowchart LR
    A[Developer] --> B[Git Push]
    B --> C{GitHub Actions}
    C --> D[Lint & Test]
    D --> E{Pass?}
    E -->|Yes| F[Build]
    E -->|No| G[Notify Dev]
    F --> H[Deploy Staging]
    H --> I[E2E Tests]
    I --> J{Pass?}
    J -->|Yes| K[Deploy Production]
    J -->|No| L[Rollback]
    K --> M[Monitor]
```

This comprehensive workflow diagram provides visual representations of:

1. System architecture and component relationships
2. Daily report submission workflow
3. Implementation timeline using Gantt chart
4. Component structure for the daily report form
5. Material management process flow
6. Security and permission matrix
7. Data flow between layers
8. Responsive design strategy
9. Offline sync mechanism
10. Performance optimization approach
11. Testing pyramid
12. CI/CD deployment pipeline

These diagrams serve as a visual guide for the development team to understand the system architecture, workflows, and implementation strategy at a glance.