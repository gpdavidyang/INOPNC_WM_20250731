# INOPNC Deployment Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Deployment Workflows](#deployment-workflows)
4. [Configuration Management](#configuration-management)
5. [Security Setup](#security-setup)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Kubernetes cluster access
- kubectl configured
- GitHub repository access
- Supabase project setup

### 5-Minute Deployment to Staging

```bash
# 1. Clone repository
git clone https://github.com/your-org/inopnc-wm.git
cd inopnc-wm

# 2. Configure environment
cp .env.example .env.staging
# Edit .env.staging with your values

# 3. Build and deploy
docker build -f Dockerfile.production -t inopnc-wm:latest .
kubectl apply -f k8s/staging/

# 4. Verify deployment
./scripts/health-check-suite.sh staging
```

### Production Deployment Checklist

- [ ] All tests passing in staging
- [ ] Security scan completed
- [ ] Backup completed
- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Rollback plan ready

## Environment Setup

### Development Environment

#### Local Development with Docker
```bash
# Build development image
docker build -t inopnc-wm:dev .

# Run with docker-compose
docker-compose up -d

# Access application
open http://localhost:3000
```

#### Local Development with Node.js
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Configure your local Supabase instance

# Run development server
npm run dev
```

### Staging Environment

#### Kubernetes Staging Setup
```bash
# Create namespace
kubectl create namespace staging

# Apply staging configuration
kubectl apply -f k8s/staging/

# Configure secrets
kubectl create secret generic inopnc-secrets \
  --from-env-file=.env.staging \
  --namespace=staging

# Deploy application
kubectl apply -f k8s/staging/deployment.yaml

# Verify deployment
kubectl get pods -n staging
./scripts/health-check-suite.sh staging
```

### Production Environment

#### Infrastructure Requirements
- Kubernetes cluster (minimum 3 nodes)
- Load balancer with SSL termination
- Redis cluster for caching/sessions
- PostgreSQL database (managed service recommended)
- Container registry access
- Monitoring and logging infrastructure

#### Production Setup
```bash
# Create production namespace
kubectl create namespace production

# Apply RBAC configuration
kubectl apply -f k8s/rbac.yaml

# Create secrets
kubectl create secret generic inopnc-secrets \
  --from-env-file=.env.production \
  --namespace=production

# Apply network policies
kubectl apply -f k8s/network-policies.yaml

# Deploy blue environment
kubectl apply -f k8s/production-blue.yaml

# Deploy green environment  
kubectl apply -f k8s/production-green.yaml

# Set up service and ingress
kubectl apply -f k8s/production-service.yaml

# Verify deployment
./scripts/health-check-suite.sh production
```

## Deployment Workflows

### Automated Deployment via GitHub Actions

#### Triggering Deployments

**Staging Deployment:**
- Automatically triggered on push to `develop` branch
- Runs all tests and quality checks
- Deploys to staging environment
- Runs smoke tests

**Production Deployment:**
- Triggered by creating a release tag
- Manual approval required
- Supports multiple deployment strategies
- Comprehensive validation

#### Manual Workflow Trigger
```bash
# Via GitHub CLI
gh workflow run "Production Deployment" \
  --ref main \
  --field deployment_type=blue-green \
  --field version=v1.2.3

# Via GitHub UI
# 1. Go to Actions tab
# 2. Select "Production Deployment"
# 3. Click "Run workflow"
# 4. Select options and confirm
```

### Manual Deployment

#### Building Container Images
```bash
# Build production image
docker build \
  -f Dockerfile.production \
  -t ghcr.io/your-org/inopnc-wm:v1.2.3 \
  --build-arg BUILD_ID=v1.2.3 \
  .

# Push to registry
docker push ghcr.io/your-org/inopnc-wm:v1.2.3

# Tag as latest for environment
docker tag ghcr.io/your-org/inopnc-wm:v1.2.3 \
  ghcr.io/your-org/inopnc-wm:latest-production

docker push ghcr.io/your-org/inopnc-wm:latest-production
```

#### Blue-Green Deployment Process
```bash
# 1. Determine current active environment
CURRENT=$(kubectl get service inopnc-prod -n production \
  -o jsonpath='{.spec.selector.environment}')
TARGET=$([ "$CURRENT" = "blue" ] && echo "green" || echo "blue")

echo "Deploying to $TARGET environment..."

# 2. Update target environment
sed -i "s/latest-production/v1.2.3/g" k8s/production-${TARGET}.yaml
kubectl apply -f k8s/production-${TARGET}.yaml

# 3. Wait for rollout
kubectl rollout status deployment/inopnc-${TARGET} -n production

# 4. Run health checks
./scripts/health-check-suite.sh production

# 5. Switch traffic
kubectl patch service inopnc-prod -n production \
  -p '{"spec":{"selector":{"environment":"'${TARGET}'"}}}'

# 6. Validate production
./scripts/production-validation.sh
```

#### Rolling Deployment Process
```bash
# Update deployment image
kubectl set image deployment/inopnc-staging \
  app=ghcr.io/your-org/inopnc-wm:v1.2.3 \
  -n staging

# Monitor rollout
kubectl rollout status deployment/inopnc-staging -n staging

# Verify health
./scripts/health-check-suite.sh staging
```

### Rollback Procedures

#### Quick Rollback (Blue-Green)
```bash
# Emergency rollback
./scripts/rollback-traffic.sh production

# Or manual rollback
CURRENT=$(kubectl get service inopnc-prod -n production \
  -o jsonpath='{.spec.selector.environment}')
PREVIOUS=$([ "$CURRENT" = "blue" ] && echo "green" || echo "blue")

kubectl patch service inopnc-prod -n production \
  -p '{"spec":{"selector":{"environment":"'${PREVIOUS}'"}}}'
```

#### Deployment Rollback (Rolling)
```bash
# View rollout history
kubectl rollout history deployment/inopnc-staging -n staging

# Rollback to previous version
kubectl rollout undo deployment/inopnc-staging -n staging

# Rollback to specific revision
kubectl rollout undo deployment/inopnc-staging -n staging --to-revision=3
```

## Configuration Management

### Environment Variables

#### Required Configuration
```bash
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
BUILD_ID=v1.2.3

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Cache/Session
REDIS_URL=redis://user:pass@host:6379

# Security
JWT_SECRET=your-random-secret-key
API_SIGNATURE_SECRET=your-api-signature-secret
```

#### Optional Configuration
```bash
# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Performance
NEXT_PUBLIC_PERFORMANCE_MONITORING=true
ENABLE_REQUEST_LOGGING=true

# Feature Flags
FEATURE_FLAGS_CACHE_TIMEOUT=300000

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DEPLOYMENT_EMAIL_RECIPIENTS=admin@company.com

# External Services
EXTERNAL_API_URL=https://api.example.com
EXTERNAL_API_KEY=your-api-key
```

### Secrets Management

#### Creating Kubernetes Secrets
```bash
# From environment file
kubectl create secret generic inopnc-secrets \
  --from-env-file=.env.production \
  --namespace=production

# From individual values
kubectl create secret generic inopnc-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=redis-url="redis://..." \
  --from-literal=jwt-secret="..." \
  --namespace=production

# From files
kubectl create secret generic inopnc-tls \
  --from-file=tls.crt=server.crt \
  --from-file=tls.key=server.key \
  --namespace=production
```

#### Updating Secrets
```bash
# Update specific secret
kubectl patch secret inopnc-secrets -n production \
  -p '{"data":{"jwt-secret":"'$(echo -n "new-secret" | base64)'"}}'

# Replace entire secret
kubectl delete secret inopnc-secrets -n production
kubectl create secret generic inopnc-secrets \
  --from-env-file=.env.production \
  --namespace=production

# Restart pods to pick up new secrets
kubectl rollout restart deployment/inopnc-blue -n production
kubectl rollout restart deployment/inopnc-green -n production
```

### Feature Flags Configuration

#### Default Feature Flags
```json
{
  "new_dashboard_ui": {
    "enabled": true,
    "rollout_percentage": 25,
    "user_segments": ["beta", "admin"],
    "environments": ["production", "staging"]
  },
  "enhanced_analytics": {
    "enabled": true,
    "rollout_percentage": 50,
    "user_segments": ["admin", "manager"],
    "environments": ["production", "staging"]
  },
  "beta_markup_tools": {
    "enabled": true,
    "rollout_percentage": 30,
    "user_segments": ["beta", "admin"],
    "environments": ["staging", "production"]
  }
}
```

#### Runtime Feature Flag Updates
```bash
# Update via API (requires admin authentication)
curl -X PATCH "$BASE_URL/api/admin/feature-flags/new_dashboard_ui" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rollout_percentage": 50}'

# Update via Kubernetes ConfigMap
kubectl patch configmap feature-flags -n production \
  --patch '{"data":{"new_dashboard_ui.rollout_percentage":"50"}}'
```

## Security Setup

### SSL/TLS Configuration

#### Certificate Management
```bash
# Create TLS secret from certificate files
kubectl create secret tls inopnc-tls-secret \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  --namespace=production

# Or using cert-manager (recommended)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: inopnc-tls
  namespace: production
spec:
  secretName: inopnc-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - your-domain.com
  - www.your-domain.com
```

### Security Scanning

#### Container Security Scanning
```bash
# Scan with Trivy
trivy image ghcr.io/your-org/inopnc-wm:v1.2.3

# Scan with Snyk
snyk container test ghcr.io/your-org/inopnc-wm:v1.2.3

# OWASP ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://your-domain.com
```

#### Dependency Scanning
```bash
# Audit npm dependencies
npm audit

# Check for vulnerabilities with Snyk
snyk test

# Update vulnerable dependencies
npm audit fix
```

### Network Security

#### Network Policies
```yaml
# Allow ingress traffic only from ingress controller
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: inopnc-network-policy
spec:
  podSelector:
    matchLabels:
      app: inopnc
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
```

#### WAF Configuration
```bash
# Deploy WAF rules
kubectl apply -f k8s/waf-rules.yaml

# Test WAF protection
curl -X POST "https://your-domain.com/api/test" \
  -d "'; DROP TABLE users; --"  # Should be blocked
```

## Monitoring Setup

### Health Checks

#### Application Health Endpoints
- `/api/health` - Basic health check
- `/api/health/ready` - Readiness check (includes dependencies)
- `/api/health/database` - Database connectivity
- `/api/health/redis` - Redis connectivity

#### Kubernetes Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 60
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 15
  periodSeconds: 10
```

### Metrics and Monitoring

#### Prometheus Integration
```yaml
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: inopnc-metrics
spec:
  selector:
    matchLabels:
      app: inopnc
  endpoints:
  - port: http
    path: /api/metrics
```

#### Key Metrics to Monitor
- Response time (95th percentile < 500ms)
- Error rate (< 0.1%)
- Request throughput
- CPU usage (< 70%)
- Memory usage (< 80%)
- Database connection pool usage
- Redis connection count

### Alerting Rules

#### Critical Alerts
```yaml
groups:
- name: inopnc.critical
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
    for: 5m
    labels:
      severity: critical
```

### Log Aggregation

#### Centralized Logging Setup
```bash
# Deploy Fluentd or Fluent Bit
kubectl apply -f k8s/logging/

# Configure log forwarding to your logging service
# (ELK stack, Grafana Loki, etc.)
```

#### Log Format Configuration
```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "level": "INFO",
  "service": "inopnc-wm",
  "environment": "production",
  "version": "v1.2.3",
  "message": "Request processed",
  "metadata": {
    "userId": "user123",
    "requestId": "req456",
    "duration": 150
  }
}
```

## Backup and Recovery

### Database Backup

#### Automated Backup Setup
```bash
# Deploy backup CronJob
kubectl apply -f k8s/backup-cronjob.yaml

# Manual backup
kubectl create job backup-$(date +%Y%m%d-%H%M%S) \
  --from=cronjob/database-backup -n production

# Verify backup
kubectl get jobs -n production | grep backup
```

#### Backup Script Configuration
```bash
#!/bin/bash
# Backup configuration
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_PATH="s3://your-backup-bucket/database"
DATABASE_URL="postgresql://..."

# Perform backup
pg_dump "$DATABASE_URL" | gzip > "backup-$(date +%Y%m%d-%H%M%S).sql.gz"

# Upload to storage
aws s3 cp "backup-$(date +%Y%m%d-%H%M%S).sql.gz" "$BACKUP_STORAGE_PATH/"

# Cleanup old backups
find /backups -name "*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
```

### Disaster Recovery

#### Recovery Procedures
```bash
# 1. Restore from backup
aws s3 cp s3://your-backup-bucket/database/backup-20250101-120000.sql.gz .
gunzip backup-20250101-120000.sql.gz

# 2. Create new database (if needed)
createdb inopnc_restored

# 3. Restore data
psql inopnc_restored < backup-20250101-120000.sql

# 4. Update connection strings
kubectl patch secret inopnc-secrets -n production \
  -p '{"data":{"database-url":"'$(echo -n "$NEW_DATABASE_URL" | base64)'"}}'

# 5. Restart applications
kubectl rollout restart deployment/inopnc-blue -n production
kubectl rollout restart deployment/inopnc-green -n production
```

### Application State Backup

#### File Storage Backup
```bash
# If using persistent volumes
kubectl get pv
kubectl get pvc -n production

# Create volume snapshots (cloud provider specific)
# AWS EBS, GCP Persistent Disk, etc.
```

## Troubleshooting

### Common Issues

#### Pod Startup Issues
```bash
# Check pod status
kubectl get pods -n production

# Describe problematic pod
kubectl describe pod pod-name -n production

# Check logs
kubectl logs pod-name -n production --previous

# Common solutions:
# - Check resource limits
# - Verify environment variables
# - Check image availability
# - Review security contexts
```

#### Service Discovery Issues
```bash
# Check service endpoints
kubectl get endpoints -n production

# Test service connectivity
kubectl run debug --image=busybox -it --rm --restart=Never -n production
# Inside pod: nslookup service-name

# Check network policies
kubectl get networkpolicies -n production
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n production
kubectl top nodes

# Scale horizontally
kubectl scale deployment inopnc-blue --replicas=5 -n production

# Check HPA status
kubectl get hpa -n production
kubectl describe hpa inopnc-blue-hpa -n production
```

### Diagnostic Tools

#### Debug Pod for Network Testing
```bash
# Create debug pod
kubectl run debug --image=nicolaka/netshoot -it --rm --restart=Never -n production

# Inside debug pod:
# - nslookup service-name
# - curl http://service-name/api/health
# - ping external-service
# - traceroute destination
```

#### Application Debugging
```bash
# Connect to application container
kubectl exec -it pod-name -n production -- /bin/sh

# Check application logs
kubectl logs -f deployment/inopnc-blue -n production

# Stream logs from multiple pods
kubectl logs -f -l app=inopnc -n production --max-log-requests=10
```

### Performance Tuning

#### Resource Optimization
```yaml
# Optimized resource requests/limits
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"

# Enable vertical pod autoscaling
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: inopnc-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: inopnc-blue
  updatePolicy:
    updateMode: "Auto"
```

#### Database Optimization
```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Analyze table statistics
ANALYZE;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename = 'your_table';
```

---

## Additional Resources

### Documentation Links
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production](https://supabase.com/docs/guides/platform/going-to-prod)

### Internal Links
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)

### Support Contacts
- **Engineering Team**: engineering@company.com
- **DevOps Team**: devops@company.com
- **On-Call**: +1-555-ON-CALL

---

*This guide should be updated regularly to reflect changes in infrastructure and procedures.*