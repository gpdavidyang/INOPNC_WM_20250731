# Production Security Guide

## 🔒 Production Environment Setup and Security Hardening

This document outlines the comprehensive security measures implemented for the INOPNC Work Management System production environment.

## 📋 Security Checklist

### ✅ **Supabase RLS Policies**
- [x] All tables have Row Level Security enabled
- [x] Role-based access controls implemented
- [x] Organization-level data isolation
- [x] Site-level access restrictions for site managers
- [x] Admin-only access for sensitive operations
- [x] System admin superuser permissions

### ✅ **Environment Variables & Secrets**
- [x] Production environment variables template
- [x] Secret rotation procedures
- [x] Environment-specific configurations
- [x] API key management best practices

### ✅ **API Security**
- [x] Rate limiting implementation
- [x] Request validation middleware
- [x] CORS configuration
- [x] Security headers middleware
- [x] Request signing for sensitive operations

### ✅ **Infrastructure Security**
- [x] WAF rules configuration
- [x] DDoS protection setup
- [x] SSL/TLS configuration
- [x] Security monitoring

### ✅ **Backup & Recovery**
- [x] Automated backup procedures
- [x] Point-in-time recovery setup
- [x] Disaster recovery runbook
- [x] Data retention policies

### ✅ **Audit & Compliance**
- [x] Audit logging implementation
- [x] Security event monitoring
- [x] Compliance reporting
- [x] Access logging

## 🔐 Implementation Details

### 1. **Row Level Security (RLS) Policies**

All database tables implement comprehensive RLS policies:

```sql
-- Example: Daily Reports RLS Policy
CREATE POLICY "users_can_crud_own_daily_reports" ON daily_reports
  FOR ALL USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'system_admin', 'site_manager')
      AND (
        profiles.role IN ('admin', 'system_admin') OR
        profiles.site_id = daily_reports.site_id
      )
    )
  );
```

**Key Security Features:**
- Organization-level data isolation
- Role-based permissions (worker, site_manager, admin, system_admin, customer_manager)
- Site-level access control for site managers
- Admin override capabilities with audit trails

### 2. **API Rate Limiting**

Comprehensive rate limiting to prevent abuse and DDoS attacks:

```typescript
// Different limits for different endpoints
const rateLimits = {
  authentication: '5 requests per minute',
  dataRead: '100 requests per minute', 
  dataWrite: '20 requests per minute',
  fileUpload: '10 requests per minute',
  adminOperations: '50 requests per minute'
}
```

### 3. **Security Headers**

Essential security headers implemented:

```typescript
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': 'default-src \'self\'; ...'
}
```

### 4. **WAF Rules**

Web Application Firewall rules for common attacks:
- SQL injection protection
- XSS prevention
- CSRF protection
- Directory traversal prevention
- File upload validation
- Rate limiting by IP and user

### 5. **Audit Logging**

Comprehensive audit trail for compliance:
- User authentication events
- Data access and modification
- Administrative operations
- Security events and alerts
- Failed login attempts
- Permission changes

## 🚀 Production Deployment Steps

### 1. **Environment Setup**
```bash
# Set production environment variables
export NODE_ENV=production
export NEXTAUTH_URL=https://your-domain.com
export NEXTAUTH_SECRET=your-super-secret-key
export SUPABASE_URL=your-production-supabase-url
export SUPABASE_ANON_KEY=your-production-anon-key
export SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
```

### 2. **Database Security**
```bash
# Apply all migrations to production
supabase db push --db-url "$PRODUCTION_DB_URL"

# Verify RLS policies
supabase db diff --linked
```

### 3. **Security Verification**
```bash
# Run security tests
npm run test:security

# Verify rate limiting
npm run test:rate-limits

# Test RLS policies
npm run test:rls
```

## 🔍 Security Monitoring

### Real-time Alerts
- Failed authentication attempts > 5 per minute
- Unusual data access patterns
- High error rates from specific IPs
- Suspicious file upload activities
- Admin operations outside business hours

### Dashboard Metrics
- Authentication success/failure rates
- API response times and error rates
- Database query performance
- Security events timeline
- User activity patterns

## 📊 Compliance Features

### GDPR Compliance
- User data export functionality
- Right to be forgotten implementation
- Data processing audit trails
- Consent management
- Data minimization principles

### Security Standards
- OWASP Top 10 protection
- ISO 27001 alignment
- Construction industry data protection standards
- Korean data protection law compliance

## 🔄 Backup & Recovery

### Automated Backups
- Daily full database backups
- Hourly incremental backups
- File storage backup to multiple regions
- Configuration backup automation

### Recovery Procedures
- Point-in-time recovery capability
- Cross-region failover setup
- Data integrity verification
- Recovery time objective: < 4 hours
- Recovery point objective: < 1 hour

## 🚨 Incident Response

### Security Incident Workflow
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Security team evaluation
3. **Containment**: Immediate threat isolation
4. **Investigation**: Root cause analysis
5. **Recovery**: System restoration
6. **Documentation**: Incident report and lessons learned

### Emergency Contacts
- Security Team: security@inopnc.com
- Infrastructure Team: infra@inopnc.com
- Management Escalation: management@inopnc.com

## 🔧 Tools & Technologies

### Security Tools
- **Supabase Auth**: Authentication and authorization
- **Next.js Middleware**: Request validation and rate limiting
- **Sentry**: Error monitoring and performance tracking
- **Cloudflare**: WAF and DDoS protection
- **Let's Encrypt**: SSL/TLS certificates

### Monitoring Tools
- **Supabase Dashboard**: Database monitoring
- **Vercel Analytics**: Application performance
- **Custom Analytics**: Security event tracking
- **Uptime Monitoring**: Service availability

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Korean Data Protection Laws](https://www.privacy.go.kr/)

---

**Last Updated**: 2025-08-02  
**Version**: 1.0  
**Owner**: INOPNC Security Team