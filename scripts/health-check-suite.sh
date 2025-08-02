#!/bin/bash

#
# Health Check Suite
# Comprehensive health check script for INOPNC deployment validation
#

set -euo pipefail

# Configuration
ENVIRONMENT=${1:-staging}
TIMEOUT=${2:-30}
RETRY_COUNT=${3:-3}
RETRY_DELAY=${4:-5}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${BLUE}[INFO]${NC}  ${timestamp} - $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC}  ${timestamp} - $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} ${timestamp} - $message" ;;
    esac
}

# Health check function with retry
check_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    log "INFO" "Checking $description: $url"
    
    for i in $(seq 1 $RETRY_COUNT); do
        if response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null); then
            if [ "$response" -eq "$expected_status" ]; then
                log "SUCCESS" "$description - HTTP $response"
                return 0
            else
                log "WARN" "$description - HTTP $response (expected $expected_status), attempt $i/$RETRY_COUNT"
            fi
        else
            log "WARN" "$description - Connection failed, attempt $i/$RETRY_COUNT"
        fi
        
        if [ $i -lt $RETRY_COUNT ]; then
            sleep $RETRY_DELAY
        fi
    done
    
    log "ERROR" "$description - Failed after $RETRY_COUNT attempts"
    return 1
}

# Get base URL based on environment
get_base_url() {
    case $ENVIRONMENT in
        "production")
            echo "https://your-domain.com"
            ;;
        "staging")
            echo "https://staging.your-domain.com"
            ;;
        "local")
            echo "http://localhost:3000"
            ;;
        *)
            log "ERROR" "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Kubernetes health checks
check_kubernetes_health() {
    if ! command -v kubectl &> /dev/null; then
        log "WARN" "kubectl not found, skipping Kubernetes checks"
        return 0
    fi
    
    log "INFO" "Checking Kubernetes deployment health..."
    
    # Check if namespace exists
    if ! kubectl get namespace "$ENVIRONMENT" &> /dev/null; then
        log "ERROR" "Namespace '$ENVIRONMENT' does not exist"
        return 1
    fi
    
    # Check deployment status
    local deployment_name
    case $ENVIRONMENT in
        "production")
            # Check both blue and green deployments
            for env in blue green; do
                deployment_name="inopnc-$env"
                if kubectl get deployment "$deployment_name" -n "$ENVIRONMENT" &> /dev/null; then
                    local ready_replicas=$(kubectl get deployment "$deployment_name" -n "$ENVIRONMENT" -o jsonpath='{.status.readyReplicas}')
                    local desired_replicas=$(kubectl get deployment "$deployment_name" -n "$ENVIRONMENT" -o jsonpath='{.spec.replicas}')
                    
                    if [ "$ready_replicas" = "$desired_replicas" ] && [ "$ready_replicas" != "" ]; then
                        log "SUCCESS" "Deployment $deployment_name: $ready_replicas/$desired_replicas pods ready"
                    else
                        log "ERROR" "Deployment $deployment_name: $ready_replicas/$desired_replicas pods ready"
                        return 1
                    fi
                fi
            done
            ;;
        "staging")
            deployment_name="inopnc-staging"
            local ready_replicas=$(kubectl get deployment "$deployment_name" -n "$ENVIRONMENT" -o jsonpath='{.status.readyReplicas}')
            local desired_replicas=$(kubectl get deployment "$deployment_name" -n "$ENVIRONMENT" -o jsonpath='{.spec.replicas}')
            
            if [ "$ready_replicas" = "$desired_replicas" ] && [ "$ready_replicas" != "" ]; then
                log "SUCCESS" "Deployment $deployment_name: $ready_replicas/$desired_replicas pods ready"
            else
                log "ERROR" "Deployment $deployment_name: $ready_replicas/$desired_replicas pods ready"
                return 1
            fi
            ;;
    esac
    
    # Check service endpoints
    local service_name="inopnc-${ENVIRONMENT}"
    if kubectl get service "$service_name" -n "$ENVIRONMENT" &> /dev/null; then
        local endpoints=$(kubectl get endpoints "$service_name" -n "$ENVIRONMENT" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
        if [ "$endpoints" -gt 0 ]; then
            log "SUCCESS" "Service $service_name has $endpoints endpoints"
        else
            log "ERROR" "Service $service_name has no endpoints"
            return 1
        fi
    fi
    
    return 0
}

# Database connectivity check
check_database() {
    log "INFO" "Checking database connectivity..."
    
    # This would require database credentials to be available
    # For security, we'll check via the application health endpoint instead
    local base_url=$(get_base_url)
    check_endpoint "${base_url}/api/health/database" 200 "Database connectivity"
}

# Redis connectivity check  
check_redis() {
    log "INFO" "Checking Redis connectivity..."
    
    local base_url=$(get_base_url)
    check_endpoint "${base_url}/api/health/redis" 200 "Redis connectivity"
}

