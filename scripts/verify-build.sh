#!/bin/bash

# INOPNC Work Management System - Build Verification Script
# Purpose: Automated build verification with zero-error enforcement and performance monitoring
# Usage: ./scripts/verify-build.sh [--fast] [--performance-only] [--ci]

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/.build-logs"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
LOG_FILE="${LOG_DIR}/build-verification-${TIMESTAMP}.log"
PERFORMANCE_LOG="${LOG_DIR}/build-performance.log"
BUILD_TIMEOUT=60  # 60 seconds build timeout
TARGET_BUILD_TIME=30  # Target: sub-30 second builds

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Parse command line arguments
FAST_MODE=false
PERFORMANCE_ONLY=false
CI_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --fast)
      FAST_MODE=true
      shift
      ;;
    --performance-only)
      PERFORMANCE_ONLY=true
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--fast] [--performance-only] [--ci]"
      exit 1
      ;;
  esac
done

# Create log directory
mkdir -p "${LOG_DIR}"

# Initialize log file
{
  echo "==================================================================="
  echo "INOPNC Work Management System - Build Verification"
  echo "==================================================================="
  echo "Timestamp: $(date)"
  echo "Node Version: $(node --version)"
  echo "NPM Version: $(npm --version)"
  echo "Fast Mode: ${FAST_MODE}"
  echo "Performance Only: ${PERFORMANCE_ONLY}"
  echo "CI Mode: ${CI_MODE}"
  echo "==================================================================="
  echo ""
} > "${LOG_FILE}"

# Logging functions
log() {
  echo "$@" | tee -a "${LOG_FILE}"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $@" | tee -a "${LOG_FILE}"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $@" | tee -a "${LOG_FILE}"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $@" | tee -a "${LOG_FILE}"
}

log_info() {
  echo -e "${BLUE}[INFO]${NC} $@" | tee -a "${LOG_FILE}"
}

log_header() {
  echo "" | tee -a "${LOG_FILE}"
  echo -e "${BOLD}=== $@ ===${NC}" | tee -a "${LOG_FILE}"
}

# Cleanup function
cleanup() {
  local exit_code=$?
  
  if [[ $exit_code -ne 0 ]]; then
    log_error "Build verification failed with exit code: $exit_code"
    log_error "See full logs at: ${LOG_FILE}"
    
    # Show last 20 lines of log on failure
    echo ""
    echo -e "${RED}Last 20 lines of build log:${NC}"
    echo "---"
    tail -20 "${LOG_FILE}"
    echo "---"
  fi
  
  exit $exit_code
}

trap cleanup EXIT

# Change to project root
cd "${PROJECT_ROOT}"

# Timeout command compatibility (macOS doesn't have timeout by default)
if ! command -v timeout >/dev/null 2>&1; then
  log_info "Creating timeout compatibility wrapper for macOS"
  timeout() {
    local duration=$1
    shift
    ("$@") &
    local pid=$!
    (sleep "$duration" && kill -9 "$pid" >/dev/null 2>&1) &
    local killer=$!
    wait "$pid"
    local exit_code=$?
    kill "$killer" >/dev/null 2>&1
    return $exit_code
  }
fi

# Performance tracking
start_time=$(date +%s.%N)

log_header "Build Verification Started"
log_info "Project Root: ${PROJECT_ROOT}"
log_info "Target Build Time: ${TARGET_BUILD_TIME} seconds"

# Pre-build checks
if [[ "${PERFORMANCE_ONLY}" != "true" ]]; then
  log_header "Pre-build Environment Checks"
  
  # Check Node.js version
  NODE_VERSION=$(node --version | sed 's/v//')
  REQUIRED_NODE_VERSION="18.0.0"
  
  if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js is not installed"
    exit 1
  fi
  
  log_success "Node.js version: ${NODE_VERSION}"
  
  # Check if node_modules exists
  if [[ ! -d "node_modules" ]]; then
    log_warning "node_modules not found, running npm install..."
    npm install >> "${LOG_FILE}" 2>&1 || {
      log_error "npm install failed"
      exit 1
    }
    log_success "Dependencies installed"
  fi
  
  # Check package.json scripts
  if ! jq -e '.scripts.build' package.json >/dev/null 2>&1; then
    log_error "No build script found in package.json"
    exit 1
  fi
  
  log_success "Pre-build checks completed"
