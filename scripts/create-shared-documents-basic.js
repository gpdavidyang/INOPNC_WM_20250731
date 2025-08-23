#!/usr/bin/env node

/**
 * Create basic shared documents tables manually
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://yjtnpscnnsnvfsyvajku.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function createTables() {
  console.log('🚀 Creating shared documents tables...')

  try {
    // Create shared_documents table
    const createSharedDocsSQL = `
      CREATE TABLE IF NOT EXISTS shared_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100),
        site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
        uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
        category VARCHAR(100) DEFAULT 'general',
        tags TEXT[] DEFAULT '{}',
        is_secure BOOLEAN DEFAULT false,
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        version_number INTEGER DEFAULT 1,
        document_status VARCHAR(20) DEFAULT 'active' CHECK (document_status IN ('active', 'archived', 'draft')),
        download_count INTEGER DEFAULT 0,
        last_accessed_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `

    // Execute table creation using raw query through the REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createSharedDocsSQL
      })
    })

    if (response.ok) {
      console.log('✅ shared_documents table created successfully')
    } else {
      console.log('⚠️ Table might already exist or other issue')
    }

    // Create document_permissions table
    const createPermissionsSQL = `
      CREATE TABLE IF NOT EXISTS document_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES shared_documents(id) ON DELETE CASCADE,
        permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('user_specific', 'role_based', 'site_specific', 'organization_specific')),
        target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
        target_role VARCHAR(20),
        target_site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
        target_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        can_view BOOLEAN DEFAULT true,
        can_download BOOLEAN DEFAULT true,
        can_edit BOOLEAN DEFAULT false,
        can_delete BOOLEAN DEFAULT false,
        can_share BOOLEAN DEFAULT false,
        created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true
      );
    `

    const response2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST', 
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: createPermissionsSQL
      })
    })

    if (response2.ok) {
      console.log('✅ document_permissions table created successfully')
    }

    // Test table creation by inserting a simple record
    const { data: testData, error: testError } = await supabase
      .from('shared_documents')
      .insert({
        title: 'Test Document',
        file_url: 'https://example.com/test.pdf',
        file_name: 'test.pdf',
        file_type: 'pdf',
        file_size: 1024,
        uploaded_by: 'fd6871a5-7460-4260-aafd-c7a87ea46785' // admin user id
      })
      .select()

    if (testError) {
      console.error('❌ Test insert failed:', testError.message)
    } else {
      console.log('✅ Test insert successful:', testData)
      
      // Clean up test record
      await supabase
        .from('shared_documents')
        .delete()
        .eq('title', 'Test Document')
    }

    console.log('🎉 Basic shared documents system is ready!')

  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
  }
}

createTables()