// Database Connection Test Script
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Testing Database Connection...')
console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabaseConnection() {
  try {
    console.log('\n📊 Testing Tables...')
    
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(3)
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message)
    } else {
      console.log('✅ Profiles table:', profiles?.length || 0, 'records found')
    }

    // Test sites table
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, status')
      .limit(3)
    
    if (sitesError) {
      console.error('❌ Sites table error:', sitesError.message)
    } else {
      console.log('✅ Sites table:', sites?.length || 0, 'records found')
    }

    // Test daily_reports table
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('id, report_date, status')
      .limit(3)
    
    if (reportsError) {
      console.error('❌ Daily reports table error:', reportsError.message)
    } else {
      console.log('✅ Daily reports table:', reports?.length || 0, 'records found')
    }

    // Test materials table
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('id, name, unit')
      .limit(3)
    
    if (materialsError) {
      console.error('❌ Materials table error:', materialsError.message)
    } else {
      console.log('✅ Materials table:', materials?.length || 0, 'records found')
    }

    // Test documents table (for file uploads)
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, file_name, file_type')
      .limit(3)
    
    if (documentsError) {
      console.error('❌ Documents table error:', documentsError.message)
    } else {
      console.log('✅ Documents table:', documents?.length || 0, 'records found')
    }

    console.log('\n🗄️ Database connection test completed!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  }
}

testDatabaseConnection()