fi

# Main build verification
if [[ "${PERFORMANCE_ONLY}" != "true" ]]; then
  log_header "TypeScript Type Checking"
  
  # Run TypeScript compiler check
  build_start=$(date +%s.%N)
  
  if [[ "${FAST_MODE}" == "true" ]]; then
    log_info "Fast mode: Skipping full type check"
  else
    log_info "Running TypeScript type check..."
    
    # Use timeout to prevent hanging builds
    if timeout ${BUILD_TIMEOUT} npx tsc --noEmit >> "${LOG_FILE}" 2>&1; then
      log_success "TypeScript type check passed"
    else
      log_error "TypeScript type check failed or timed out"
      exit 1
    fi
  fi
  
  log_header "ESLint Code Quality Check"
  
  log_info "Running ESLint checks..."
  if timeout 30 npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0 >> "${LOG_FILE}" 2>&1; then
    log_success "ESLint checks passed (0 warnings)"
  else
    log_error "ESLint checks failed or found warnings"
    # Don't exit on ESLint failures in fast mode, just warn
    if [[ "${FAST_MODE}" != "true" ]]; then
      exit 1
    else
      log_warning "Continuing in fast mode despite ESLint warnings"
    fi
  fi
fi

log_header "Next.js Production Build"

# Main build with performance monitoring
build_start=$(date +%s.%N)
log_info "Starting Next.js production build..."

# Set build environment variables
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Run the actual build with timeout
BUILD_OUTPUT=$(mktemp)
BUILD_ERROR=$(mktemp)

if timeout ${BUILD_TIMEOUT} npm run build > "${BUILD_OUTPUT}" 2> "${BUILD_ERROR}"; then
  build_end=$(date +%s.%N)
  build_duration=$(echo "${build_end} - ${build_start}" | bc -l)
  build_duration_int=$(echo "${build_duration}" | cut -d. -f1)
  
  # Log build output
  cat "${BUILD_OUTPUT}" >> "${LOG_FILE}"
  
  log_success "Next.js build completed successfully"
  
  # Performance analysis
  log_header "Build Performance Analysis"
  
  log_info "Build duration: ${build_duration}s"
  
  # Record performance metrics
  {
    echo "$(date -Iseconds),${build_duration},success,$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
  } >> "${PERFORMANCE_LOG}"
  
  if (( build_duration_int <= TARGET_BUILD_TIME )); then
    log_success "✓ Build completed within target time (${TARGET_BUILD_TIME}s)"
  elif (( build_duration_int <= 45 )); then
    log_warning "⚠ Build time acceptable but could be optimized (target: ${TARGET_BUILD_TIME}s)"
  else
    log_error "✗ Build time exceeds acceptable threshold (${build_duration_int}s > 45s)"
    if [[ "${CI_MODE}" == "true" ]]; then
      exit 1
    fi
  fi
  
  # Analyze build output for potential issues
  log_header "Build Output Analysis"
  
  # Check for warnings in build output
  WARNING_COUNT=$(grep -c "Warning:" "${BUILD_OUTPUT}" 2>/dev/null || echo "0")
  ERROR_COUNT=$(grep -c "Error:" "${BUILD_OUTPUT}" 2>/dev/null || echo "0")
  
  # Clean up any extra whitespace or newlines
  WARNING_COUNT=$(echo "${WARNING_COUNT}" | tr -d '\n' | tr -d ' ')
  ERROR_COUNT=$(echo "${ERROR_COUNT}" | tr -d '\n' | tr -d ' ')
  
  if [[ "${ERROR_COUNT}" -gt 0 ]]; then
    log_error "Build contains ${ERROR_COUNT} error(s)"
    exit 1
  elif [[ "${WARNING_COUNT}" -gt 0 ]]; then
    log_warning "Build contains ${WARNING_COUNT} warning(s)"
    # Show warnings
    grep "Warning:" "${BUILD_OUTPUT}" | head -5 >> "${LOG_FILE}"
  else
    log_success "Build output clean (no warnings or errors)"
  fi
  
  # Check build size if .next exists
  if [[ -d ".next" ]]; then
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "unknown")
    log_info "Build size: ${BUILD_SIZE}"
    
    # Check for potential size issues
    BUNDLE_ANALYSIS="${BUILD_OUTPUT}"
    if grep -q "Large page bundles" "${BUNDLE_ANALYSIS}"; then
      log_warning "Large page bundles detected - consider code splitting"
    fi
  fi
  
