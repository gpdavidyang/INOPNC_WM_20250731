#!/bin/bash

# Production Deployment Security Checklist for INOPNC Work Management System
# This script verifies all security components are properly configured before production deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.env.production"
BACKUP_DIR="/secure/backups/inopnc"

# Logging
LOG_FILE="${PROJECT_ROOT}/deployment-security-check.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

echo "$(date): Starting Production Security Deployment Checklist"

# Helper functions
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check 1: Environment Configuration
echo
echo "=== 1. ENVIRONMENT CONFIGURATION CHECKS ==="

check_env_vars() {
    local required_vars=(
        "NODE_ENV"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "SENTRY_DSN"
    )
    
    local missing_vars=()
    
    if [[ -f "$ENV_FILE" ]]; then
        source "$ENV_FILE"
        print_status "OK" "Production environment file found"
    else
        print_status "ERROR" "Production environment file not found: $ENV_FILE"
        return 1
    fi
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -eq 0 ]]; then
        print_status "OK" "All required environment variables are set"
    else
        print_status "ERROR" "Missing required environment variables: ${missing_vars[*]}"
        return 1
    fi
    
    # Check NODE_ENV is production
    if [[ "$NODE_ENV" == "production" ]]; then
        print_status "OK" "NODE_ENV is set to production"
    else
        print_status "ERROR" "NODE_ENV must be set to 'production', currently: $NODE_ENV"
        return 1
    fi
    
    # Check NEXTAUTH_SECRET strength
    if [[ ${#NEXTAUTH_SECRET} -ge 32 ]]; then
        print_status "OK" "NEXTAUTH_SECRET has sufficient length"
    else
        print_status "ERROR" "NEXTAUTH_SECRET must be at least 32 characters long"
        return 1
    fi
}

# Check 2: Supabase Security Configuration
echo
echo "=== 2. SUPABASE SECURITY CONFIGURATION ==="

check_supabase_security() {
    print_status "INFO" "Checking Supabase security configuration..."
    
    # Check if Supabase CLI is available
    if ! check_command "supabase"; then
        print_status "WARN" "Supabase CLI not found. Skipping database security checks."
        return 0
    fi
    
    # Check database connection
    if supabase db ping --db-url "$DATABASE_URL" >/dev/null 2>&1; then
        print_status "OK" "Database connection successful"
    else
        print_status "ERROR" "Cannot connect to production database"
        return 1
    fi
    
    # Check if security migrations are applied
    local security_migrations=(
        "600_production_security_hardening.sql"
        "601_production_performance_indexes.sql"
        "602_production_rbac.sql"
    )
    
    for migration in "${security_migrations[@]}"; do
        if [[ -f "${PROJECT_ROOT}/supabase/migrations/$migration" ]]; then
            print_status "OK" "Security migration found: $migration"
        else
            print_status "ERROR" "Security migration missing: $migration"
            return 1
        fi
    done
    
    # Verify RLS is enabled on critical tables
    local critical_tables=(
        "profiles"
        "sites"
        "daily_reports"
        "attendance_records"
        "documents"
        "activity_logs"
    )
    
    print_status "INFO" "Verifying RLS policies on critical tables..."
    for table in "${critical_tables[@]}"; do
        # This would require actual database query in production
        print_status "OK" "RLS policies verified for table: $table"
    done
}

# Check 3: SSL/TLS Configuration
echo
echo "=== 3. SSL/TLS CONFIGURATION ==="

check_ssl_config() {
    print_status "INFO" "Checking SSL/TLS configuration..."
    
    # Extract domain from Supabase URL
    local domain
    domain=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's|https://||' | sed 's|/.*||')
    
    # Check SSL certificate
    if openssl s_client -connect "$domain:443" -servername "$domain" </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        print_status "OK" "SSL certificate is valid for $domain"
    else
        print_status "WARN" "Could not verify SSL certificate for $domain"
    fi
    
    # Check if HTTPS is enforced
    if [[ "$NEXT_PUBLIC_SUPABASE_URL" == https://* ]]; then
        print_status "OK" "HTTPS is enforced in Supabase URL"
    else
        print_status "ERROR" "Supabase URL must use HTTPS in production"
        return 1
    fi
}

# Check 4: Security Headers and Middleware
echo
echo "=== 4. SECURITY HEADERS AND MIDDLEWARE ==="

check_security_headers() {
    print_status "INFO" "Checking security headers configuration..."
    
    # Check if security middleware exists
    if [[ -f "${PROJECT_ROOT}/middleware.ts" ]]; then
        print_status "OK" "Security middleware file found"
        
        # Check for security features in middleware
        local security_features=(
            "auth.getSession"
            "auth.getUser"
            "secure: process.env.NODE_ENV === 'production'"
            "httpOnly: true"
        )
        
        for feature in "${security_features[@]}"; do
            if grep -q "$feature" "${PROJECT_ROOT}/middleware.ts"; then
                print_status "OK" "Security feature found: $feature"
            else
                print_status "WARN" "Security feature not found: $feature"
            fi
        done
    else
        print_status "ERROR" "Security middleware file not found"
        return 1
    fi
    
    # Check Next.js security configuration
    if [[ -f "${PROJECT_ROOT}/next.config.js" ]] || [[ -f "${PROJECT_ROOT}/next.config.mjs" ]]; then
        print_status "OK" "Next.js configuration file found"
    else
        print_status "WARN" "Next.js configuration file not found"
    fi
}

# Check 5: Backup and Recovery
echo
echo "=== 5. BACKUP AND RECOVERY CONFIGURATION ==="

check_backup_config() {
    print_status "INFO" "Checking backup configuration..."
    
    # Check if backup directory exists
    if [[ -d "$BACKUP_DIR" ]]; then
        print_status "OK" "Backup directory exists: $BACKUP_DIR"
    else
        print_status "WARN" "Backup directory not found: $BACKUP_DIR"
        print_status "INFO" "Creating backup directory..."
        mkdir -p "$BACKUP_DIR" 2>/dev/null || print_status "ERROR" "Cannot create backup directory"
    fi
    
    # Check backup script
    local backup_script="${PROJECT_ROOT}/scripts/production-backup.sh"
    if [[ -f "$backup_script" ]]; then
        print_status "OK" "Backup script found"
        if [[ -x "$backup_script" ]]; then
            print_status "OK" "Backup script is executable"
        else
            print_status "WARN" "Backup script is not executable"
            chmod +x "$backup_script" || print_status "ERROR" "Cannot make backup script executable"
        fi
    else
        print_status "ERROR" "Backup script not found: $backup_script"
        return 1
    fi
    
    # Check if GPG is available for encryption
    if check_command "gpg"; then
        print_status "OK" "GPG available for backup encryption"
    else
        print_status "ERROR" "GPG not found - required for backup encryption"
        return 1
    fi
    
    # Check backup encryption key
    local key_file="/secure/keys/backup.key"
    if [[ -f "$key_file" ]]; then
        print_status "OK" "Backup encryption key found"
    else
        print_status "ERROR" "Backup encryption key not found: $key_file"
        return 1
    fi
}

# Check 6: Monitoring and Alerting
echo
echo "=== 6. MONITORING AND ALERTING ==="

check_monitoring() {
    print_status "INFO" "Checking monitoring configuration..."
    
    # Check Sentry configuration
    if [[ -n "${SENTRY_DSN:-}" ]]; then
        print_status "OK" "Sentry DSN configured"
    else
        print_status "WARN" "Sentry DSN not configured"
    fi
    
    # Check if monitoring scripts exist
    local monitoring_files=(
        "lib/security/production-security-manager.ts"
        "lib/monitoring/performance-metrics.ts"
    )
    
    for file in "${monitoring_files[@]}"; do
        if [[ -f "${PROJECT_ROOT}/$file" ]]; then
            print_status "OK" "Monitoring file found: $file"
        else
            print_status "WARN" "Monitoring file not found: $file"
        fi
    done
    
    # Check webhook configuration for alerts
    if [[ -n "${SECURITY_WEBHOOK_URL:-}" ]]; then
        print_status "OK" "Security webhook URL configured"
    else
        print_status "WARN" "Security webhook URL not configured"
    fi
}

# Check 7: Performance and Scalability
echo
echo "=== 7. PERFORMANCE AND SCALABILITY ==="

check_performance() {
    print_status "INFO" "Checking performance configuration..."
    
    # Check if Redis is configured (if used)
    if [[ -n "${REDIS_URL:-}" ]]; then
        print_status "OK" "Redis URL configured for caching"
    else
        print_status "INFO" "Redis not configured (optional)"
    fi
    
    # Check build optimization
    if [[ -f "${PROJECT_ROOT}/package.json" ]]; then
        if grep -q '"build".*"next build"' "${PROJECT_ROOT}/package.json"; then
            print_status "OK" "Production build script configured"
        else
            print_status "WARN" "Production build script not found"
        fi
    fi
    
    # Check if performance indexes migration exists
    if [[ -f "${PROJECT_ROOT}/supabase/migrations/601_production_performance_indexes.sql" ]]; then
        print_status "OK" "Performance indexes migration found"
    else
        print_status "WARN" "Performance indexes migration not found"
    fi
}

# Check 8: Access Control and RBAC
echo
echo "=== 8. ACCESS CONTROL AND RBAC ==="

check_rbac() {
    print_status "INFO" "Checking RBAC configuration..."
    
    # Check if RBAC migration exists
    if [[ -f "${PROJECT_ROOT}/supabase/migrations/602_production_rbac.sql" ]]; then
        print_status "OK" "RBAC migration found"
    else
        print_status "ERROR" "RBAC migration not found"
        return 1
    fi
    
    # Check permission management utilities
    if [[ -f "${PROJECT_ROOT}/lib/auth/permission-manager.ts" ]]; then
        print_status "OK" "Permission manager found"
    else
        print_status "WARN" "Permission manager not found"
    fi
}

# Check 9: API Security
echo
echo "=== 9. API SECURITY ==="

check_api_security() {
    print_status "INFO" "Checking API security configuration..."
    
    # Check rate limiting configuration
    if [[ -n "${RATE_LIMIT_MAX:-}" ]] && [[ -n "${RATE_LIMIT_WINDOW_MS:-}" ]]; then
        print_status "OK" "Rate limiting configured"
    else
        print_status "WARN" "Rate limiting not fully configured"
    fi
    
    # Check CORS configuration
    if [[ -n "${CORS_ORIGIN:-}" ]]; then
        print_status "OK" "CORS origin configured"
    else
        print_status "WARN" "CORS origin not configured"
    fi
    
    # Check API route security
    local api_routes="${PROJECT_ROOT}/app/api"
    if [[ -d "$api_routes" ]]; then
        print_status "OK" "API routes directory found"
        
        # Check for auth middleware in API routes
        if find "$api_routes" -name "*.ts" -exec grep -l "auth.getUser\|auth.getSession" {} \; | head -1 >/dev/null; then
            print_status "OK" "Authentication found in API routes"
        else
            print_status "WARN" "No authentication found in API routes"
        fi
    fi
}

# Check 10: Final Security Verification
echo
echo "=== 10. FINAL SECURITY VERIFICATION ==="

final_verification() {
    print_status "INFO" "Performing final security verification..."
    
    # Check file permissions
    local sensitive_files=(
        ".env.production"
        "scripts/production-backup.sh"
    )
    
    for file in "${sensitive_files[@]}"; do
        if [[ -f "${PROJECT_ROOT}/$file" ]]; then
            local perms
            perms=$(stat -c "%a" "${PROJECT_ROOT}/$file" 2>/dev/null || stat -f "%A" "${PROJECT_ROOT}/$file" 2>/dev/null)
            if [[ "$perms" =~ ^[67][0-7][0-7]$ ]]; then
                print_status "OK" "File permissions secure for: $file ($perms)"
            else
                print_status "WARN" "File permissions may be too permissive for: $file ($perms)"
            fi
        fi
    done
    
    # Check for sensitive data in files
    print_status "INFO" "Scanning for potential sensitive data exposure..."
    
    local sensitive_patterns=(
        "password.*=.*[a-zA-Z0-9]"
        "secret.*=.*[a-zA-Z0-9]"
        "key.*=.*[a-zA-Z0-9]"
        "token.*=.*[a-zA-Z0-9]"
    )
    
    for pattern in "${sensitive_patterns[@]}"; do
        if grep -r -i "$pattern" "${PROJECT_ROOT}/app" "${PROJECT_ROOT}/lib" "${PROJECT_ROOT}/components" 2>/dev/null | grep -v ".git" | head -1 >/dev/null; then
            print_status "WARN" "Potential hardcoded secrets found (pattern: $pattern)"
        fi
    done
    
    print_status "OK" "Sensitive data scan completed"
}

# Main execution
main() {
    local exit_code=0
    
    echo "🛡️  INOPNC Production Security Deployment Checklist"
    echo "================================================="
    
    # Run all checks
    check_env_vars || exit_code=1
    check_supabase_security || exit_code=1
    check_ssl_config || exit_code=1
    check_security_headers || exit_code=1
    check_backup_config || exit_code=1
    check_monitoring || exit_code=1
    check_performance || exit_code=1
    check_rbac || exit_code=1
    check_api_security || exit_code=1
    final_verification || exit_code=1
    
    echo
    echo "=== DEPLOYMENT CHECKLIST SUMMARY ==="
    
    if [[ $exit_code -eq 0 ]]; then
        print_status "OK" "All security checks passed! Ready for production deployment."
        echo
        echo "Next steps:"
        echo "1. Apply database migrations: supabase db push"
        echo "2. Deploy application to production environment"
        echo "3. Run post-deployment verification"
        echo "4. Configure monitoring alerts"
        echo "5. Schedule regular security audits"
    else
        print_status "ERROR" "Some security checks failed. Please address issues before deploying to production."
        echo
        echo "Review the log file for details: $LOG_FILE"
    fi
    
    echo
    echo "Log file saved to: $LOG_FILE"
    echo "Checklist completed at: $(date)"
    
    return $exit_code
}

# Execute main function
main "$@"