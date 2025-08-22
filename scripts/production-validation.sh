#!/bin/bash

#
# Production Validation Script
# Comprehensive validation script for production deployments
#

set -euo pipefail

# Configuration
BASE_URL=${1:-"https://your-domain.com"}
TIMEOUT=${2:-30}
VALIDATION_TIMEOUT=${3:-300}  # 5 minutes total validation time

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

# Test result tracking
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Test execution wrapper
run_test() {
    local test_name="$1"
    local test_function="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    log "INFO" "Running test: $test_name"
    
    if $test_function; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log "SUCCESS" "✓ $test_name"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$test_name")
        log "ERROR" "✗ $test_name"
        return 1
    fi
}

# HTTP request helper
make_request() {
    local url="$1"
    local expected_status="${2:-200}"
    local method="${3:-GET}"
    local data="${4:-}"
    local headers="${5:-}"
    
    local curl_args=(-s -o /dev/null -w "%{http_code}:%{time_total}:%{size_download}" --max-time "$TIMEOUT")
    
    if [ "$method" != "GET" ]; then
        curl_args+=(-X "$method")
    fi
    
    if [ -n "$data" ]; then
        curl_args+=(-d "$data" -H "Content-Type: application/json")
    fi
    
    if [ -n "$headers" ]; then
        curl_args+=(-H "$headers")
    fi
    
    local response
    if response=$(curl "${curl_args[@]}" "$url" 2>/dev/null); then
        local http_code=$(echo "$response" | cut -d: -f1)
        local time_total=$(echo "$response" | cut -d: -f2)
        local size_download=$(echo "$response" | cut -d: -f3)
        
        if [ "$http_code" -eq "$expected_status" ]; then
            log "INFO" "  HTTP $http_code, ${time_total}s, ${size_download} bytes"
            return 0
        else
            log "ERROR" "  Expected HTTP $expected_status, got $http_code"
            return 1
        fi
    else
        log "ERROR" "  Request failed"
        return 1
    fi
}

# Basic connectivity tests
test_basic_connectivity() {
    make_request "$BASE_URL" 200
}

test_health_endpoint() {
    make_request "$BASE_URL/api/health" 200
}

test_readiness_endpoint() {
    make_request "$BASE_URL/api/health/ready" 200
}

# Authentication tests
test_login_page() {
    make_request "$BASE_URL/auth/login" 200
}

test_dashboard_redirect() {
    # Should redirect to login when not authenticated
    make_request "$BASE_URL/dashboard" 302
}

test_api_authentication() {
    # Should require authentication
    make_request "$BASE_URL/api/notifications" 401
}

