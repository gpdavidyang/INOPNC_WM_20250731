// Discover all required fields in daily_reports table
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function discoverRequiredFields() {
  console.log('🔍 Discovering all required fields in daily_reports...\n')
  
  try {
    // Get a site for testing
    const { data: sites } = await supabase
      .from('sites')
      .select('id')
      .limit(1)
    
    if (!sites || sites.length === 0) {
      console.log('❌ No sites available')
      return
    }
    
    // Try to create a record with gradually increasing fields until it succeeds
    const baseFields = {
      site_id: sites[0].id,
      work_date: '2025-07-31',
      member_name: 'Test Member',
      status: 'draft'
    }
    
    console.log('Base fields:', baseFields)
    
    // Common field names to try
    const possibleFields = [
      'process_type',
      'work_section', 
      'work_type',
      'location',
      'description',
      'worker_count',
      'work_location',
      'construction_type',
      'member_type',
      'work_area',
      'equipment_used',
      'progress_rate'
    ]
    
    console.log('\n🧪 Testing which additional fields are required...')
    
    for (const field of possibleFields) {
      const testData = {
        ...baseFields,
        [field]: field === 'worker_count' ? 1 : `Test ${field}`
      }
      
      const { data, error } = await supabase
        .from('daily_reports')
        .insert(testData)
        .select()
      
      if (error) {
        if (error.message.includes('null value') && error.message.includes('not-null constraint')) {
          const missingField = error.message.match(/column "([^"]+)"/)?.[1]
          console.log(`   ❌ ${field}: Still missing "${missingField}"`)
        } else {
          console.log(`   ❌ ${field}: ${error.message}`)
        }
      } else {
        console.log(`   ✅ ${field}: SUCCESS! Record created`)
        console.log('   Created record:', data[0])
        
        // Get all fields from the successful record
        console.log('\n📊 All fields in successful record:')
        Object.keys(data[0]).forEach(key => {
          console.log(`   - ${key}: ${data[0][key]}`)
        })
        
        // Clean up
        await supabase
          .from('daily_reports')
          .delete()
          .eq('id', data[0].id)
        console.log('\n✅ Test data cleaned up')
        
        return // Success, we found the required fields
      }
    }
    
    // If we get here, we need to try combinations
    console.log('\n🔄 Trying combinations of fields...')
    
    const testCombination = {
      ...baseFields,
      process_type: 'Test Process',
      work_section: 'Test Section'
    }
    
    const { data: combo, error: comboError } = await supabase
      .from('daily_reports')
      .insert(testCombination)
      .select()
    
    if (comboError) {
      console.log('❌ Combination failed:', comboError.message)
    } else {
      console.log('✅ Combination succeeded!')
      console.log('Working combination:', testCombination)
      
      // Clean up
      await supabase
        .from('daily_reports')
        .delete()
        .eq('id', combo[0].id)
    }
    
  } catch (error) {
    console.error('❌ Discovery failed:', error.message)
  }
}

discoverRequiredFields()