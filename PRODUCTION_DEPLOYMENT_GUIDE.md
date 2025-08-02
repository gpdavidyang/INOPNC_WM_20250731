# Production Deployment Guide for INOPNC Work Management System

## Overview

This guide provides comprehensive instructions for deploying the INOPNC Work Management System to production with enterprise-grade security, monitoring, and compliance features.

## Prerequisites

### Required Software
- Node.js 18+ with npm
- PostgreSQL 14+ (or Supabase managed database)
- Redis 6+ (for rate limiting and caching)
- SSL/TLS certificates
- Domain with DNS access

### Required Services
- Supabase project (production tier)
- Email service (SendGrid, AWS SES, etc.)
- File storage (AWS S3, Azure Blob, etc.)
- CDN service (CloudFlare, AWS CloudFront, etc.)
- Monitoring service (Sentry, DataDog, etc.)

## 1. Environment Setup

### 1.1 Production Environment Variables

Copy `.env.production.example` to `.env.production` and configure:

```bash
# Core Application
NODE_ENV=production
APP_VERSION=1.0.0
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secure-secret-here

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-db-password

# Security
API_SIGNATURE_SECRET=your-api-signature-secret
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
COOKIE_DOMAIN=your-domain.com

# Rate Limiting
REDIS_URL=redis://your-redis-instance:6379
REDIS_PASSWORD=your-redis-password

# Monitoring & Logging
SENTRY_DSN=https://your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
LOG_LEVEL=info

# Backup & Security
BACKUP_SUCCESS_WEBHOOK=https://your-webhook-url/backup-success
BACKUP_FAILURE_WEBHOOK=https://your-webhook-url/backup-failure
AUDIT_ALERT_WEBHOOKS=https://your-webhook-url/security-alerts
SIEM_INTEGRATION=true

# Email & Notifications
EMAIL_FROM=noreply@your-domain.com
SENDGRID_API_KEY=your-sendgrid-key
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=your-s3-bucket
AWS_REGION=us-east-1

# CDN & Performance
CDN_BASE_URL=https://cdn.your-domain.com
ENABLE_STATIC_OPTIMIZATION=true
```

### 1.2 SSL/TLS Certificate Setup

1. Obtain SSL certificate from a trusted CA
2. Configure certificate in your load balancer or web server
3. Ensure HSTS is enabled
4. Configure certificate auto-renewal

### 1.3 Domain and DNS Configuration

1. Configure A/AAAA records for your domain
2. Set up CDN CNAME records
3. Configure CAA records for certificate authority authorization
4. Set up monitoring for DNS resolution

## 2. Database Setup

### 2.1 Supabase Production Configuration

1. **Create Production Project**
   ```bash
   # Create new Supabase project in production tier
   # Enable point-in-time recovery
   # Configure database backups
   # Set up read replicas if needed
   ```

2. **Apply Database Migrations**
   ```bash
   # Apply all migrations in order
   psql "postgres://postgres:password@db.project.supabase.co:5432/postgres" \
     -f supabase/migrations/001_construction_worklog_schema.sql
   
   # Continue with all migration files in order
   ```

3. **Configure Row Level Security**
   ```sql
   -- Verify all RLS policies are enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   
   -- Ensure all user tables have RLS enabled
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
   -- ... continue for all tables
   ```

4. **Set Up Database Monitoring**
   ```sql
   -- Enable pg_stat_statements for query monitoring
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
   
   -- Configure log settings
   ALTER SYSTEM SET log_statement = 'all';
   ALTER SYSTEM SET log_duration = on;
   ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
   ```

### 2.2 Database Security Hardening

1. **Connection Security**
   - Use SSL-only connections
   - Configure connection pooling
   - Set up IP whitelisting
   - Enable connection logging

2. **User Management**
   ```sql
   -- Create application user with minimal privileges
   CREATE USER app_user WITH PASSWORD 'secure-password';
   GRANT CONNECT ON DATABASE postgres TO app_user;
   GRANT USAGE ON SCHEMA public TO app_user;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
   
   -- Create read-only user for analytics
   CREATE USER analytics_user WITH PASSWORD 'secure-password';
   GRANT CONNECT ON DATABASE postgres TO analytics_user;
   GRANT USAGE ON SCHEMA public TO analytics_user;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_user;
   ```

## 3. Application Deployment

### 3.1 Build and Optimization

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Run production optimizations
npm run optimize

