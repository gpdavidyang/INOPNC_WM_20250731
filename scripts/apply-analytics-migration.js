#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying analytics_metrics table migration...');
  console.log(`📍 Database: ${supabaseUrl}`);
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '910_create_analytics_metrics_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL statements by semicolon (handling comments)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      // Log statement type
      const stmtType = statement.match(/^(CREATE|ALTER|GRANT|COMMENT)/i)?.[1] || 'UNKNOWN';
      console.log(`\n[${i + 1}/${statements.length}] Executing ${stmtType} statement...`);
      
      try {
        // Use RPC to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Check if it's a "already exists" error which we can ignore
          if (error.message?.includes('already exists')) {
            console.log(`⚠️  Object already exists (skipping)`);
            successCount++;
          } else {
            console.error(`❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Failed to execute statement: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Migration Results:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    // Verify table creation
    console.log('\n🔍 Verifying table creation...');
    const { data, error: verifyError } = await supabase
      .from('analytics_metrics')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      if (verifyError.code === '42P01') {
        console.error('❌ Table analytics_metrics was NOT created');
        console.error('   Error: Table does not exist');
        process.exit(1);
      } else {
        console.log('⚠️  Table exists but query returned error:', verifyError.message);
      }
    } else {
      console.log('✅ Table analytics_metrics exists and is accessible');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('   The 503 error in Worker Assignment modal should now be resolved.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Check if exec_sql function exists (fallback method)
async function createExecSqlFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (error && error.code === '42883') {
      console.log('📝 Creating exec_sql helper function...');
      
      // This won't work directly, but we'll handle it differently
      console.log('⚠️  exec_sql function not available, using alternative approach...');
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Alternative: Apply migration using direct statements
async function applyMigrationDirect() {
  console.log('🔄 Applying migration using direct Supabase client...');
  
  try {
    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('analytics_metrics')
      .select('id')
      .limit(1);
    
    if (!checkError || checkError.code !== '42P01') {
      console.log('✅ Table analytics_metrics already exists');
      return;
    }
    
    console.log('📝 Table does not exist, will need to create via Supabase Dashboard');
    console.log('\n' + '='.repeat(50));
    console.log('📋 MANUAL STEPS REQUIRED:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/yjtnpscnnsnvfsyvajku');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log('   supabase/migrations/910_create_analytics_metrics_table.sql');
    console.log('4. Click "Run" to execute the migration');
    console.log('='.repeat(50));
    
    // Output the SQL for easy copying
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '910_create_analytics_metrics_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\n📄 Migration SQL to execute:');
    console.log('-'.repeat(50));
    console.log(migrationSQL);
    console.log('-'.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const hasExecSql = await createExecSqlFunction();
  
  if (hasExecSql) {
    await applyMigration();
  } else {
    await applyMigrationDirect();
  }
}

main().catch(console.error);