# Security headers tests
test_security_headers() {
    local headers
    headers=$(curl -s -I --max-time "$TIMEOUT" "$BASE_URL" 2>/dev/null)
    
    local required_headers=(
        "X-Frame-Options"
        "X-Content-Type-Options" 
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Referrer-Policy"
    )
    
    local missing_headers=()
    
    for header in "${required_headers[@]}"; do
        if ! echo "$headers" | grep -qi "$header:"; then
            missing_headers+=("$header")
        fi
    done
    
    if [ ${#missing_headers[@]} -eq 0 ]; then
        log "INFO" "  All required security headers present"
        return 0
    else
        log "ERROR" "  Missing security headers: ${missing_headers[*]}"
        return 1
    fi
}

# SSL/TLS tests
test_ssl_certificate() {
    if [[ $BASE_URL == https://* ]]; then
        local domain=$(echo "$BASE_URL" | sed 's|https://||' | sed 's|/.*||')
        
        if command -v openssl &> /dev/null; then
            local ssl_info
            if ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
                log "INFO" "  SSL certificate is valid"
                return 0
            else
                log "ERROR" "  SSL certificate validation failed"
                return 1
            fi
        else
            log "WARN" "  openssl not available, skipping SSL test"
            return 0
        fi
    else
        log "INFO" "  Skipping SSL test for non-HTTPS URL"
        return 0
    fi
}

test_tls_version() {
    if [[ $BASE_URL == https://* ]]; then
        local domain=$(echo "$BASE_URL" | sed 's|https://||' | sed 's|/.*||')
        
        if command -v openssl &> /dev/null; then
            # Test TLS 1.2 support
            if echo | openssl s_client -tls1_2 -servername "$domain" -connect "$domain:443" &>/dev/null; then
                log "INFO" "  TLS 1.2 supported"
            else
                log "ERROR" "  TLS 1.2 not supported"
                return 1
            fi
            
            # Test TLS 1.3 support (optional)
            if echo | openssl s_client -tls1_3 -servername "$domain" -connect "$domain:443" &>/dev/null; then
                log "INFO" "  TLS 1.3 supported"
            else
                log "INFO" "  TLS 1.3 not supported (optional)"
            fi
            
            return 0
        else
            log "WARN" "  openssl not available, skipping TLS version test"
            return 0
        fi
    else
        log "INFO" "  Skipping TLS test for non-HTTPS URL"
        return 0
    fi
}

# Performance tests
test_response_time() {
    local response
    if response=$(curl -s -o /dev/null -w "%{time_total}" --max-time "$TIMEOUT" "$BASE_URL/api/health" 2>/dev/null); then
        local response_time_ms=$(echo "$response * 1000" | bc 2>/dev/null || echo "unknown")
        
        if (( $(echo "$response < 2.0" | bc -l 2>/dev/null || echo 1) )); then
            log "INFO" "  Response time: ${response_time_ms}ms (acceptable)"
            return 0
        else
            log "WARN" "  Response time: ${response_time_ms}ms (exceeds 2000ms)"
            return 1
        fi
    else
        log "ERROR" "  Failed to measure response time"
        return 1
    fi
}

test_concurrent_requests() {
    local concurrent_requests=10
    local temp_dir=$(mktemp -d)
    local success_count=0
    
    log "INFO" "  Testing $concurrent_requests concurrent requests..."
    
    # Launch concurrent requests
    for i in $(seq 1 $concurrent_requests); do
        (
            if curl -s -f --max-time "$TIMEOUT" "$BASE_URL/api/health" > "$temp_dir/response_$i" 2>/dev/null; then
                echo "success" > "$temp_dir/result_$i"
            else
                echo "failure" > "$temp_dir/result_$i"
            fi
        ) &
    done
    
    # Wait for all requests to complete
    wait
    
    # Count successful requests
    for i in $(seq 1 $concurrent_requests); do
        if [ -f "$temp_dir/result_$i" ] && [ "$(cat "$temp_dir/result_$i")" = "success" ]; then
            success_count=$((success_count + 1))
        fi
    done
    
    # Cleanup
    rm -rf "$temp_dir"
    
    local success_rate=$((success_count * 100 / concurrent_requests))
    
    if [ $success_count -eq $concurrent_requests ]; then
        log "INFO" "  Concurrent requests: $success_count/$concurrent_requests (100%)"
        return 0
    elif [ $success_rate -ge 90 ]; then
        log "WARN" "  Concurrent requests: $success_count/$concurrent_requests ($success_rate%)"
        return 0
    else
        log "ERROR" "  Concurrent requests: $success_count/$concurrent_requests ($success_rate%)"
        return 1
    fi
}

# Feature tests
test_static_assets() {
    # Test common static assets
    local static_assets=(
        "favicon.ico"
        "_next/static/css/"
        "_next/static/js/"
    )
    
    local failed_assets=()
    
    for asset in "${static_assets[@]}"; do
        local asset_url="$BASE_URL/$asset"
        if ! curl -s -f --max-time "$TIMEOUT" "$asset_url" > /dev/null 2>&1; then
            failed_assets+=("$asset")
        fi
    done
    
    if [ ${#failed_assets[@]} -eq 0 ]; then
        log "INFO" "  All static assets accessible"
        return 0
    else
        log "WARN" "  Some static assets failed: ${failed_assets[*]}"
        return 0  # Not critical for functionality
    fi
}

test_api_endpoints() {
    local api_endpoints=(
        "/api/health:200"
        "/api/health/ready:200"
        "/api/notifications:401"  # Should require auth
        "/api/daily-reports:401"  # Should require auth
        "/api/materials:401"      # Should require auth
    )
    
    local failed_endpoints=()
    
    for endpoint in "${api_endpoints[@]}"; do
        local url=$(echo "$endpoint" | cut -d: -f1)
        local expected_status=$(echo "$endpoint" | cut -d: -f2)
        
        if ! make_request "$BASE_URL$url" "$expected_status"; then
            failed_endpoints+=("$url")
        fi
    done
    
    if [ ${#failed_endpoints[@]} -eq 0 ]; then
        log "INFO" "  All API endpoints responding correctly"
        return 0
    else
        log "ERROR" "  Failed API endpoints: ${failed_endpoints[*]}"
        return 1
    fi
}

# Database connectivity test
test_database_connectivity() {
    make_request "$BASE_URL/api/health/database" 200
}

# Redis connectivity test
test_redis_connectivity() {
    make_request "$BASE_URL/api/health/redis" 200
}

# Feature flags test
test_feature_flags() {
    # Test that feature flags endpoint responds (even if unauthorized)
    make_request "$BASE_URL/api/feature-flags" 401
}

# Monitoring integration test
test_monitoring_endpoints() {
    # Test metrics endpoint if available
    local metrics_response
    if metrics_response=$(curl -s --max-time "$TIMEOUT" "$BASE_URL/api/metrics" 2>/dev/null); then
        if [ -n "$metrics_response" ]; then
            log "INFO" "  Metrics endpoint available"
        else
            log "WARN" "  Metrics endpoint empty"
        fi
    else
        log "INFO" "  Metrics endpoint not available (optional)"
    fi
    
    return 0  # Metrics are optional
}

# Run all validation tests
run_all_tests() {
    log "INFO" "Starting production validation tests..."
    log "INFO" "Target URL: $BASE_URL"
    log "INFO" "Request timeout: ${TIMEOUT}s"
    
    # Basic functionality tests
    run_test "Basic connectivity" test_basic_connectivity
    run_test "Health endpoint" test_health_endpoint
    run_test "Readiness endpoint" test_readiness_endpoint
    
    # Authentication tests
    run_test "Login page" test_login_page
    run_test "Dashboard redirect" test_dashboard_redirect
    run_test "API authentication" test_api_authentication
    
    # Security tests
    run_test "Security headers" test_security_headers
    run_test "SSL certificate" test_ssl_certificate
    run_test "TLS version support" test_tls_version
    
    # Performance tests
    run_test "Response time" test_response_time
    run_test "Concurrent requests" test_concurrent_requests
    
    # Feature tests
    run_test "Static assets" test_static_assets
    run_test "API endpoints" test_api_endpoints
    run_test "Database connectivity" test_database_connectivity
    run_test "Redis connectivity" test_redis_connectivity
    run_test "Feature flags" test_feature_flags
    run_test "Monitoring endpoints" test_monitoring_endpoints
}

# Generate test report
generate_report() {
    echo
    log "INFO" "=== PRODUCTION VALIDATION REPORT ==="
    log "INFO" "Total tests: $TESTS_TOTAL"
    log "INFO" "Passed: $TESTS_PASSED"
    log "INFO" "Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -gt 0 ]; then
        log "ERROR" "Failed tests:"
        for test in "${FAILED_TESTS[@]}"; do
            log "ERROR" "  - $test"
        done
    fi
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log "SUCCESS" "All validation tests passed! 🎉"
        log "SUCCESS" "Production deployment is healthy and ready for traffic"
        return 0
    elif [ $success_rate -ge 90 ]; then
        log "WARN" "Validation completed with warnings ($success_rate% success rate)"
        log "WARN" "Review failed tests but deployment may be acceptable"
        return 1
    else
        log "ERROR" "Validation failed ($success_rate% success rate)"
        log "ERROR" "Production deployment has critical issues"
        return 2
    fi
}

# Help function
show_help() {
    cat << EOF
Production Validation Script

Usage: $0 [BASE_URL] [TIMEOUT] [VALIDATION_TIMEOUT]

Arguments:
    BASE_URL            Target URL to validate [default: https://your-domain.com]
    TIMEOUT             Individual request timeout in seconds [default: 30]
    VALIDATION_TIMEOUT  Total validation timeout in seconds [default: 300]

Examples:
    $0                                              # Validate default production URL
    $0 https://your-domain.com                      # Validate specific URL
    $0 https://staging.your-domain.com 60 600       # Validate staging with custom timeouts

Validation Tests:
    - Basic connectivity and health checks
    - Authentication and authorization
    - Security headers and SSL/TLS
    - Performance and concurrent load
    - API endpoints and static assets
    - Database and Redis connectivity
    - Feature flags and monitoring

Exit Codes:
    0 - All tests passed
    1 - Some tests failed but deployment acceptable (≥90% success)
    2 - Critical failures detected

EOF
}

# Main execution
main() {
    local start_time
    start_time=$(date +%s)
    
    # Check dependencies
    if ! command -v curl &> /dev/null; then
        log "ERROR" "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        log "WARN" "bc is not installed, some calculations may not work"
    fi
    
    # Validate base URL
    if [[ ! $BASE_URL =~ ^https?:// ]]; then
        log "ERROR" "Invalid URL format: $BASE_URL"
        exit 1
    fi
    
    # Set timeout for entire validation
    if [ $VALIDATION_TIMEOUT -gt 0 ]; then
        (
            sleep $VALIDATION_TIMEOUT
            log "ERROR" "Validation timeout reached ($VALIDATION_TIMEOUT seconds)"
            exit 124
        ) &
        local timeout_pid=$!
    fi
    
    # Run all tests
    run_all_tests
    
    # Kill timeout process if still running
    if [ -n "${timeout_pid:-}" ]; then
        kill $timeout_pid 2>/dev/null || true
    fi
    
    # Generate report
    local exit_code
    generate_report
    exit_code=$?
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "INFO" "Validation completed in ${duration} seconds"
    
    exit $exit_code
}

# Handle command line arguments
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main