# API endpoints check
check_api_endpoints() {
    local base_url=$(get_base_url)
    
    log "INFO" "Checking API endpoints..."
    
    # Basic health check
    check_endpoint "${base_url}/api/health" 200 "Basic health check" || return 1
    
    # Readiness check
    check_endpoint "${base_url}/api/health/ready" 200 "Readiness check" || return 1
    
    # Authentication endpoint
    check_endpoint "${base_url}/auth/login" 200 "Authentication page" || return 1
    
    # Dashboard (should redirect to login if not authenticated)
    check_endpoint "${base_url}/dashboard" 302 "Dashboard redirect" || return 1
    
    # API endpoints (public)
    check_endpoint "${base_url}/api/notifications" 401 "Notifications API (unauthorized)" || return 1
    
    return 0
}

# SSL/TLS check
check_ssl() {
    local base_url=$(get_base_url)
    
    # Only check SSL for HTTPS URLs
    if [[ $base_url == https://* ]]; then
        log "INFO" "Checking SSL/TLS configuration..."
        
        local domain=$(echo "$base_url" | sed 's|https://||' | sed 's|/.*||')
        
        # Check SSL certificate
        if command -v openssl &> /dev/null; then
            local ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
            if [ $? -eq 0 ]; then
                log "SUCCESS" "SSL certificate is valid"
                
                # Check expiration
                local not_after=$(echo "$ssl_info" | grep "notAfter" | cut -d= -f2)
                local expiry_epoch=$(date -d "$not_after" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$not_after" +%s 2>/dev/null)
                local current_epoch=$(date +%s)
                local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
                
                if [ $days_until_expiry -gt 30 ]; then
                    log "SUCCESS" "SSL certificate expires in $days_until_expiry days"
                elif [ $days_until_expiry -gt 0 ]; then
                    log "WARN" "SSL certificate expires in $days_until_expiry days"
                else
                    log "ERROR" "SSL certificate has expired"
                    return 1
                fi
            else
                log "ERROR" "Failed to retrieve SSL certificate information"
                return 1
            fi
        else
            log "WARN" "openssl not found, skipping SSL certificate check"
        fi
    else
        log "INFO" "Skipping SSL check for non-HTTPS URL"
    fi
    
    return 0
}

# Performance check
check_performance() {
    local base_url=$(get_base_url)
    
    log "INFO" "Checking response performance..."
    
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "${base_url}/api/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        local response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "unknown")
        if (( $(echo "$response_time < 2.0" | bc -l 2>/dev/null || echo 1) )); then
            log "SUCCESS" "Response time: ${response_ms}ms"
        else
            log "WARN" "Response time: ${response_ms}ms (exceeds 2000ms threshold)"
        fi
    else
        log "ERROR" "Failed to measure response time"
        return 1
    fi
    
    return 0
}

# Feature flags check
check_feature_flags() {
    local base_url=$(get_base_url)
    
    log "INFO" "Checking feature flags..."
    
    # Check if feature flags endpoint is accessible
    check_endpoint "${base_url}/api/feature-flags" 401 "Feature flags API (unauthorized)" || return 1
    
    return 0
}

# Main execution
main() {
    log "INFO" "Starting health check suite for environment: $ENVIRONMENT"
    log "INFO" "Configuration: timeout=${TIMEOUT}s, retries=${RETRY_COUNT}, delay=${RETRY_DELAY}s"
    
    local failed_checks=0
    
    # Run all health checks
    check_kubernetes_health || ((failed_checks++))
    check_api_endpoints || ((failed_checks++))
    check_database || ((failed_checks++))
    check_redis || ((failed_checks++))
    check_ssl || ((failed_checks++))
    check_performance || ((failed_checks++))
    check_feature_flags || ((failed_checks++))
    
    # Summary
    log "INFO" "Health check suite completed"
    
    if [ $failed_checks -eq 0 ]; then
        log "SUCCESS" "All health checks passed! 🎉"
        exit 0
    else
        log "ERROR" "$failed_checks health check(s) failed ❌"
        exit 1
    fi
}

# Help function
show_help() {
    cat << EOF
Health Check Suite for INOPNC Deployment

Usage: $0 [ENVIRONMENT] [TIMEOUT] [RETRY_COUNT] [RETRY_DELAY]

Arguments:
    ENVIRONMENT   Target environment (production|staging|local) [default: staging]
    TIMEOUT       Request timeout in seconds [default: 30]
    RETRY_COUNT   Number of retries for failed checks [default: 3]
    RETRY_DELAY   Delay between retries in seconds [default: 5]

Examples:
    $0                          # Check staging with defaults
    $0 production               # Check production with defaults
    $0 production 60 5 10       # Check production with custom settings

Health Checks Performed:
    - Kubernetes deployment status
    - API endpoint availability
    - Database connectivity
    - Redis connectivity
    - SSL/TLS configuration
    - Response performance
    - Feature flags functionality

Exit Codes:
    0 - All checks passed
    1 - One or more checks failed

EOF
}

# Handle command line arguments
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    show_help
    exit 0
fi

# Check dependencies
if ! command -v curl &> /dev/null; then
    log "ERROR" "curl is required but not installed"
    exit 1
fi

if ! command -v bc &> /dev/null; then
    log "WARN" "bc is not installed, some performance calculations may not work"
fi

# Run main function
main