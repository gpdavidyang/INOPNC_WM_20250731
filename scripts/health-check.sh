#!/bin/bash
# Health check script for Docker container
# Returns 0 for healthy, 1 for unhealthy

set -e

# Configuration
HEALTH_ENDPOINT="http://localhost:${PORT:-3000}/api/health"
TIMEOUT=10
MAX_RETRIES=3

# Function to check application health
check_health() {
    local attempt=$1
    
    # Make health check request
    if curl -f -s --max-time $TIMEOUT "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
        echo "✅ Health check passed (attempt $attempt)"
        return 0
    else
        echo "❌ Health check failed (attempt $attempt)"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    if [ -n "$DATABASE_URL" ]; then
        # Extract database connection details
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        
        if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
            if pg_isready -h "$DB_HOST" -p "$DB_PORT" -q; then
                echo "✅ Database connectivity check passed"
                return 0
            else
                echo "❌ Database connectivity check failed"
                return 1
            fi
        fi
    fi
    
    # Skip database check if no DATABASE_URL
    return 0
}

# Function to check memory usage
check_memory() {
    # Get memory usage percentage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    if [ "$MEMORY_USAGE" -lt 90 ]; then
        echo "✅ Memory usage check passed ($MEMORY_USAGE%)"
        return 0
    else
        echo "⚠️  High memory usage detected ($MEMORY_USAGE%)"
        return 1
    fi
}

# Function to check disk space
check_disk() {
    # Get disk usage percentage for /app
    DISK_USAGE=$(df /app | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -lt 90 ]; then
        echo "✅ Disk usage check passed ($DISK_USAGE%)"
        return 0
    else
        echo "⚠️  High disk usage detected ($DISK_USAGE%)"
        return 1
    fi
}

# Function to check process health
check_process() {
    # Check if Node.js process is running
    if pgrep -f "npm start\|node.*next" >/dev/null; then
        echo "✅ Application process check passed"
        return 0
    else
        echo "❌ Application process not found"
        return 1
    fi
}

# Main health check function
main() {
    local failed_checks=0
    local total_checks=0
    
    echo "🏥 Starting health check..."
    echo "Endpoint: $HEALTH_ENDPOINT"
    echo "Timeout: ${TIMEOUT}s"
    echo "Max retries: $MAX_RETRIES"
    echo "---"
    
    # Check application process
    total_checks=$((total_checks + 1))
    if ! check_process; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # Check application health endpoint with retries
    total_checks=$((total_checks + 1))
    health_check_passed=false
    
    for attempt in $(seq 1 $MAX_RETRIES); do
        if check_health $attempt; then
            health_check_passed=true
            break
        fi
        
        if [ $attempt -lt $MAX_RETRIES ]; then
            echo "⏳ Retrying in 2 seconds..."
            sleep 2
        fi
    done
    
    if [ "$health_check_passed" = false ]; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # Check database connectivity
    total_checks=$((total_checks + 1))
    if ! check_database; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # Check system resources
    total_checks=$((total_checks + 1))
    if ! check_memory; then
        failed_checks=$((failed_checks + 1))
    fi
    
    total_checks=$((total_checks + 1))
    if ! check_disk; then
        failed_checks=$((failed_checks + 1))
    fi
    
    # Summary
    echo "---"
    echo "Health check summary:"
    echo "Total checks: $total_checks"
    echo "Failed checks: $failed_checks"
    echo "Success rate: $(( (total_checks - failed_checks) * 100 / total_checks ))%"
    
    # Determine overall health status
    if [ $failed_checks -eq 0 ]; then
        echo "✅ Overall status: HEALTHY"
        exit 0
    elif [ $failed_checks -le 2 ]; then
        echo "⚠️  Overall status: DEGRADED"
        exit 0  # Still considered healthy for Docker
    else
        echo "❌ Overall status: UNHEALTHY"
        exit 1
    fi
}

# Execute main function
main "$@"