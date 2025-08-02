#!/bin/bash
set -e

# Docker entrypoint script for production deployment
# Handles database migrations, health checks, and graceful startup

echo "🚀 Starting INOPNC Work Management System..."
echo "Build ID: ${BUILD_ID:-unknown}"
echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-3000}"

# Function to wait for database to be ready
wait_for_database() {
    echo "⏳ Waiting for database to be ready..."
    
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  DATABASE_URL not set, skipping database check"
        return 0
    fi
    
    # Extract database connection details
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    
    if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
        echo "⚠️  Could not parse database connection details"
        return 0
    fi
    
    # Wait for database to be ready (max 60 seconds)
    for i in {1..30}; do
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -q; then
            echo "✅ Database is ready"
            return 0
        fi
        echo "⏳ Database not ready, waiting... ($i/30)"
        sleep 2
    done
    
    echo "❌ Database failed to become ready within 60 seconds"
    exit 1
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Checking for database migrations..."
    
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  DATABASE_URL not set, skipping migrations"
        return 0
    fi
    
    # Check if there are pending migrations
    if npm run db:check-pending-migrations --silent; then
        echo "📝 Running database migrations..."
        if npm run db:migrate; then
            echo "✅ Database migrations completed successfully"
        else
            echo "❌ Database migrations failed"
            exit 1
        fi
    else
        echo "✅ No pending migrations"
    fi
}

# Function to validate environment variables
validate_environment() {
    echo "🔍 Validating environment variables..."
    
    # Required environment variables
    REQUIRED_VARS=(
        "NODE_ENV"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    # Optional but recommended for production
    RECOMMENDED_VARS=(
        "DATABASE_URL"
        "REDIS_URL"
        "SENTRY_DSN"
    )
    
    # Check required variables
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check recommended variables
    for var in "${RECOMMENDED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            echo "⚠️  Recommended environment variable $var is not set"
        fi
    done
    
    echo "✅ Environment validation completed"
}

# Function to setup logging
setup_logging() {
    echo "📝 Setting up logging..."
    
    # Create logs directory if it doesn't exist
    mkdir -p /app/logs
    
    # Set log file paths
    export LOG_FILE="/app/logs/application.log"
    export ERROR_LOG_FILE="/app/logs/error.log"
    export ACCESS_LOG_FILE="/app/logs/access.log"
    
    echo "✅ Logging configured"
}

# Function to setup monitoring
setup_monitoring() {
    echo "📊 Setting up monitoring..."
    
    # Initialize Sentry if DSN is provided
    if [ -n "$SENTRY_DSN" ]; then
        echo "✅ Sentry monitoring enabled"
    else
        echo "⚠️  Sentry DSN not provided, error monitoring disabled"
    fi
    
    # Setup health check endpoint
    echo "✅ Health check endpoint available at /api/health"
}

# Function to handle graceful shutdown
graceful_shutdown() {
    echo "📟 Received shutdown signal, gracefully shutting down..."
    
    # Kill the Node.js process
    if [ -n "$APP_PID" ]; then
        kill -TERM "$APP_PID"
        wait "$APP_PID"
    fi
    
    echo "✅ Graceful shutdown completed"
    exit 0
}

# Function to start the application
start_application() {
    echo "🚀 Starting Next.js application..."
    
    # Start the application in the background
    npm start &
    APP_PID=$!
    
    # Wait a moment for the app to start
    sleep 3
    
    # Check if the process is still running
    if kill -0 "$APP_PID" 2>/dev/null; then
        echo "✅ Application started successfully (PID: $APP_PID)"
    else
        echo "❌ Application failed to start"
        exit 1
    fi
    
    # Wait for the application to be ready
    echo "⏳ Waiting for application to be ready..."
    for i in {1..30}; do
        if curl -f http://localhost:${PORT:-3000}/api/health >/dev/null 2>&1; then
            echo "✅ Application is healthy and ready"
            break
        fi
        echo "⏳ Application not ready, waiting... ($i/30)"
        sleep 2
    done
    
    if [ $i -eq 30 ]; then
        echo "❌ Application failed to become healthy within 60 seconds"
        kill "$APP_PID" 2>/dev/null || true
        exit 1
    fi
}

# Setup signal handlers for graceful shutdown
trap graceful_shutdown SIGTERM SIGINT

# Main execution flow
main() {
    echo "================================================"
    echo "🏗️  INOPNC Work Management System Startup"
    echo "================================================"
    
    # Validate environment
    validate_environment
    
    # Setup logging and monitoring
    setup_logging
    setup_monitoring
    
    # Database operations
    wait_for_database
    run_migrations
    
    # Start the application
    start_application
    
    echo "================================================"
    echo "✅ Startup completed successfully!"
    echo "🌐 Application is running on port ${PORT:-3000}"
    echo "📊 Health check: http://localhost:${PORT:-3000}/api/health"
    echo "================================================"
    
    # Keep the script running and wait for the app process
    wait "$APP_PID"
}

# Execute main function
main "$@"