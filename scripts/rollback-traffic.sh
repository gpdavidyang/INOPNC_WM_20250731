#!/bin/bash

#
# Traffic Rollback Script
# Quick rollback script for blue-green deployments
#

set -euo pipefail

# Configuration
NAMESPACE=${1:-production}
SERVICE_NAME=${2:-inopnc-prod}
TIMEOUT=${3:-30}

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

# Check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        log "ERROR" "kubectl is required but not installed"
        exit 1
    fi
    
    # Test cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log "ERROR" "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log "INFO" "kubectl connectivity verified"
}

# Get current active environment
get_current_environment() {
    local current_env
    current_env=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.selector.environment}' 2>/dev/null)
    
    if [ -z "$current_env" ]; then
        log "ERROR" "Could not determine current active environment for service $SERVICE_NAME"
        exit 1
    fi
    
    echo "$current_env"
}

# Get target environment (opposite of current)
get_target_environment() {
    local current_env=$1
    
    case $current_env in
        "blue")
            echo "green"
            ;;
        "green")
            echo "blue"
            ;;
        *)
            log "ERROR" "Unknown environment: $current_env. Expected 'blue' or 'green'"
            exit 1
            ;;
    esac
}

# Verify target environment is healthy
verify_target_health() {
    local target_env=$1
    local target_service="${SERVICE_NAME%-prod}-${target_env}-service"
    
    log "INFO" "Verifying health of target environment: $target_env"
    
    # Check if target deployment exists and is ready
    local deployment_name="inopnc-${target_env}"
    if ! kubectl get deployment "$deployment_name" -n "$NAMESPACE" &> /dev/null; then
        log "ERROR" "Target deployment $deployment_name does not exist"
        return 1
    fi
    
    # Check deployment status
    local ready_replicas
    ready_replicas=$(kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
    local desired_replicas
    desired_replicas=$(kubectl get deployment "$deployment_name" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
    
    if [ "$ready_replicas" != "$desired_replicas" ] || [ -z "$ready_replicas" ]; then
        log "ERROR" "Target deployment $deployment_name is not ready: $ready_replicas/$desired_replicas pods"
        return 1
    fi
    
    log "SUCCESS" "Target deployment $deployment_name is healthy: $ready_replicas/$desired_replicas pods ready"
    
    # Check if target service exists
    if ! kubectl get service "$target_service" -n "$NAMESPACE" &> /dev/null; then
        log "ERROR" "Target service $target_service does not exist"
        return 1
    fi
    
    # Check service endpoints
    local endpoints
    endpoints=$(kubectl get endpoints "$target_service" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)
    if [ "$endpoints" -eq 0 ]; then
        log "ERROR" "Target service $target_service has no healthy endpoints"
        return 1
    fi
    
    log "SUCCESS" "Target service $target_service has $endpoints healthy endpoints"
    
    # Optional: Perform health check against target environment
    local target_ip
    target_ip=$(kubectl get service "$target_service" -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}')
    
    if command -v curl &> /dev/null; then
        if curl -f -s --max-time 10 "http://${target_ip}/api/health" > /dev/null; then
            log "SUCCESS" "Target environment health check passed"
        else
            log "WARN" "Target environment health check failed, but continuing rollback"
        fi
    fi
    
    return 0
}

# Backup current configuration
backup_current_config() {
    local backup_file="/tmp/service-${SERVICE_NAME}-backup-$(date +%Y%m%d-%H%M%S).yaml"
    
    log "INFO" "Backing up current service configuration to $backup_file"
    
    if kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o yaml > "$backup_file"; then
        log "SUCCESS" "Service configuration backed up to $backup_file"
        echo "$backup_file"
    else
        log "ERROR" "Failed to backup service configuration"
        exit 1
    fi
}

# Switch traffic to target environment
switch_traffic() {
    local target_env=$1
    
    log "INFO" "Switching traffic to $target_env environment..."
    
    # Create patch for service selector
    local patch="{\"spec\":{\"selector\":{\"environment\":\"$target_env\"}}}"
    
    if kubectl patch service "$SERVICE_NAME" -n "$NAMESPACE" -p "$patch"; then
        log "SUCCESS" "Traffic switched to $target_env environment"
    else
        log "ERROR" "Failed to switch traffic to $target_env environment"
        return 1
    fi
    
    return 0
}

# Verify traffic switch
verify_traffic_switch() {
    local expected_env=$1
    
    log "INFO" "Verifying traffic switch to $expected_env..."
    
    # Wait a moment for changes to propagate
    sleep 5
    
    local actual_env
    actual_env=$(kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.selector.environment}')
    
    if [ "$actual_env" = "$expected_env" ]; then
        log "SUCCESS" "Traffic successfully switched to $expected_env environment"
        return 0
    else
        log "ERROR" "Traffic switch verification failed. Expected: $expected_env, Actual: $actual_env"
        return 1
    fi
}

# Send rollback notification
send_notification() {
    local original_env=$1
    local target_env=$2
    local reason=${3:-"Manual rollback initiated"}
    
    log "INFO" "Sending rollback notification..."
    
    # Check if notification script exists
    if [ -f "./scripts/deployment-notifications.js" ]; then
        if command -v node &> /dev/null; then
            node ./scripts/deployment-notifications.js \
                --status=rollback \
                --environment="$NAMESPACE" \
                --strategy=blue-green \
                --metadata="{\"from\":\"$original_env\",\"to\":\"$target_env\",\"reason\":\"$reason\"}" \
                &> /dev/null || log "WARN" "Failed to send deployment notification"
        else
            log "WARN" "Node.js not available, skipping deployment notification"
        fi
    else
        log "WARN" "Deployment notification script not found"
    fi
}

# Show current status
show_status() {
    log "INFO" "Current deployment status:"
    echo
    
    # Service information
    echo "Service Configuration:"
    kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" -o wide
    echo
    
    # Deployment status
    echo "Deployment Status:"
    kubectl get deployments -l app=inopnc -n "$NAMESPACE" -o wide
    echo
    
    # Pod status
    echo "Pod Status:"
    kubectl get pods -l app=inopnc -n "$NAMESPACE" -o wide
    echo
}

# Main rollback function
perform_rollback() {
    local reason=${1:-"Manual rollback"}
    
    log "INFO" "=== STARTING TRAFFIC ROLLBACK ==="
    log "INFO" "Namespace: $NAMESPACE"
    log "INFO" "Service: $SERVICE_NAME"
    log "INFO" "Reason: $reason"
    
    # Get current environment
    local current_env
    current_env=$(get_current_environment)
    log "INFO" "Current active environment: $current_env"
    
    # Get target environment
    local target_env
    target_env=$(get_target_environment "$current_env")
    log "INFO" "Target rollback environment: $target_env"
    
    # Verify target environment is healthy
    if ! verify_target_health "$target_env"; then
        log "ERROR" "Target environment is not healthy. Rollback aborted!"
        exit 1
    fi
    
    # Backup current configuration
    local backup_file
    backup_file=$(backup_current_config)
    
    # Switch traffic
    if switch_traffic "$target_env"; then
        # Verify the switch
        if verify_traffic_switch "$target_env"; then
            log "SUCCESS" "=== ROLLBACK COMPLETED SUCCESSFULLY ==="
            log "INFO" "Traffic rolled back from $current_env to $target_env"
            log "INFO" "Backup saved to: $backup_file"
            
            # Send notification
            send_notification "$current_env" "$target_env" "$reason"
            
            # Show final status
            show_status
            
            return 0
        else
            log "ERROR" "Traffic switch verification failed!"
            return 1
        fi
    else
        log "ERROR" "Failed to switch traffic!"
        return 1
    fi
}

# Help function
show_help() {
    cat << EOF
Traffic Rollback Script for Blue-Green Deployments

Usage: $0 [NAMESPACE] [SERVICE_NAME] [TIMEOUT] [REASON]

Arguments:
    NAMESPACE     Kubernetes namespace [default: production]
    SERVICE_NAME  Service name to rollback [default: inopnc-prod]
    TIMEOUT       Operation timeout in seconds [default: 30]
    REASON        Reason for rollback [default: "Manual rollback"]

Examples:
    $0                                    # Quick rollback with defaults
    $0 production inopnc-prod 60         # Custom timeout
    $0 staging inopnc-staging 30 "Bug found in new version"

Features:
    - Automatic environment detection (blue/green)
    - Health verification of target environment
    - Configuration backup before rollback
    - Traffic switch verification
    - Deployment notifications
    - Status reporting

Exit Codes:
    0 - Rollback successful
    1 - Rollback failed

EOF
}

# Interactive confirmation
confirm_rollback() {
    local current_env=$1
    local target_env=$2
    
    echo
    log "WARN" "You are about to rollback traffic from $current_env to $target_env environment"
    log "WARN" "This will affect all users immediately!"
    echo
    
    read -p "Are you sure you want to proceed? (yes/no): " -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "INFO" "Rollback cancelled by user"
        exit 0
    fi
}

# Parse command line arguments
REASON="Manual rollback"

case "${1:-}" in
    "-h"|"--help")
        show_help
        exit 0
        ;;
    "-y"|"--yes")
        # Skip confirmation
        SKIP_CONFIRMATION=true
        shift
        NAMESPACE=${1:-production}
        SERVICE_NAME=${2:-inopnc-prod}
        TIMEOUT=${3:-30}
        REASON=${4:-"Automated rollback"}
        ;;
    *)
        NAMESPACE=${1:-production}
        SERVICE_NAME=${2:-inopnc-prod}
        TIMEOUT=${3:-30}
        REASON=${4:-"Manual rollback"}
        ;;
esac

# Main execution
main() {
    # Check prerequisites
    check_kubectl
    
    # Get current state for confirmation
    local current_env
    current_env=$(get_current_environment)
    local target_env
    target_env=$(get_target_environment "$current_env")
    
    # Interactive confirmation (unless skipped)
    if [ "${SKIP_CONFIRMATION:-false}" != "true" ]; then
        confirm_rollback "$current_env" "$target_env"
    fi
    
    # Perform rollback
    if perform_rollback "$REASON"; then
        log "SUCCESS" "Rollback completed successfully! 🎉"
        exit 0
    else
        log "ERROR" "Rollback failed! ❌"
        log "ERROR" "Please check the logs and manual intervention may be required"
        exit 1
    fi
}

# Run main function
main