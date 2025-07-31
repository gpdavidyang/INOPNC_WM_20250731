// Run migration manually using Supabase client
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  try {
    console.log('📂 Reading migration file...')
    const migrationSQL = fs.readFileSync('./supabase/migrations/107_fix_missing_tables.sql', 'utf8')
    
    console.log('🔧 Executing migration...')
    
    // Split the SQL into individual statements (rough approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n${i + 1}/${statements.length}: Executing statement...`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        }).catch(async () => {
          // Fallback: try direct execution for simple statements
          if (statement.toLowerCase().includes('create table')) {
            console.log('  Using direct table creation...')
            // This is a simplified approach - in production you'd want proper SQL parsing
            return { error: 'Direct execution not available' }
          }
          return { error: 'RPC not available' }
        })
        
        if (error) {
          console.log(`  ⚠️ Error: ${error.message || error}`)
        } else {
          console.log(`  ✅ Success`)
        }
      } catch (err) {
        console.log(`  ⚠️ Exception: ${err.message}`)
      }
    }
    
    console.log('\n🧪 Testing tables after migration...')
    
    // Test the tables we just created
    const tables = ['material_categories', 'materials', 'work_logs', 'work_log_materials']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`)
        } else {
          console.log(`✅ ${table}: exists and accessible`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`)
      }
    }
    
    // Test daily_reports notes column
    console.log('\n🧪 Testing daily_reports notes column...')
    try {
      const { error } = await supabase
        .from('daily_reports')
        .select('notes')
        .limit(1)
      
      if (error) {
        console.log('❌ daily_reports.notes column: not accessible')
      } else {
        console.log('✅ daily_reports.notes column: accessible')
      }
    } catch (err) {
      console.log(`❌ daily_reports.notes: ${err.message}`)
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  }
}

runMigration()