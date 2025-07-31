// Simple schema check
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function simpleCheck() {
  console.log('🔍 Checking database tables...\n')
  
  const tables = [
    'profiles',
    'sites', 
    'organizations',
    'daily_reports',
    'work_logs',
    'materials',
    'documents',
    'attendance_records',
    'material_categories'
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: exists (${data ? data.length : 0} sample records)`)
        if (data && data.length > 0) {
          const columns = Object.keys(data[0])
          console.log(`   Columns: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`)
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
  
  console.log('\n🧪 Testing a sample daily report creation...')
  
  try {
    // Test creating a daily report with current schema
    const testData = {
      site_id: 'test-site-id',
      work_date: '2025-07-30', // try work_date instead of report_date
      weather: 'sunny',
      temperature_high: 25.0,
      temperature_low: 15.0,
      notes: 'Test report'
    }
    
    const { data, error } = await supabase
      .from('daily_reports')
      .insert(testData)
      .select()
    
    if (error) {
      console.log('❌ Daily report creation test failed:', error.message)
      
      // Try with different column name
      const testData2 = { ...testData, report_date: testData.work_date }
      delete testData2.work_date
      
      const { data: data2, error: error2 } = await supabase
        .from('daily_reports')
        .insert(testData2)
        .select()
      
      if (error2) {
        console.log('❌ Alternative daily report creation also failed:', error2.message)
      } else {
        console.log('✅ Daily report created with report_date column')
        // Clean up test data
        if (data2 && data2[0]) {
          await supabase.from('daily_reports').delete().eq('id', data2[0].id)
        }
      }
    } else {
      console.log('✅ Daily report created successfully')
      // Clean up test data
      if (data && data[0]) {
        await supabase.from('daily_reports').delete().eq('id', data[0].id)
      }
    }
  } catch (err) {
    console.log('❌ Daily report test error:', err.message)
  }
}

simpleCheck()