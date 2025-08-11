# INOPNC Work Management System - Complete Documentation Index

*Auto-generated comprehensive project documentation index* | Last Updated: 2025-01-15

## 🎯 Project Overview

**INOPNC Work Management System** is a Next.js 14-based construction work diary management system designed for Korean construction companies. Built with TypeScript, Supabase, and modern PWA technologies, it provides comprehensive workforce management, blueprint markup tools, and real-time collaboration features.

### Quick Stats
- **Technology Stack**: Next.js 14 (App Router), TypeScript, Supabase, Tailwind CSS
- **Architecture**: Serverless, PWA-enabled, Mobile-first
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Documentation Files**: 80+ markdown files, 100+ components
- **Testing**: Jest + Playwright with comprehensive E2E coverage

---

## 📚 Core Documentation

### 🔧 Technical Foundation
| Document | Description | Priority |
|----------|-------------|----------|
| [README.md](README.md) | Main project overview, setup instructions, feature summary | **Critical** |
| [CLAUDE.md](CLAUDE.md) | AI assistant instructions, protected files, development guidelines | **Critical** |
| [package.json](package.json) | Dependencies, scripts, project configuration | **High** |
| [docs/database-schema.md](docs/database-schema.md) | Complete database structure documentation | **High** |

### 🏗️ Architecture & Design
| Document | Description | Status |
|----------|-------------|---------|
| [docs/implementation-analysis-and-plan.md](docs/implementation-analysis-and-plan.md) | System architecture analysis | ✅ Complete |
| [docs/architect-workflow-plan.md](docs/architect-workflow-plan.md) | Development workflow planning | ✅ Complete |
| [docs/implementation-roadmap.md](docs/implementation-roadmap.md) | Feature implementation roadmap | ✅ Complete |
| [docs/implementation-workflow-diagram.md](docs/implementation-workflow-diagram.md) | Visual workflow documentation | ✅ Complete |

### 🎨 UI/UX Design System
| Document | Description | Framework |
|----------|-------------|-----------|
| [docs/UI_Guidelines.md](docs/UI_Guidelines.md) | Comprehensive UI design system | **Toss Design System** |
| [docs/ui-design-system.md](docs/ui-design-system.md) | Component library documentation | Radix UI + CVA |
| [docs/mobile-design-guide.md](docs/mobile-design-guide.md) | Mobile-first design principles | **PWA Standards** |
| [docs/MOBILE_UI_COMPACT_GUIDE.md](docs/MOBILE_UI_COMPACT_GUIDE.md) | Compact mobile UI patterns | Construction-optimized |
| [docs/spacing-system-guidelines.md](docs/spacing-system-guidelines.md) | Consistent spacing system | Tailwind-based |

---

## 🏢 Feature-Specific Documentation

### 👷 Workforce Management
| Feature | Documentation | Components |
|---------|--------------|------------|
| **Attendance System** | [docs/Attendance_Guidelines.md](docs/Attendance_Guidelines.md) | `components/attendance/` |
| **Daily Reports** | [docs/DailyReports_Guidelines.md](docs/DailyReports_Guidelines.md) | `components/daily-reports/` |
| **Worker Assignment** | [docs/worker-assignment-test-report.md](docs/worker-assignment-test-report.md) | `components/admin/worker-management/` |

### 🏗️ Site Management
| Feature | Documentation | Implementation |
|---------|--------------|----------------|
| **Site Information** | [docs/SiteInfo_Guidelines.md](docs/SiteInfo_Guidelines.md) | Context-aware site data |
| **Site Context Integration** | [docs/site-context-integration.md](docs/site-context-integration.md) | Multi-site support |
| **Site Information Spec** | [docs/site_information_spec.md](docs/site_information_spec.md) | Technical specifications |

### 📄 Document Management
| System | Documentation | Technology |
|--------|--------------|------------|
| **Document Hub** | [docs/MyDocuments_Guidelines.md](docs/MyDocuments_Guidelines.md) | 3-tab unified system |
| **Shared Documents** | [docs/SharedDocuments_Guidelines.md](docs/SharedDocuments_Guidelines.md) | Team collaboration |
| **Blueprint Markup** | [docs/BlueprintMarkupTool_Guidelines.md](docs/BlueprintMarkupTool_Guidelines.md) | **HTML5 Canvas System** |
| **Markup Implementation** | [docs/MARKUP_UI_IMPLEMENTATION_RECORD.md](docs/MARKUP_UI_IMPLEMENTATION_RECORD.md) | Complete Canvas toolkit |

