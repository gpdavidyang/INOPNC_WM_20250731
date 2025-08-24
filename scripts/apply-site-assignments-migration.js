const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Starting site_assignments enhancement migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/850_enhance_site_assignments_for_integration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements (by semicolon, but not within functions)
    const statements = [];
    let currentStatement = '';
    let inFunction = false;
    
    const lines = migrationSQL.split('\n');
    for (const line of lines) {
      // Check if we're entering or exiting a function definition
      if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE OR REPLACE VIEW')) {
        inFunction = true;
      }
      if (line.includes('$$;') || (line.includes(';') && line.includes('END') && inFunction)) {
        inFunction = false;
        currentStatement += line + '\n';
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else if (line.includes(';') && !inFunction && !line.trim().startsWith('--')) {
        currentStatement += line + '\n';
        statements.push(currentStatement.trim());
        currentStatement = '';
      } else {
        currentStatement += line + '\n';
      }
    }
    
    // Filter out empty statements and comments
    const validStatements = statements.filter(stmt => 
      stmt && !stmt.trim().startsWith('--') && stmt.trim().length > 5
    );
    
    console.log(`📝 Found ${validStatements.length} SQL statements to execute\n`);
    
    // Apply each statement separately
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i];
      const preview = statement.substring(0, 80).replace(/\n/g, ' ');
      
      console.log(`⏳ [${i + 1}/${validStatements.length}] Executing: ${preview}...`);
      
      try {
        // For DDL statements, we need to use raw SQL execution
        // Since Supabase doesn't have direct SQL execution, we'll use a workaround
        // We'll check what type of statement it is and handle accordingly
        
        if (statement.includes('ALTER TABLE') || 
            statement.includes('CREATE INDEX') || 
            statement.includes('CREATE POLICY') ||
            statement.includes('CREATE OR REPLACE VIEW') ||
            statement.includes('CREATE OR REPLACE FUNCTION') ||
            statement.includes('GRANT') ||
            statement.includes('COMMENT ON') ||
            statement.includes('DO $$')) {
          
          // These statements need to be run directly in the database
          // For now, we'll collect them for manual execution
          console.log(`   ⚠️  DDL statement - needs manual execution`);
          errors.push({
            statement: preview,
            error: 'DDL statement requires manual execution in Supabase Dashboard'
          });
          errorCount++;
        } else {
          // For DML statements, we can try using Supabase client
          successCount++;
          console.log(`   ✅ Statement prepared for execution`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors.push({ statement: preview, error: error.message });
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Analysis Complete');
    console.log('='.repeat(60));
    console.log(`✅ Statements ready: ${successCount}`);
    console.log(`⚠️  Statements needing manual execution: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  The following statements need to be executed manually in Supabase Dashboard:');
      console.log('   1. Go to your Supabase Dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the migration file content');
      console.log('   4. Execute the SQL\n');
    }
    
    // Generate a simplified migration file for manual execution
    const outputPath = path.join(__dirname, 'migration-to-apply.sql');
    fs.writeFileSync(outputPath, migrationSQL);
    console.log(`\n📄 Full migration saved to: ${outputPath}`);
    console.log('   You can copy this file content to Supabase SQL Editor\n');
    
    // Test if basic columns exist
    console.log('🔍 Checking current database state...\n');
    const { data: testData, error: testError } = await supabase
      .from('site_assignments')
      .select('*')
      .limit(1);
    
    if (!testError && testData) {
      const existingColumns = testData.length > 0 ? Object.keys(testData[0]) : [];
      console.log('Current site_assignments columns:', existingColumns.join(', '));
      
      const requiredColumns = ['assignment_type', 'notes', 'approved_by', 'approved_at'];
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('❌ Missing columns:', missingColumns.join(', '));
        console.log('\n📌 Next Steps:');
        console.log('1. Open Supabase Dashboard (https://app.supabase.com)');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Paste the migration content from migration-to-apply.sql');
        console.log('5. Click "Run" to execute the migration');
      } else {
        console.log('✅ All required columns exist!');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Check if environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables. Please set:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Run the migration
applyMigration();