# Generate static files
npm run export
```

### 3.2 Security Configuration

1. **Enable Security Middleware**
   ```typescript
   // Replace middleware.ts with middleware.enhanced.ts
   mv middleware.ts middleware.basic.ts
   mv middleware.enhanced.ts middleware.ts
   ```

2. **Configure WAF Rules**
   ```typescript
   // Enable WAF in production
   import { getWAFEngine } from '@/lib/security/waf-rules'
   
   const waf = getWAFEngine()
   waf.setEnabled(true)
   ```

3. **Set Up Rate Limiting**
   ```typescript
   // Configure Redis for distributed rate limiting
   import { getRateLimiter } from '@/lib/security/rate-limiter'
   import Redis from 'redis'
   
   const redis = Redis.createClient({
     url: process.env.REDIS_URL,
     password: process.env.REDIS_PASSWORD
   })
   
   const rateLimiter = getRateLimiter(redis)
   ```

### 3.3 Performance Optimization

1. **Enable Caching**
   ```bash
   # Configure Redis for session and page caching
   # Set up CDN for static assets
   # Enable compression middleware
   ```

2. **Database Optimization**
   ```sql
   -- Create necessary indexes
   CREATE INDEX CONCURRENTLY idx_daily_reports_site_date 
   ON daily_reports(site_id, date DESC);
   
   CREATE INDEX CONCURRENTLY idx_attendance_records_date 
   ON attendance_records(date DESC, site_id);
   
   -- Configure connection pooling
   ALTER SYSTEM SET max_connections = 200;
   ALTER SYSTEM SET shared_buffers = '256MB';
   ```

## 4. Security Implementation

### 4.1 Web Application Firewall (WAF)

```typescript
// Configure WAF rules for production
import { WAF_CONFIG } from '@/lib/security/waf-rules'

const wafConfig = WAF_CONFIG.production
// WAF is automatically enabled in middleware.enhanced.ts
```

### 4.2 Security Monitoring

1. **Enable Security Scanning**
   ```typescript
   import { getSecurityScanner } from '@/lib/security/security-scanner'
   
   const scanner = getSecurityScanner()
   // Scanning runs automatically on schedule
   ```

2. **Configure Audit Logging**
   ```typescript
   import { getAuditLogger } from '@/lib/security/audit-logger'
   
   const logger = getAuditLogger()
   // Audit logging is automatically enabled
   ```

### 4.3 Backup Automation

```typescript
import { getBackupManager, BackupScheduler } from '@/lib/security/backup-automation'

const backupManager = getBackupManager()
const scheduler = new BackupScheduler(backupManager)
scheduler.start()
```

## 5. Monitoring and Alerting

### 5.1 Application Monitoring

1. **Sentry Configuration**
   ```typescript
   import * as Sentry from '@sentry/nextjs'
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: 'production',
     tracesSampleRate: 0.1,
     beforeSend(event) {
       // Filter sensitive data
       return event
     }
   })
   ```

2. **Performance Monitoring**
   ```typescript
   // Performance dashboard available at /dashboard/performance
   // Monitors Core Web Vitals, API response times, error rates
   ```

### 5.2 Infrastructure Monitoring

1. **Health Checks**
   ```bash
   # Health check endpoint
   curl https://your-domain.com/api/health
   
   # Expected response:
   {
     "status": "healthy",
     "timestamp": "2025-01-01T00:00:00.000Z",
     "checks": {
       "database": "healthy",
       "redis": "healthy",
       "storage": "healthy"
     }
   }
   ```

2. **Uptime Monitoring**
   - Configure external uptime monitoring
   - Set up alerts for downtime
   - Monitor from multiple geographic locations

### 5.3 Security Monitoring

1. **Security Alerts**
   ```typescript
   // Alerts are automatically sent for:
   // - High-risk audit events
   // - WAF violations
   // - Rate limit violations
   // - Authentication failures
   // - Security scan findings
   ```

2. **Compliance Monitoring**
   ```typescript
   // Audit logs include compliance tags:
   // - SOX, GDPR, ISO27001, HIPAA, PCI_DSS
   // - Automatic compliance violation detection
   // - Retention policy enforcement
   ```

## 6. Deployment Process

### 6.1 Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] DNS records configured
- [ ] Security configurations enabled
- [ ] Monitoring configured
- [ ] Backup systems tested
- [ ] Load testing completed
- [ ] Security scan passed

### 6.2 Zero-downtime Deployment

```bash
#!/bin/bash
# Zero-downtime deployment script

# 1. Create new deployment
kubectl apply -f k8s/deployment.yaml