### 📊 Analytics & Administration
| System | Documentation | Features |
|--------|--------------|----------|
| **Admin Dashboard** | [docs/ADMIN_DASHBOARD_IMPLEMENTATION_SUMMARY.md](docs/ADMIN_DASHBOARD_IMPLEMENTATION_SUMMARY.md) | Full admin controls |
| **Admin Features** | [docs/AdminFeatures_Guidelines.md](docs/AdminFeatures_Guidelines.md) | Permission-based access |
| **Analytics Infrastructure** | [docs/ANALYTICS_INFRASTRUCTURE.md](docs/ANALYTICS_INFRASTRUCTURE.md) | Real-time monitoring |
| **Performance Monitoring** | [docs/PERFORMANCE_MONITORING.md](docs/PERFORMANCE_MONITORING.md) | System health tracking |

### 📱 Mobile & PWA
| Feature | Documentation | Standards |
|---------|--------------|-----------|
| **Bottom Navigation** | [docs/BottomNavBar_Guidelines.md](docs/BottomNavBar_Guidelines.md) | Mobile-first navigation |
| **PWA Implementation** | Components: `components/pwa/` | **Service Worker, Offline Support** |
| **Mobile UI Compact** | [docs/MOBILE_UI_COMPACT_GUIDE.md](docs/MOBILE_UI_COMPACT_GUIDE.md) | Construction-optimized UI |

---

## 🔐 Security & Authentication

### Authentication System
| Document | Description | Implementation |
|----------|-------------|----------------|
| [docs/authentication-fix-guide.md](docs/authentication-fix-guide.md) | Authentication troubleshooting | Supabase Auth |
| [docs/auth-fixes-summary.md](docs/auth-fixes-summary.md) | Authentication system fixes | Security hardening |
| [docs/PRODUCTION_SECURITY_GUIDE.md](docs/PRODUCTION_SECURITY_GUIDE.md) | Production security checklist | **RLS + RBAC** |

### Security Features
- **Row Level Security (RLS)**: Database-level access control
- **Role-Based Access Control**: Admin, Manager, Worker, Customer roles
- **Protected Files System**: Critical file protection with snapshots
- **Multi-factor Authentication**: Available for admin users

---

## 🧪 Testing & Quality Assurance

### Testing Infrastructure
| Document | Description | Tools |
|----------|-------------|-------|
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | Comprehensive testing strategy | **Jest + Playwright** |
| [docs/TEST_EXECUTION_GUIDE.md](docs/TEST_EXECUTION_GUIDE.md) | Testing execution procedures | E2E, Unit, Integration |
| [docs/testing-infrastructure-guide.md](docs/testing-infrastructure-guide.md) | Testing setup and configuration | Multi-device testing |
| [TESTING_SUMMARY.md](TESTING_SUMMARY.md) | Overall testing summary | Quality metrics |

### Quality Systems
- **Performance Budgets**: [docs/PERFORMANCE_BUDGETS.md](docs/PERFORMANCE_BUDGETS.md)
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
- **Mobile Device Testing**: iPhone, Android, iPad
- **Accessibility Testing**: WCAG 2.1 AA compliance

---

## 🚀 Deployment & Operations

### Deployment
| Document | Description | Platform |
|----------|-------------|----------|
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Complete deployment instructions | **Vercel + Supabase** |
| [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) | Production deployment procedures | Operations manual |
| [docs/DATA_MIGRATION_GUIDE.md](docs/DATA_MIGRATION_GUIDE.md) | Database migration procedures | PostgreSQL migrations |

### Operations
- **Backup System**: [docs/BACKUP_SYSTEM.md](docs/BACKUP_SYSTEM.md)
- **Performance Monitoring**: Real-time system health
- **Error Tracking**: Sentry integration for production monitoring

---

## 🛠️ Development Tools & Workflows

### Development Environment
| Tool | Configuration | Purpose |
|------|---------------|---------|
| **Task Master AI** | [.taskmaster/CLAUDE.md](.taskmaster/CLAUDE.md) | AI-powered project management |
| **TypeScript Workflow** | [docs/typescript-workflow.md](docs/typescript-workflow.md) | Type safety development |
| **UI Development** | [docs/UI_DEVELOPMENT_PROCESS.md](docs/UI_DEVELOPMENT_PROCESS.md) | Component development process |
| **Refactoring Guide** | [docs/REFACTORING_GUIDE.md](docs/REFACTORING_GUIDE.md) | Code quality maintenance |

