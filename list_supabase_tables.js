const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from .mcp.json
const SUPABASE_URL = 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listAllTables() {
  try {
    console.log('Connecting to Supabase...');
    console.log('URL:', SUPABASE_URL);
    console.log('');
    
    // Query to get all tables in the public schema
    const { data, error } = await supabase
      .rpc('get_tables_in_public_schema');
    
    if (error) {
      // If the RPC function doesn't exist, use a direct SQL query
      console.log('RPC function not found, using direct SQL query...');
      
      const { data: tables, error: sqlError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE')
        .order('table_name');
      
      if (sqlError) {
        // Try another approach using raw SQL
        console.log('Direct query failed, trying raw SQL...');
        
        const { data: rawData, error: rawError } = await supabase.rpc('sql', {
          query: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
          `
        });
        
        if (rawError) {
          console.error('Error fetching tables:', rawError);
          
          // Last resort: try to query known tables based on migrations
          console.log('\nAttempting to list tables based on common patterns...');
          const commonTables = [
            'users', 'profiles', 'projects', 'tasks', 'teams', 
            'documents', 'companies', 'sites', 'daily_records',
            'material_requests', 'attendance_sessions', 'material_shipments',
            'equipment_inspections', 'payroll_records', 'quick_menu_settings'
          ];
          
          console.log('\nChecking existence of common tables:');
          for (const tableName of commonTables) {
            try {
              const { count, error: checkError } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
              
              if (!checkError) {
                console.log(`✓ ${tableName} (exists)`);
              }
            } catch (e) {
              // Table doesn't exist
            }
          }
          return;
        }
        
        console.log('\nTables in public schema (using raw SQL):');
        console.log('================================');
        rawData.forEach((row, index) => {
          console.log(`${index + 1}. ${row.table_name}`);
        });
        console.log(`\nTotal tables: ${rawData.length}`);
        return;
      }
      
      console.log('\nTables in public schema:');
      console.log('================================');
      tables.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
      console.log(`\nTotal tables: ${tables.length}`);
      return;
    }
    
    console.log('\nTables in public schema:');
    console.log('================================');
    data.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    console.log(`\nTotal tables: ${data.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
listAllTables();