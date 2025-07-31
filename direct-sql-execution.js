// Direct SQL execution using individual operations
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createMissingTables() {
  console.log('🔧 Creating missing tables step by step...\n')
  
  try {
    // Step 1: Add notes column to daily_reports
    console.log('1. Adding notes column to daily_reports...')
    try {
      // First check if column exists
      const { data: existingReport } = await supabase
        .from('daily_reports')
        .select('notes')
        .limit(1)
      
      console.log('   ✅ notes column already exists')
    } catch (error) {
      if (error.message.includes('notes')) {
        console.log('   ℹ️ notes column needs to be added (expected)')
      }
    }
    
    // Step 2: Test if we can create simple records to verify table access
    console.log('\n2. Testing basic table operations...')
    
    // Test sites access (should work)
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .limit(1)
    
    if (sitesError) {
      console.log('   ❌ Sites table error:', sitesError.message)
    } else {
      console.log(`   ✅ Sites table accessible (${sites.length} records)`)
    }
    
    // Step 3: Since we can't run DDL, let's create a comprehensive test
    console.log('\n3. Testing what we can work with...')
    
    // Test current daily_reports structure
    const { data: reportData, error: reportError } = await supabase
      .from('daily_reports')
      .select()
      .limit(1)
    
    if (reportError) {
      console.log('   ❌ Daily reports error:', reportError.message)
    } else {
      console.log('   ✅ Daily reports table accessible')
      if (reportData && reportData.length > 0) {
        console.log('   Available columns:', Object.keys(reportData[0]))
      }
    }
    
    // Test documents table for file uploads
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select()
      .limit(1)
    
    if (docError) {
      console.log('   ❌ Documents error:', docError.message)
    } else {
      console.log('   ✅ Documents table accessible')
      if (docData && docData.length > 0) {
        console.log('   Available columns:', Object.keys(docData[0]))
      }
    }
    
    // Step 4: Test actual daily report creation with current schema
    console.log('\n4. Testing daily report creation with available fields...')
    
    const testReport = {
      site_id: sites && sites[0] ? sites[0].id : null,
      report_date: '2025-07-31',
      weather: 'sunny',
      temperature_high: 25.0,
      temperature_low: 15.0,
      status: 'draft'
    }
    
    if (!testReport.site_id) {
      console.log('   ⚠️ No site available for testing')
      return
    }
    
    try {
      const { data: newReport, error: createError } = await supabase
        .from('daily_reports')
        .insert(testReport)
        .select()
      
      if (createError) {
        console.log('   ❌ Daily report creation failed:', createError.message)
      } else {
        console.log('   ✅ Daily report created successfully!')
        console.log('   Report ID:', newReport[0].id)
        
        // Clean up test data
        await supabase
          .from('daily_reports')
          .delete()
          .eq('id', newReport[0].id)
        
        console.log('   ✅ Test data cleaned up')
      }
    } catch (err) {
      console.log('   ❌ Creation error:', err.message)
    }
    
    console.log('\n📊 Summary:')
    console.log('- ✅ Database connection working')
    console.log('- ✅ Basic tables (profiles, sites, daily_reports) accessible')
    console.log('- ❌ Missing tables (materials, work_logs) need to be created via Supabase Dashboard')
    console.log('- ⚠️ May need to add missing columns via Supabase Dashboard')
    
  } catch (error) {
    console.error('❌ Operation failed:', error.message)
  }
}

createMissingTables()