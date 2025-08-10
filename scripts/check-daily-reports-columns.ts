import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDailyReportsColumns() {
  console.log('📊 Checking daily_reports table structure...\n')
  
  try {
    // Try to get one record to see the structure
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error fetching data:', error)
      return
    }
    
    if (data && data.length > 0) {
      console.log('Available columns in daily_reports table:')
      Object.keys(data[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof data[0][col]} (${data[0][col] === null ? 'null' : 'has value'})`)
      })
    } else {
      console.log('No data found. Trying to insert minimal test record...')
      
      // Try minimal insert to see required columns
      const { data: testInsert, error: insertError } = await supabase
        .from('daily_reports')
        .insert({
          site_id: '55386936-56b0-465e-bcc2-8313db735ca9',
          work_date: new Date().toISOString().split('T')[0],
          created_by: '950db250-82e4-4c9d-bf4d-75df7244764c',
          status: 'draft'
        })
        .select()
      
      if (insertError) {
        console.error('Insert error:', insertError)
        console.log('\nThis error message may reveal required columns')
      } else {
        console.log('✅ Test insert successful!')
        console.log('Inserted record:', testInsert)
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkDailyReportsColumns()