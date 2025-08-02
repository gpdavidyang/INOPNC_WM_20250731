# INOPNC Deployment Runbook

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Strategies](#deployment-strategies)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Procedures](#deployment-procedures)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring and Health Checks](#monitoring-and-health-checks)
8. [Troubleshooting](#troubleshooting)
9. [Emergency Procedures](#emergency-procedures)
10. [Post-Deployment Verification](#post-deployment-verification)

## Overview

This runbook provides step-by-step procedures for deploying the INOPNC Work Management System to production environments. The system uses a containerized deployment with Kubernetes orchestration and supports multiple deployment strategies.

### Architecture Overview
- **Frontend**: Next.js 14 application
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Kubernetes with blue-green deployment
- **CI/CD**: GitHub Actions
- **Monitoring**: Health checks, metrics, and notifications

### Key Components
- Production Docker image
- Kubernetes manifests (blue/green environments)
- GitHub Actions workflows
- Feature flag system
- Notification system
- Security scanning and backup automation

## Pre-Deployment Checklist

### Before Every Deployment

#### Code Quality Checks
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review completed and approved
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Bundle analysis completed (size within limits)
- [ ] TypeScript compilation successful
- [ ] ESLint/Prettier checks passed

#### Environment Preparation
- [ ] Staging environment tested and validated
- [ ] Database migrations reviewed and tested
- [ ] Environment variables configured
- [ ] Secrets updated in Kubernetes
- [ ] Feature flags configured appropriately
- [ ] Backup completed

#### Team Communication
- [ ] Deployment scheduled and communicated
- [ ] Stakeholders notified
- [ ] Rollback plan confirmed
- [ ] On-call engineer identified

#### Infrastructure Checks
- [ ] Kubernetes cluster healthy
- [ ] Container registry accessible
- [ ] Load balancer configured
- [ ] SSL certificates valid
- [ ] Monitoring systems operational

## Deployment Strategies

### 1. Blue-Green Deployment (Recommended for Production)

Blue-green deployment maintains two identical production environments (blue and green), allowing for zero-downtime deployments with instant rollback capability.

**Advantages:**
- Zero downtime
- Instant rollback
- Full production testing before traffic switch
- Easy to automate

**Process:**
1. Deploy to inactive environment (green if blue is active)
2. Run health checks on new environment
3. Switch traffic to new environment
4. Monitor and validate
5. Keep old environment for potential rollback

### 2. Rolling Deployment (For Staging)

Rolling deployment gradually replaces old pods with new ones, one at a time.

**Advantages:**
- Resource efficient
- Gradual deployment
- Built-in Kubernetes support

**Process:**
1. Update deployment manifest
2. Kubernetes replaces pods one by one
3. Health checks ensure pod readiness
4. Rollback available through Kubernetes

### 3. Canary Deployment (For Special Cases)

Canary deployment routes a small percentage of traffic to the new version.

**Advantages:**
- Risk mitigation
- Performance testing with real traffic
- Gradual rollout

**Process:**
1. Deploy canary version (small replica count)
2. Route 5-10% traffic to canary
3. Monitor metrics and error rates
4. Gradually increase traffic percentage
5. Complete rollout or rollback based on metrics

## Environment Configuration

### Environment Variables

#### Required Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Cache/Session
REDIS_URL=redis://user:pass@host:6379

# Security
JWT_SECRET=your-jwt-secret
API_SIGNATURE_SECRET=your-api-signature-secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

#### Optional Environment Variables
```bash
# Feature Flags
FEATURE_FLAGS_CACHE_TIMEOUT=300000

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SLACK_ALERT_WEBHOOK_URL=https://hooks.slack.com/...
DEPLOYMENT_EMAIL_RECIPIENTS=admin@company.com

# Performance
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
ENABLE_REQUEST_LOGGING=true
```

### Kubernetes Secrets

Secrets are stored in Kubernetes and referenced by deployments:

```bash
# Create secrets
kubectl create secret generic inopnc-secrets \
  --from-literal=next-public-supabase-url="https://..." \
  --from-literal=next-public-supabase-anon-key="..." \
  --from-literal=supabase-service-role-key="..." \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-url="redis://..." \
  --from-literal=jwt-secret="..." \
  --from-literal=api-signature-secret="..." \
  --from-literal=sentry-dsn="https://..." \
  --namespace=production
```

## Deployment Procedures

### Automated Deployment (Recommended)

#### Via GitHub Actions (Production)

1. **Create Release Tag**
   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push origin v1.2.3
   ```

2. **Trigger Deployment**
   - Navigate to GitHub Actions
   - Select "Production Deployment" workflow
   - Choose deployment strategy (blue-green, rolling, canary)
   - Click "Run workflow"

3. **Monitor Deployment**
   - Watch GitHub Actions logs
   - Monitor Slack/Discord notifications
   - Check Kubernetes dashboard
   - Verify health checks

#### Manual Deployment Steps

1. **Build and Push Image**
   ```bash
   # Build production image
   docker build -f Dockerfile.production -t ghcr.io/your-org/inopnc-wm:v1.2.3 .
   
   # Push to registry
   docker push ghcr.io/your-org/inopnc-wm:v1.2.3
   ```

2. **Update Kubernetes Manifests**
   ```bash
   # Update image tag in manifest
   sed -i 's/latest-production/v1.2.3/g' k8s/production-green.yaml
   ```

3. **Deploy to Kubernetes**
   ```bash
   # Apply new deployment
   kubectl apply -f k8s/production-green.yaml
   
   # Wait for rollout
   kubectl rollout status deployment/inopnc-green -n production
   ```

4. **Switch Traffic (Blue-Green)**
   ```bash
   # Update service selector
   kubectl patch service inopnc-prod -n production -p '{"spec":{"selector":{"environment":"green"}}}'
   ```

### Blue-Green Deployment Procedure

#### Step 1: Deploy to Target Environment

```bash
# Determine current active environment
CURRENT=$(kubectl get service inopnc-prod -n production -o jsonpath='{.spec.selector.environment}')
TARGET=$([ "$CURRENT" = "blue" ] && echo "green" || echo "blue")

echo "Current active: $CURRENT"
echo "Deploying to: $TARGET"

# Deploy to target environment
kubectl apply -f k8s/production-${TARGET}.yaml

# Wait for deployment to be ready
kubectl rollout status deployment/inopnc-${TARGET} -n production --timeout=600s
```

#### Step 2: Health Check Target Environment

```bash
# Get target service endpoint
TARGET_IP=$(kubectl get service inopnc-${TARGET}-service -n production -o jsonpath='{.spec.clusterIP}')

# Run health checks
curl -f http://${TARGET_IP}/api/health
curl -f http://${TARGET_IP}/api/health/ready

# Run smoke tests
./scripts/smoke-tests.sh http://${TARGET_IP}
```

#### Step 3: Switch Traffic

```bash
# Switch traffic to target environment
kubectl patch service inopnc-prod -n production -p '{"spec":{"selector":{"environment":"'${TARGET}'"}}}'

echo "Traffic switched to ${TARGET} environment"
```

#### Step 4: Validate Production

```bash
# Wait for DNS propagation
sleep 30

# Validate production endpoint
curl -f https://your-domain.com/api/health
./scripts/production-validation.sh
```

#### Step 5: Update Status

```bash
# Send deployment notification
node scripts/deployment-notifications.js \
  --status=success \
  --environment=production \
  --strategy=blue-green \
  --version=v1.2.3
```

## Rollback Procedures

### Immediate Rollback (Blue-Green)

If issues are detected immediately after deployment:

```bash
# Switch back to previous environment
CURRENT=$(kubectl get service inopnc-prod -n production -o jsonpath='{.spec.selector.environment}')
PREVIOUS=$([ "$CURRENT" = "blue" ] && echo "green" || echo "blue")

kubectl patch service inopnc-prod -n production -p '{"spec":{"selector":{"environment":"'${PREVIOUS}'"}}}'

echo "Rolled back to ${PREVIOUS} environment"
```

### Rolling Back Kubernetes Deployment

```bash
# View rollout history
kubectl rollout history deployment/inopnc-blue -n production

# Rollback to previous version
kubectl rollout undo deployment/inopnc-blue -n production

# Rollback to specific revision
kubectl rollout undo deployment/inopnc-blue -n production --to-revision=2
```

### Database Rollback

```bash
# Connect to database
psql $DATABASE_URL

# Check migration status
SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;

# Rollback specific migration (if needed)
# Note: Be extremely careful with data migrations
# Always backup before rolling back
```

### Complete Rollback Procedure

1. **Immediate Actions**
   ```bash
   # Switch traffic back
   ./scripts/rollback-traffic.sh
   
   # Verify rollback
   curl -f https://your-domain.com/api/health
   ```

2. **Notification**
   ```bash
   # Notify team
   node scripts/deployment-notifications.js \
     --status=rollback \
     --environment=production \
     --reason="Critical bug detected"
   ```

3. **Investigation**
   - Check application logs
   - Review monitoring dashboards
   - Identify root cause
   - Document incident

4. **Post-Rollback**
   - Verify system stability
   - Plan fix for next deployment
   - Update deployment procedures if needed

## Monitoring and Health Checks

### Health Check Endpoints

#### Primary Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Expected Response**: 200 OK
- **Response**: `{"status": "healthy", "timestamp": "2025-01-01T00:00:00Z"}`

#### Readiness Check
- **URL**: `/api/health/ready`
- **Method**: GET
- **Expected Response**: 200 OK
- **Checks**: Database connectivity, Redis connectivity

#### Detailed Health Check
- **URL**: `/api/health/detailed`
- **Method**: GET
- **Expected Response**: 200 OK
- **Response**: Detailed system status

### Monitoring Dashboards

#### Key Metrics to Monitor
- **Response Time**: < 200ms (95th percentile)
- **Error Rate**: < 0.1%
- **CPU Usage**: < 70%
- **Memory Usage**: < 80%
- **Database Connections**: < 80% of pool
- **Request Rate**: Monitor for anomalies

#### Alerts Configuration
- **Critical**: Response time > 2s, Error rate > 1%
- **Warning**: Response time > 500ms, Error rate > 0.5%
- **Info**: Deployment events, scaling events

### Log Aggregation

#### Application Logs
```bash
# View recent logs
kubectl logs -f deployment/inopnc-blue -n production

# View specific container logs
kubectl logs -f pod/inopnc-blue-xxx -c app -n production

# Search logs for errors
kubectl logs deployment/inopnc-blue -n production | grep ERROR
```

#### Infrastructure Logs
- Kubernetes events
- Ingress controller logs
- Load balancer logs
- Network policy logs

## Troubleshooting

### Common Issues and Solutions

#### 1. Pod Not Starting

**Symptoms:**
- Pods stuck in `Pending` or `CrashLoopBackOff`
- Health checks failing

**Investigation:**
```bash
# Check pod status
kubectl get pods -n production

# Describe problematic pod
kubectl describe pod inopnc-blue-xxx -n production

# Check logs
kubectl logs inopnc-blue-xxx -n production --previous
```

**Solutions:**
- Check resource limits
- Verify environment variables
- Check image availability
- Review security contexts

#### 2. Service Not Accessible

**Symptoms:**
- 503/504 errors
- Connection timeouts
- DNS resolution failures

**Investigation:**
```bash
# Check service status
kubectl get services -n production

# Check endpoint status
kubectl get endpoints -n production

# Test service connectivity
kubectl exec -it debug-pod -- curl http://inopnc-prod/api/health
```

**Solutions:**
- Verify service selectors
- Check pod readiness
- Validate network policies
- Review ingress configuration

#### 3. Database Connection Issues

**Symptoms:**
- Database connection errors
- Slow queries
- Connection pool exhaustion

**Investigation:**
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool status
# (application-specific monitoring)

# Review database logs
# (depends on database setup)
```

**Solutions:**
- Verify database credentials
- Check connection pool settings
- Review database performance
- Scale database if needed

#### 4. High Memory Usage

**Symptoms:**
- Pods being OOMKilled
- Slow performance
- Memory alerts

**Investigation:**
```bash
# Check resource usage
kubectl top pods -n production

# Get detailed metrics
kubectl describe pod inopnc-blue-xxx -n production
```

**Solutions:**
- Increase memory limits
- Optimize application code
- Check for memory leaks
- Review caching strategies

### Debug Tools

#### Interactive Debugging
```bash
# Connect to running pod
kubectl exec -it inopnc-blue-xxx -n production -- /bin/sh

# Run debug container
kubectl run debug --image=busybox -it --rm --restart=Never -n production
```

#### Network Debugging
```bash
# Test network connectivity
kubectl exec -it debug-pod -- nslookup inopnc-prod

# Check network policies
kubectl get networkpolicies -n production

# View service endpoints
kubectl get endpoints inopnc-prod -n production -o yaml
```

#### Performance Debugging
```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods -n production

# Get detailed resource usage
kubectl describe node node-name
```

## Emergency Procedures

### Production Outage Response

#### Immediate Actions (0-5 minutes)
1. **Acknowledge Incident**
   - Alert on-call engineer
   - Create incident channel
   - Begin incident log

2. **Assess Impact**
   - Check monitoring dashboards
   - Verify scope of outage
   - Identify affected users

3. **Initial Response**
   - Check recent deployments
   - Review error logs
   - Consider immediate rollback

#### Short-term Actions (5-30 minutes)
1. **Implement Fix**
   - Rollback recent deployment if suspected
   - Scale resources if capacity issue
   - Apply hotfix if identified

2. **Communicate Status**
   - Update status page
   - Notify stakeholders
   - Provide ETA if possible

#### Recovery Actions (30+ minutes)
1. **Full Recovery**
   - Verify system stability
   - Confirm all services operational
   - Monitor for additional issues

2. **Post-Incident**
   - Document incident timeline
   - Schedule post-mortem
   - Update procedures as needed

### Disaster Recovery

#### Data Backup
```bash
# Manual backup trigger
kubectl create job backup-$(date +%Y%m%d-%H%M%S) --from=cronjob/database-backup -n production

# Verify backup completion
kubectl get jobs -n production | grep backup
```

#### Infrastructure Recovery
```bash
# Recreate namespace
kubectl create namespace production

# Apply all manifests
kubectl apply -f k8s/ -n production

# Restore secrets
kubectl apply -f secrets/ -n production
```

#### Database Recovery
```bash
# Restore from backup
# (depends on backup solution)

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users"
```

## Post-Deployment Verification

### Automated Verification

#### Health Checks
```bash
# Run full health check suite
./scripts/health-check-suite.sh production

# Verify all endpoints
./scripts/endpoint-verification.sh https://your-domain.com
```

#### Smoke Tests
```bash
# Run production smoke tests
npm run test:smoke:production

# Run E2E tests against production
npm run test:e2e:production
```

#### Performance Tests
```bash
# Run load test
./scripts/load-test.sh https://your-domain.com

# Check performance metrics
./scripts/performance-check.sh
```

### Manual Verification

#### Functional Testing
- [ ] User login/logout works
- [ ] Critical user journeys function
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] File uploads/downloads work

#### Performance Testing
- [ ] Page load times acceptable
- [ ] API response times normal
- [ ] No memory leaks detected
- [ ] Database query performance normal

#### Security Testing
- [ ] Security headers present
- [ ] SSL/TLS working correctly
- [ ] Authentication functioning
- [ ] Authorization rules enforced

### Deployment Success Criteria

A deployment is considered successful when:

#### Technical Criteria
- [ ] All pods running and healthy
- [ ] Health checks passing consistently
- [ ] No increase in error rates
- [ ] Performance metrics within acceptable ranges
- [ ] Database migrations completed successfully

#### Business Criteria
- [ ] Critical user journeys working
- [ ] No user-reported issues
- [ ] Feature flags working as expected
- [ ] Monitoring and alerting functional

#### Operational Criteria
- [ ] Deployment notifications sent
- [ ] Documentation updated
- [ ] Team informed of completion
- [ ] Rollback plan confirmed working

### Sign-off Process

1. **Technical Sign-off**
   - Engineering team verifies technical criteria
   - QA team confirms functionality
   - DevOps team validates infrastructure

2. **Business Sign-off**
   - Product owner confirms features working
   - Customer success verifies no impact
   - Support team prepared for any issues

3. **Final Approval**
   - Deployment marked as successful
   - Previous version marked for cleanup
   - Next deployment scheduled if needed

---

## Contact Information

### On-Call Rotation
- **Primary**: Engineering Team Lead
- **Secondary**: Senior DevOps Engineer
- **Escalation**: CTO

### Communication Channels
- **Slack**: #deployments, #incidents
- **Email**: engineering@company.com
- **Phone**: Emergency hotline (if applicable)

### External Dependencies
- **Supabase Support**: support@supabase.com
- **Cloud Provider**: support@cloudprovider.com
- **CDN Provider**: support@cdnprovider.com

---

*This runbook should be reviewed and updated after each deployment and incident.*