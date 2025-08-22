#!/bin/bash

# Fix Authentication System Script
# This script applies the authentication system fix migration

echo "🔧 Starting authentication system fix..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed."
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "📁 Working directory: $PROJECT_ROOT"
echo ""

# Check if migration file exists
MIGRATION_FILE="supabase/migrations/102_fix_authentication_system.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "✅ Migration file found"
echo ""

# Apply the migration
echo "🚀 Applying migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📝 Summary of changes:"
    echo "  - Added organization_id and site_id columns to profiles table"
    echo "  - Created default organizations (INOPNC, Customer Corp)"
    echo "  - Created default site (Site 1)"
    echo "  - Updated handle_new_user() function"
    echo "  - Fixed existing user profiles with proper roles"
    echo "  - Implemented comprehensive RLS policies"
    echo "  - Added helper functions for role checking"
    echo "  - Created auth audit logging table"
    echo ""
    echo "👤 User configurations:"
    echo "  - admin@inopnc.com → admin role, INOPNC organization"
    echo "  - manager@inopnc.com → site_manager role, INOPNC organization, Site 1"
    echo "  - worker@inopnc.com → worker role, INOPNC organization, Site 1"
    echo "  - customer@inopnc.com → customer_manager role, Customer organization"
    echo "  - davidswyang@gmail.com → system_admin role, INOPNC organization"
    echo ""
    echo "🎉 Authentication system fix completed!"
else
    echo ""
    echo "❌ Error: Migration failed. Please check the error messages above."
    exit 1
fi