### Specialized Systems
- **NPC-1000 Material System**: [docs/NPC-1000-IMPLEMENTATION-REPORT.md](docs/NPC-1000-IMPLEMENTATION-REPORT.md)
- **Blueprint Requirements**: [blueprint_markup_requirements.md](blueprint_markup_requirements.md)
- **User Customizations**: [USER_CUSTOMIZATIONS.md](USER_CUSTOMIZATIONS.md)

---

## 📱 Component Architecture

### Core UI Components (`/components/ui/`)
| Component | Description | Features |
|-----------|-------------|----------|
| **Button System** | `button.tsx` | 5 variants, accessibility-first |
| **Navigation** | `navbar.tsx` | Responsive, role-based |
| **Form Controls** | `input.tsx`, `select.tsx`, `textarea.tsx` | Weather-resistant, glove-friendly |
| **Dialog System** | `dialog.tsx` | Modal management |
| **Typography** | `typography.tsx` | Consistent text styles |

### Feature Components
| Module | Location | Description |
|--------|----------|-------------|
| **Attendance** | `components/attendance/` | Clock-in/out, calendar views |
| **Daily Reports** | `components/daily-reports/` | Work log creation and management |
| **Document Management** | `components/documents/` | 3-tab unified document system |
| **Blueprint Markup** | `components/markup/` | Canvas-based drawing tools |
| **Site Management** | `components/site-info/` | Construction site information |
| **Admin Tools** | `components/admin/` | Administrative interfaces |

---

## 📋 API Documentation

### REST Endpoints
| Endpoint | Description | Method |
|----------|-------------|--------|
| `/api/markup-documents` | Blueprint markup CRUD | GET, POST, PUT, DELETE |
| `/api/analytics/*` | Performance and usage analytics | GET |
| `/api/daily-reports/*` | Work log management | GET, POST, PUT |
| `/api/attendance/*` | Attendance tracking | GET, POST |

### Database Schema
- **Tables**: 25+ tables with complete RLS policies
- **Relationships**: Foreign key constraints with cascading
- **Indexes**: Optimized for construction workflow queries
- **Migrations**: Version-controlled schema evolution

---

## 📊 Project Metrics

### Codebase Statistics
- **Total Components**: 100+ React components
- **Page Routes**: 50+ Next.js pages
- **Database Tables**: 25+ with full RLS
- **Test Coverage**: Unit, Integration, E2E testing
- **Documentation**: 80+ markdown files

### Performance Standards
- **Lighthouse Score**: 90+ across all metrics
- **Bundle Size**: Optimized with code splitting
- **Load Time**: <2s first contentful paint
- **Accessibility**: WCAG 2.1 AA compliant

---

## 🎯 Quick Navigation

### 👨‍💻 For Developers
1. **Start Here**: [README.md](README.md) → [CLAUDE.md](CLAUDE.md)
2. **Setup**: Environment setup and dependencies
3. **Architecture**: [docs/database-schema.md](docs/database-schema.md)
4. **UI System**: [docs/UI_Guidelines.md](docs/UI_Guidelines.md)

### 🎨 For Designers
1. **Design System**: [docs/ui-design-system.md](docs/ui-design-system.md)
2. **Mobile Guidelines**: [docs/mobile-design-guide.md](docs/mobile-design-guide.md)
3. **Spacing System**: [docs/spacing-system-guidelines.md](docs/spacing-system-guidelines.md)

### 🏢 For Project Managers
1. **Implementation Plan**: [docs/implementation-roadmap.md](docs/implementation-roadmap.md)
2. **Testing Strategy**: [docs/TEST_PLAN.md](docs/TEST_PLAN.md)
3. **Deployment Guide**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

### 🔧 For DevOps
1. **Deployment**: [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md)
2. **Monitoring**: [docs/PERFORMANCE_MONITORING.md](docs/PERFORMANCE_MONITORING.md)
3. **Security**: [docs/PRODUCTION_SECURITY_GUIDE.md](docs/PRODUCTION_SECURITY_GUIDE.md)

---

## 🏷️ Tags & Categories

**Primary Technologies**: `next.js-14` `typescript` `supabase` `tailwind-css` `pwa`
**Core Features**: `construction-management` `blueprint-markup` `attendance-tracking` `document-management`
**Platforms**: `mobile-first` `responsive` `cross-browser` `offline-capable`
**Quality**: `accessibility` `performance` `security` `testing`

---

*This documentation index is maintained automatically and reflects the current state of the INOPNC Work Management System. For specific implementation details, refer to the individual documentation files linked above.*

**Last Generated**: 2025-01-15 by SuperClaude Framework Documentation System
**Total Documentation Coverage**: 80+ files, 100+ components, 25+ database tables