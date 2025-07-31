// Check actual database schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  try {
    console.log('🔍 Checking actual database schema...\n')
    
    // Check daily_reports table structure
    console.log('📋 Daily Reports table columns:')
    const { data: dailyReportsColumns, error: drError } = await supabase
      .rpc('get_table_columns', { table_name: 'daily_reports' })
      .catch(() => {
        // Fallback: try to select from the table to see what columns exist
        return supabase.from('daily_reports').select().limit(0)
      })
    
    if (drError) {
      console.log('Trying alternative method...')
      // Alternative: describe table by trying to select all columns
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('❌ Daily reports table error:', error.message)
      } else {
        console.log('✅ Daily reports table exists')
        if (data && data.length > 0) {
          console.log('Columns:', Object.keys(data[0]))
        }
      }
    }

    // Check materials table
    console.log('\n🧱 Materials table:')
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .limit(1)
    
    if (materialsError) {
      console.error('❌ Materials table error:', materialsError.message)
    } else {
      console.log('✅ Materials table exists')
      if (materials && materials.length > 0) {
        console.log('Columns:', Object.keys(materials[0]))
      }
    }

    // Check documents table
    console.log('\n📄 Documents table:')
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .limit(1)
    
    if (documentsError) {
      console.error('❌ Documents table error:', documentsError.message)
    } else {
      console.log('✅ Documents table exists')
      if (documents && documents.length > 0) {
        console.log('Columns:', Object.keys(documents[0]))
      }
    }

    // List all tables
    console.log('\n📊 All tables in database:')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    if (tablesError) {
      console.error('❌ Could not list tables:', tablesError.message)
    } else if (tables) {
      tables.forEach(table => console.log('  -', table.table_name))
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
  }
}

checkSchema()