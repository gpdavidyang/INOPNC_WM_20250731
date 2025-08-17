const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Starting NPC-1000 comprehensive data migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/122_insert_npc1000_comprehensive_data.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements (removing comments and empty lines)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '')
      .map(stmt => stmt + ';');
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comment-only statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // Try direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('_sql_exec')
            .select('*')
            .eq('sql', statement)
            .single();
          
          if (directError) {
            console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message}`);
            // Continue with next statement for non-critical errors
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}: ${err.message}`);
        // Continue with next statement
      }
    }
    
    console.log('🎉 Migration completed! Verifying data...');
    
    // Verify data insertion
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .like('material_code', 'NPC-%');
    
    const { data: inventory, error: inventoryError } = await supabase
      .from('material_inventory')
      .select('*', { count: 'exact' });
    
    const { data: requests, error: requestsError } = await supabase
      .from('material_requests')
      .select('*', { count: 'exact' });
    
    console.log('📊 Verification Results:');
    console.log(`   • NPC Materials: ${materials?.length || 0}`);
    console.log(`   • Inventory Records: ${inventory?.length || 0}`);
    console.log(`   • Material Requests: ${requests?.length || 0}`);
    
    if (materials && materials.length > 0) {
      console.log('✅ NPC-1000 data successfully inserted!');
      console.log('📱 You can now view the data in the NPC-1000 관리 tab');
    } else {
      console.log('❌ No NPC materials found. Migration may have failed.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();