#!/bin/bash

# Production Backup Script for INOPNC Work Management System
# Comprehensive backup solution with encryption, verification, and monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="/secure/backups/inopnc"
ENCRYPTION_KEY_FILE="/secure/keys/backup.key"
LOG_FILE="${BACKUP_ROOT}/backup.log"

# Backup retention settings
DAILY_RETENTION_DAYS=30
WEEKLY_RETENTION_WEEKS=12
MONTHLY_RETENTION_MONTHS=12

# Load environment variables
if [[ -f "${PROJECT_ROOT}/.env.production" ]]; then
    source "${PROJECT_ROOT}/.env.production"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${GREEN}SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${YELLOW}WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - ${BLUE}INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Cleanup function for error handling
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Backup failed with exit code: $exit_code"
        
        # Send failure notification
        send_notification "FAILURE" "Backup failed for INOPNC Production" "Exit code: $exit_code"
        
        # Clean up partial backup files
        if [[ -n "${BACKUP_DIR:-}" ]] && [[ -d "$BACKUP_DIR" ]]; then
            log_info "Cleaning up partial backup directory: $BACKUP_DIR"
            rm -rf "$BACKUP_DIR"
        fi
    fi
    
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Notification function
send_notification() {
    local status="$1"
    local title="$2"
    local message="$3"
    
    # Send webhook notification if configured
    if [[ -n "${BACKUP_WEBHOOK_URL:-}" ]]; then
        curl -s -X POST "$BACKUP_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"🔄 Backup Notification\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"title\": \"$title\",
                    \"text\": \"$message\",
                    \"footer\": \"INOPNC Backup System\",
                    \"ts\": \"$(date +%s)\"
                }]
            }" || log_warning "Failed to send webhook notification"
    fi
    
    # Send email notification if configured
    if [[ -n "${BACKUP_EMAIL_TO:-}" ]] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[$status] $title" "$BACKUP_EMAIL_TO" || log_warning "Failed to send email notification"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking backup prerequisites..."
    
    # Check required commands
    local required_commands=(
        "pg_dump"
        "gpg"
        "tar"
        "gzip"
        "supabase"
    )
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "Required command not found: $cmd"
            return 1
        fi
    done
    
    # Check backup directory
    if [[ ! -d "$BACKUP_ROOT" ]]; then
        log_info "Creating backup root directory: $BACKUP_ROOT"
        mkdir -p "$BACKUP_ROOT"
    fi
    
    # Check encryption key
    if [[ ! -f "$ENCRYPTION_KEY_FILE" ]]; then
        log_error "Encryption key file not found: $ENCRYPTION_KEY_FILE"
        return 1
    fi
    
    # Check database connection
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL environment variable not set"
        return 1
    fi
    
    # Test database connection
    if ! pg_dump --version >/dev/null 2>&1; then
        log_error "PostgreSQL client tools not available"
        return 1
    fi
    
    log_success "All prerequisites check passed"
}

# Create backup directory structure
setup_backup_directory() {
    local backup_type="$1"
    local timestamp="$2"
    
    BACKUP_DIR="${BACKUP_ROOT}/${backup_type}/${timestamp}"
    
    log_info "Setting up backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"/{database,storage,logs,metadata}
    
    echo "$BACKUP_DIR"
}

# Database backup
backup_database() {
    local backup_dir="$1"
    local timestamp="$2"
    
    log_info "Starting database backup..."
    
    local db_backup_file="${backup_dir}/database/inopnc_${timestamp}.sql"
    local db_backup_compressed="${db_backup_file}.gz"
    local db_backup_encrypted="${db_backup_compressed}.gpg"
    
    # Create database backup with custom format for better compression
    log_info "Creating database dump..."
    pg_dump "$DATABASE_URL" \
        --format=custom \
        --no-owner \
        --no-privileges \
        --verbose \
        --file="${db_backup_file}.dump" 2>&1 | tee -a "$LOG_FILE"
    
    # Also create SQL format for human readability
    pg_dump "$DATABASE_URL" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --verbose \
        --file="$db_backup_file" 2>&1 | tee -a "$LOG_FILE"
    
    # Compress the SQL backup
    log_info "Compressing database backup..."
    gzip -9 "$db_backup_file"
    
    # Encrypt the compressed backup
    log_info "Encrypting database backup..."
    gpg --symmetric \
        --cipher-algo AES256 \
        --compress-algo 2 \
        --s2k-count 65536 \
        --batch \
        --passphrase-file "$ENCRYPTION_KEY_FILE" \
        --output "$db_backup_encrypted" \
        "$db_backup_compressed"
    
    # Remove unencrypted file
    rm "$db_backup_compressed"
    
    # Store metadata
    cat > "${backup_dir}/metadata/database_info.json" <<EOF
{
    "backup_type": "database",
    "timestamp": "$timestamp",
    "database_url_host": "$(echo "$DATABASE_URL" | sed 's|.*@||' | sed 's|/.*||')",
    "dump_format": "custom",
    "compression": "gzip",
    "encryption": "AES256",
    "file_name": "$(basename "$db_backup_encrypted")",
    "file_size": $(stat -c%s "$db_backup_encrypted" 2>/dev/null || stat -f%z "$db_backup_encrypted"),
    "created_at": "$(date -Iseconds)"
}
EOF
    
    log_success "Database backup completed: $(basename "$db_backup_encrypted")"
}

