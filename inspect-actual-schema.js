// Inspect actual database schema by trying different column names
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectSchema() {
  console.log('🔍 Inspecting actual database schema...\n')
  
  // List of possible column names to test for daily_reports
  const possibleColumns = [
    'id', 'site_id', 'created_at', 'updated_at',
    'report_date', 'work_date', 'date',
    'weather', 'temperature_high', 'temperature_low', 'temp_high', 'temp_low',
    'notes', 'description', 'comments',
    'status', 'created_by', 'updated_by', 'submitted_by', 'approved_by',
    'submitted_at', 'approved_at'
  ]
  
  console.log('📊 Testing daily_reports columns:')
  const validColumns = []
  
  for (const column of possibleColumns) {
    try {
      const { data, error } = await supabase
        .from('daily_reports')
        .select(column)
        .limit(1)
      
      if (!error) {
        validColumns.push(column)
        console.log(`   ✅ ${column}`)
      }
    } catch (err) {
      // Column doesn't exist
    }
  }
  
  console.log(`\n✅ Valid columns found: ${validColumns.join(', ')}`)
  
  // Now let's test creating a daily report with valid columns only
  console.log('\n🧪 Testing daily report creation with valid columns...')
  
  // Get a site ID for testing
  const { data: sites } = await supabase
    .from('sites')
    .select('id')
    .limit(1)
  
  if (!sites || sites.length === 0) {
    console.log('❌ No sites available for testing')
    return
  }
  
  // Create test data using only valid columns
  const testData = {}
  
  if (validColumns.includes('site_id')) testData.site_id = sites[0].id
  if (validColumns.includes('work_date')) testData.work_date = '2025-07-31'
  if (validColumns.includes('report_date')) testData.report_date = '2025-07-31'
  if (validColumns.includes('date')) testData.date = '2025-07-31'
  if (validColumns.includes('weather')) testData.weather = 'sunny'
  if (validColumns.includes('temperature_high')) testData.temperature_high = 25.0
  if (validColumns.includes('temp_high')) testData.temp_high = 25.0
  if (validColumns.includes('temperature_low')) testData.temperature_low = 15.0
  if (validColumns.includes('temp_low')) testData.temp_low = 15.0
  if (validColumns.includes('notes')) testData.notes = 'Test report'
  if (validColumns.includes('status')) testData.status = 'draft'
  
  console.log('Test data:', testData)
  
  try {
    const { data: newReport, error: createError } = await supabase
      .from('daily_reports')
      .insert(testData)
      .select()
    
    if (createError) {
      console.log('❌ Creation failed:', createError.message)
    } else {
      console.log('✅ Daily report created successfully!')
      console.log('Created report:', newReport[0])
      
      // Clean up
      await supabase
        .from('daily_reports')
        .delete()
        .eq('id', newReport[0].id)
      
      console.log('✅ Test data cleaned up')
    }
  } catch (err) {
    console.log('❌ Exception:', err.message)
  }
  
  // Test other important tables
  console.log('\n📊 Testing other tables...')
  
  const tables = ['profiles', 'sites', 'organizations', 'documents', 'attendance_records']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select()
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${data ? data.length : 0} records`)
        if (data && data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`)
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
}

inspectSchema()