else
  build_end=$(date +%s.%N)
  build_duration=$(echo "${build_end} - ${build_start}" | bc -l)
  
  # Log both stdout and stderr
  cat "${BUILD_OUTPUT}" >> "${LOG_FILE}"
  cat "${BUILD_ERROR}" >> "${LOG_FILE}"
  
  log_error "Build failed after ${build_duration}s"
  
  # Record failed build
  {
    echo "$(date -Iseconds),${build_duration},failed,$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
  } >> "${PERFORMANCE_LOG}"
  
  # Analyze common failure patterns
  if grep -q "out of memory" "${BUILD_ERROR}"; then
    log_error "Build failed due to out of memory"
    log_info "Consider increasing Node.js memory: NODE_OPTIONS='--max-old-space-size=4096'"
  elif grep -q "timeout" "${BUILD_ERROR}" "${BUILD_OUTPUT}"; then
    log_error "Build timed out after ${BUILD_TIMEOUT} seconds"
  elif grep -q "ENOSPC" "${BUILD_ERROR}"; then
    log_error "Build failed due to insufficient disk space"
  fi
  
  exit 1
fi

# Cleanup temp files
rm -f "${BUILD_OUTPUT}" "${BUILD_ERROR}"

# Post-build verification
if [[ "${PERFORMANCE_ONLY}" != "true" ]]; then
  log_header "Post-build Verification"
  
  # Verify critical build artifacts exist
  REQUIRED_FILES=(
    ".next/BUILD_ID"
    ".next/build-manifest.json"
  )
  
  for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "${file}" ]]; then
      log_success "✓ ${file} exists"
    else
      log_error "✗ Missing required build artifact: ${file}"
      exit 1
    fi
  done
  
  # Check for critical pages
  CRITICAL_PAGES=(
    ".next/server/pages/index.js"
    ".next/server/pages/_app.js"
  )
  
  for page in "${CRITICAL_PAGES[@]}"; do
    if [[ -f "${page}" ]]; then
      log_success "✓ Critical page built: ${page}"
    else
      log_warning "⚠ Critical page may be missing: ${page}"
    fi
  done
fi

# Final summary
end_time=$(date +%s.%N)
total_duration=$(echo "${end_time} - ${start_time}" | bc -l)

log_header "Build Verification Summary"
log_success "✓ All build verification checks passed"
log_info "Total verification time: ${total_duration}s"
log_info "Build time: ${build_duration}s"
log_info "Log file: ${LOG_FILE}"

# Performance trend analysis (last 10 builds)
if [[ -f "${PERFORMANCE_LOG}" ]]; then
  log_header "Performance Trend Analysis"
  
  RECENT_BUILDS=$(tail -10 "${PERFORMANCE_LOG}" | grep "success" | wc -l)
  if [[ "${RECENT_BUILDS}" -gt 3 ]]; then
    AVG_BUILD_TIME=$(tail -10 "${PERFORMANCE_LOG}" | grep "success" | cut -d, -f2 | awk '{sum+=$1; count++} END {print sum/count}')
    log_info "Average build time (last ${RECENT_BUILDS} successful builds): ${AVG_BUILD_TIME}s"
    
    if (( $(echo "${AVG_BUILD_TIME} < ${TARGET_BUILD_TIME}" | bc -l) )); then
      log_success "✓ Average build time is within target"
    else
      log_warning "⚠ Average build time exceeds target (${TARGET_BUILD_TIME}s)"
    fi
  fi
fi

# CI-specific outputs
if [[ "${CI_MODE}" == "true" ]]; then
  log_header "CI Environment Outputs"
  
  # Export metrics for CI systems
  echo "BUILD_DURATION=${build_duration}" >> "${LOG_FILE}"
  echo "BUILD_STATUS=success" >> "${LOG_FILE}"
  echo "BUILD_SIZE=${BUILD_SIZE:-unknown}" >> "${LOG_FILE}"
  echo "WARNING_COUNT=${WARNING_COUNT:-0}" >> "${LOG_FILE}"
  
  log_info "CI metrics exported to log file"
fi

log_success "🎉 Build verification completed successfully!"

exit 0