# Storage backup (Supabase Storage)
backup_storage() {
    local backup_dir="$1"
    local timestamp="$2"
    
    log_info "Starting storage backup..."
    
    local storage_backup_dir="${backup_dir}/storage"
    local storage_archive="${storage_backup_dir}/storage_${timestamp}.tar.gz"
    local storage_encrypted="${storage_archive}.gpg"
    
    # Download all storage buckets
    log_info "Downloading storage buckets..."
    
    # Get list of buckets
    local buckets
    if buckets=$(supabase storage ls 2>/dev/null); then
        echo "$buckets" | while read -r bucket; do
            if [[ -n "$bucket" ]]; then
                log_info "Downloading bucket: $bucket"
                mkdir -p "${storage_backup_dir}/$bucket"
                supabase storage download \
                    --recursive \
                    "$bucket" \
                    "${storage_backup_dir}/$bucket/" 2>&1 | tee -a "$LOG_FILE" || log_warning "Failed to download bucket: $bucket"
            fi
        done
    else
        log_warning "Could not list storage buckets - Supabase CLI not configured or no buckets exist"
    fi
    
    # Create archive
    if [[ -d "$storage_backup_dir" ]] && [[ "$(ls -A "$storage_backup_dir")" ]]; then
        log_info "Creating storage archive..."
        tar -czf "$storage_archive" -C "$storage_backup_dir" . 2>&1 | tee -a "$LOG_FILE"
        
        # Encrypt the archive
        log_info "Encrypting storage backup..."
        gpg --symmetric \
            --cipher-algo AES256 \
            --compress-algo 2 \
            --s2k-count 65536 \
            --batch \
            --passphrase-file "$ENCRYPTION_KEY_FILE" \
            --output "$storage_encrypted" \
            "$storage_archive"
        
        # Remove unencrypted archive
        rm "$storage_archive"
        rm -rf "${storage_backup_dir:?}"/*
        
        # Store metadata
        cat > "${backup_dir}/metadata/storage_info.json" <<EOF
{
    "backup_type": "storage",
    "timestamp": "$timestamp",
    "compression": "tar.gz",
    "encryption": "AES256",
    "file_name": "$(basename "$storage_encrypted")",
    "file_size": $(stat -c%s "$storage_encrypted" 2>/dev/null || stat -f%z "$storage_encrypted"),
    "created_at": "$(date -Iseconds)"
}
EOF
        
        log_success "Storage backup completed: $(basename "$storage_encrypted")"
    else
        log_info "No storage files found to backup"
        echo '{"backup_type": "storage", "status": "no_data", "timestamp": "'$timestamp'"}' > "${backup_dir}/metadata/storage_info.json"
    fi
}

# Application backup (configuration, logs, etc.)
backup_application() {
    local backup_dir="$1"
    local timestamp="$2"
    
    log_info "Starting application backup..."
    
    local app_backup_dir="${backup_dir}/application"
    local app_archive="${app_backup_dir}/application_${timestamp}.tar.gz"
    local app_encrypted="${app_archive}.gpg"
    
    mkdir -p "$app_backup_dir"
    
    # Files to backup
    local files_to_backup=(
        ".env.production"
        "package.json"
        "package-lock.json"
        "next.config.js"
        "next.config.mjs"
        "tailwind.config.js"
        "middleware.ts"
        "supabase/migrations"
        "docs"
    )
    
    # Create temporary directory for app files
    local temp_app_dir="${app_backup_dir}/temp"
    mkdir -p "$temp_app_dir"
    
    # Copy application files
    for file in "${files_to_backup[@]}"; do
        if [[ -e "${PROJECT_ROOT}/$file" ]]; then
            log_info "Backing up: $file"
            cp -r "${PROJECT_ROOT}/$file" "$temp_app_dir/" 2>/dev/null || log_warning "Failed to backup: $file"
        fi
    done
    
    # Copy recent logs if they exist
    if [[ -d "${PROJECT_ROOT}/logs" ]]; then
        find "${PROJECT_ROOT}/logs" -type f -mtime -7 -exec cp {} "$temp_app_dir/" \; 2>/dev/null || true
    fi
    
    # Create archive
    if [[ "$(ls -A "$temp_app_dir")" ]]; then
        log_info "Creating application archive..."
        tar -czf "$app_archive" -C "$temp_app_dir" . 2>&1 | tee -a "$LOG_FILE"
        
        # Encrypt the archive
        log_info "Encrypting application backup..."
        gpg --symmetric \
            --cipher-algo AES256 \
            --compress-algo 2 \
            --s2k-count 65536 \
            --batch \
            --passphrase-file "$ENCRYPTION_KEY_FILE" \
            --output "$app_encrypted" \
            "$app_archive"
        
        # Remove unencrypted files
        rm "$app_archive"
        rm -rf "$temp_app_dir"
        
        # Store metadata
        cat > "${backup_dir}/metadata/application_info.json" <<EOF
{
    "backup_type": "application",
    "timestamp": "$timestamp",
    "compression": "tar.gz",
    "encryption": "AES256",
    "file_name": "$(basename "$app_encrypted")",
    "file_size": $(stat -c%s "$app_encrypted" 2>/dev/null || stat -f%z "$app_encrypted"),
    "created_at": "$(date -Iseconds)"
}
EOF
        
        log_success "Application backup completed: $(basename "$app_encrypted")"
    else
        log_warning "No application files found to backup"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_dir="$1"
    
    log_info "Verifying backup integrity..."
    
    local verification_log="${backup_dir}/metadata/verification.log"
    local verification_passed=true
    
    # Verify each encrypted file can be decrypted
    find "$backup_dir" -name "*.gpg" | while read -r encrypted_file; do
        log_info "Verifying: $(basename "$encrypted_file")"
        
        if gpg --decrypt \
            --batch \
            --passphrase-file "$ENCRYPTION_KEY_FILE" \
            "$encrypted_file" 2>/dev/null | head -10 >/dev/null; then
            echo "✅ $(basename "$encrypted_file"): PASS" >> "$verification_log"
        else
            echo "❌ $(basename "$encrypted_file"): FAIL" >> "$verification_log"
            verification_passed=false
        fi
    done
    
    # Test database backup restoration (partial)
    local db_dump_file
    db_dump_file=$(find "$backup_dir" -name "*inopnc_*.sql.dump")
    if [[ -n "$db_dump_file" ]]; then
        log_info "Testing database backup file structure..."
        if pg_restore --list "$db_dump_file" >/dev/null 2>&1; then
            echo "✅ Database backup structure: PASS" >> "$verification_log"
        else
            echo "❌ Database backup structure: FAIL" >> "$verification_log"
            verification_passed=false
        fi
    fi
    
    # Create verification summary
    cat > "${backup_dir}/metadata/verification_summary.json" <<EOF
{
    "verification_timestamp": "$(date -Iseconds)",
    "verification_passed": $verification_passed,
    "verification_log": "$(cat "$verification_log" | base64 -w 0)",
    "backup_size_total": $(du -sb "$backup_dir" | cut -f1),
    "file_count": $(find "$backup_dir" -type f | wc -l)
}
EOF
    
    if [[ "$verification_passed" == "true" ]]; then
        log_success "Backup verification passed"
    else
        log_error "Backup verification failed - check verification log"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."
    
    # Daily backups cleanup
    if [[ -d "${BACKUP_ROOT}/daily" ]]; then
        find "${BACKUP_ROOT}/daily" -type d -mtime +$DAILY_RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
        log_info "Cleaned up daily backups older than $DAILY_RETENTION_DAYS days"
    fi
    
    # Weekly backups cleanup
    if [[ -d "${BACKUP_ROOT}/weekly" ]]; then
        find "${BACKUP_ROOT}/weekly" -type d -mtime +$((WEEKLY_RETENTION_WEEKS * 7)) -exec rm -rf {} + 2>/dev/null || true
        log_info "Cleaned up weekly backups older than $WEEKLY_RETENTION_WEEKS weeks"
    fi
    
    # Monthly backups cleanup
    if [[ -d "${BACKUP_ROOT}/monthly" ]]; then
        find "${BACKUP_ROOT}/monthly" -type d -mtime +$((MONTHLY_RETENTION_MONTHS * 30)) -exec rm -rf {} + 2>/dev/null || true
        log_info "Cleaned up monthly backups older than $MONTHLY_RETENTION_MONTHS months"
    fi
    
    log_success "Backup cleanup completed"
}

# Generate backup report
generate_backup_report() {
    local backup_dir="$1"
    local backup_type="$2"
    local timestamp="$3"
    local start_time="$4"
    local end_time="$5"
    
    local duration=$((end_time - start_time))
    local total_size
    total_size=$(du -sh "$backup_dir" | cut -f1)
    
    cat > "${backup_dir}/metadata/backup_report.json" <<EOF
{
    "backup_summary": {
        "backup_type": "$backup_type",
        "timestamp": "$timestamp",
        "start_time": "$(date -d "@$start_time" -Iseconds)",
        "end_time": "$(date -d "@$end_time" -Iseconds)",
        "duration_seconds": $duration,
        "total_size": "$total_size",
        "status": "completed"
    },
    "components": {
        "database": $(cat "${backup_dir}/metadata/database_info.json" 2>/dev/null || echo 'null'),
        "storage": $(cat "${backup_dir}/metadata/storage_info.json" 2>/dev/null || echo 'null'),
        "application": $(cat "${backup_dir}/metadata/application_info.json" 2>/dev/null || echo 'null')
    },
    "verification": $(cat "${backup_dir}/metadata/verification_summary.json" 2>/dev/null || echo 'null')
}
EOF
    
    log_info "Backup report generated: ${backup_dir}/metadata/backup_report.json"
}

# Main backup function
perform_backup() {
    local backup_type="${1:-daily}"
    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    
    local start_time
    start_time=$(date +%s)
    
    log_info "Starting $backup_type backup at $timestamp"
    
    # Setup backup directory
    local backup_dir
    backup_dir=$(setup_backup_directory "$backup_type" "$timestamp")
    
    # Perform backup components
    backup_database "$backup_dir" "$timestamp"
    backup_storage "$backup_dir" "$timestamp"
    backup_application "$backup_dir" "$timestamp"
    
    # Verify backup
    verify_backup "$backup_dir"
    
    local end_time
    end_time=$(date +%s)
    
    # Generate report
    generate_backup_report "$backup_dir" "$backup_type" "$timestamp" "$start_time" "$end_time"
    
    log_success "$backup_type backup completed successfully in $((end_time - start_time)) seconds"
    log_success "Backup location: $backup_dir"
    
    # Send success notification
    send_notification "SUCCESS" "INOPNC $backup_type Backup Completed" "Duration: $((end_time - start_time))s, Size: $(du -sh "$backup_dir" | cut -f1)"
    
    # Cleanup old backups
    cleanup_old_backups
}

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS] [BACKUP_TYPE]"
    echo
    echo "BACKUP_TYPE:"
    echo "  daily    - Daily backup (default)"
    echo "  weekly   - Weekly backup"
    echo "  monthly  - Monthly backup"
    echo "  manual   - Manual backup"
    echo
    echo "OPTIONS:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verify   Verify existing backup"
    echo "  -c, --cleanup  Run cleanup only"
    echo "  -t, --test     Test backup configuration"
    echo
    echo "Examples:"
    echo "  $0                 # Run daily backup"
    echo "  $0 weekly          # Run weekly backup"
    echo "  $0 --verify daily/20240815_143022"
    echo "  $0 --cleanup       # Cleanup old backups only"
}

# Main script execution
main() {
    local backup_type="daily"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -v|--verify)
                if [[ -n "${2:-}" ]]; then
                    verify_backup "${BACKUP_ROOT}/$2"
                    exit 0
                else
                    log_error "Verify option requires backup path"
                    exit 1
                fi
                ;;
            -c|--cleanup)
                cleanup_old_backups
                exit 0
                ;;
            -t|--test)
                check_prerequisites
                log_success "Backup configuration test passed"
                exit 0
                ;;
            daily|weekly|monthly|manual)
                backup_type="$1"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
        shift
    done
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Start backup process
    log_info "INOPNC Production Backup Script Started"
    log_info "Backup type: $backup_type"
    log_info "PID: $$"
    
    # Check prerequisites
    check_prerequisites
    
    # Perform backup
    perform_backup "$backup_type"
    
    log_info "INOPNC Production Backup Script Completed"
}

# Run main function with all arguments
main "$@"