# 2. Wait for new pods to be ready
kubectl rollout status deployment/inopnc-app

# 3. Update service to point to new deployment
kubectl patch service inopnc-service -p '{"spec":{"selector":{"version":"new"}}}'

# 4. Verify deployment health
curl -f https://your-domain.com/api/health || exit 1

# 5. Clean up old deployment
kubectl delete deployment inopnc-app-old
```

### 6.3 Rollback Procedure

```bash
#!/bin/bash
# Emergency rollback script

# 1. Rollback to previous deployment
kubectl rollout undo deployment/inopnc-app

# 2. Verify rollback health
kubectl rollout status deployment/inopnc-app

# 3. Check application health
curl -f https://your-domain.com/api/health

# 4. Notify team of rollback
echo "ROLLBACK COMPLETED: $(date)" | \
  curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Production rollback completed"}' \
  $SLACK_WEBHOOK_URL
```

## 7. Post-deployment Verification

### 7.1 Functional Testing

```bash
# Run automated tests against production
npm run test:production

# Test critical user journeys
npm run test:e2e:production

# Verify API endpoints
npm run test:api:production
```

### 7.2 Performance Testing

```bash
# Load testing
npm run test:load

# Performance benchmarks
npm run benchmark:production

# Core Web Vitals check
npm run test:vitals
```

### 7.3 Security Verification

```bash
# Security scan
npm run security:scan

# Penetration testing
npm run security:pentest

# Compliance check
npm run compliance:verify
```

## 8. Maintenance and Operations

### 8.1 Regular Maintenance Tasks

- **Daily**: Check monitoring dashboards, review security alerts
- **Weekly**: Review audit logs, check backup integrity
- **Monthly**: Security scans, performance optimization
- **Quarterly**: Security assessments, compliance audits

### 8.2 Backup and Recovery

1. **Backup Verification**
   ```bash
   # Verify backup integrity
   npm run backup:verify
   
   # Test restore procedure
   npm run backup:test-restore
   ```

2. **Disaster Recovery**
   ```bash
   # Full system recovery
   npm run disaster-recovery:execute
   
   # Point-in-time recovery
   npm run recovery:point-in-time "2025-01-01T12:00:00Z"
   ```

### 8.3 Security Operations

1. **Incident Response**
   ```bash
   # Security incident response playbook
   npm run security:incident-response
   
   # Forensic analysis
   npm run security:forensics
   ```

2. **Compliance Reporting**
   ```bash
   # Generate compliance reports
   npm run compliance:report --framework=SOX
   npm run compliance:report --framework=GDPR
   ```

## 9. Troubleshooting

### 9.1 Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database connectivity
   psql "postgres://postgres:password@db.project.supabase.co:5432/postgres" -c "SELECT 1;"
   
   # Check connection pool status
   npm run db:pool-status
   ```

2. **Performance Issues**
   ```bash
   # Check slow queries
   npm run db:slow-queries
   
   # Analyze performance metrics
   npm run performance:analyze
   ```

3. **Security Issues**
   ```bash
   # Check security events
   npm run security:events --severity=high
   
   # Review WAF logs
   npm run waf:logs --blocked-only
   ```

### 9.2 Emergency Procedures

1. **Security Breach Response**
   - Immediately isolate affected systems
   - Enable emergency security mode
   - Notify security team and stakeholders
   - Begin forensic analysis
   - Implement containment measures

2. **System Outage Response**
   - Check health endpoints
   - Review monitoring dashboards
   - Implement emergency rollback if needed
   - Notify users of service status
   - Begin root cause analysis

## 10. Compliance and Documentation

### 10.1 Required Documentation

- [ ] Security assessment report
- [ ] Penetration testing results
- [ ] Backup and recovery procedures
- [ ] Incident response playbook
- [ ] Data retention policies
- [ ] Privacy impact assessment
- [ ] Business continuity plan

### 10.2 Compliance Frameworks

This deployment meets requirements for:
- **SOX**: Financial data controls and audit trails
- **GDPR**: Data privacy and protection measures
- **ISO 27001**: Information security management
- **HIPAA**: Healthcare data protection (if applicable)
- **PCI DSS**: Payment data security (if applicable)

## 11. Support and Contact Information

- **Technical Support**: tech-support@your-company.com
- **Security Team**: security@your-company.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.your-company.com
- **Status Page**: https://status.your-company.com

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Reviewer**: Security Team, DevOps Team  
**Next Review**: July 2025