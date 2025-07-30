const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from .mcp.json
const SUPABASE_URL = 'https://yjtnpscnnsnvfsyvajku.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      // Get column information
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      let columns = [];
      if (!sampleError && sampleData && sampleData.length > 0) {
        columns = Object.keys(sampleData[0]);
      }
      
      return { exists: true, rowCount: count, columns };
    }
    return { exists: false };
  } catch (e) {
    return { exists: false };
  }
}

async function listAllTables() {
  console.log('===========================================');
  console.log('SUPABASE DATABASE TABLE INVENTORY');
  console.log('===========================================');
  console.log('URL:', SUPABASE_URL);
  console.log('Date:', new Date().toISOString());
  console.log('===========================================\n');

  // Comprehensive list of potential tables based on various sources
  const potentialTables = [
    // User and authentication related
    'users', 'profiles', 'sessions', 'auth_tokens', 'roles', 'permissions',
    
    // Project management
    'projects', 'tasks', 'teams', 'team_members', 'project_members',
    'project_settings', 'project_documents', 'project_phases',
    
    // Company and organization
    'companies', 'departments', 'positions', 'organizations',
    
    // Site and location management
    'sites', 'site_managers', 'site_documents', 'locations',
    
    // Work management
    'daily_records', 'work_reports', 'work_logs', 'timesheets',
    'attendance_records', 'attendance_sessions', 'work_orders',
    
    // Material and inventory
    'materials', 'material_requests', 'material_shipments', 
    'inventory', 'material_categories', 'material_stocks',
    
    // Equipment
    'equipment', 'equipment_inspections', 'equipment_maintenance',
    'equipment_categories', 'equipment_rentals',
    
    // Financial
    'payroll_records', 'invoices', 'payments', 'expenses',
    'budgets', 'cost_centers', 'purchase_orders',
    
    // Documents and files
    'documents', 'document_categories', 'files', 'attachments',
    'document_versions', 'document_storage',
    
    // Settings and configuration
    'settings', 'configurations', 'quick_menu_settings', 
    'user_preferences', 'system_settings',
    
    // Communication
    'messages', 'notifications', 'announcements', 'comments',
    
    // Audit and logs
    'audit_logs', 'activity_logs', 'change_logs', 'system_logs',
    
    // Other potential tables
    'vendors', 'contracts', 'schedules', 'calendars', 'events',
    'categories', 'tags', 'templates', 'workflows', 'approvals',
    'reports', 'dashboards', 'widgets', 'forms', 'surveys',
    
    // From PO Management system
    'items', 'item_categories', 'orders', 'order_items',
    'vendors', 'vendor_categories', 'receipts', 'shipments',
    
    // NPC1000 related
    'npc1000', 'npc1000_items', 'npc1000_inventory',
    
    // Drawing and markings
    'drawings', 'drawing_markings', 'drawing_versions',
    
    // Safety
    'safety_inspections', 'incidents', 'safety_reports',
    
    // Quality control
    'quality_inspections', 'quality_reports', 'defects',
    
    // Human resources
    'employees', 'employee_records', 'leave_requests',
    'training_records', 'certifications'
  ];

  const existingTables = [];
  const missingTables = [];

  console.log('Checking tables...\n');

  for (const tableName of potentialTables) {
    const result = await checkTable(tableName);
    if (result.exists) {
      existingTables.push({ name: tableName, ...result });
      console.log(`✓ ${tableName} (${result.rowCount || 0} rows)`);
      if (result.columns && result.columns.length > 0) {
        console.log(`  Columns: ${result.columns.join(', ')}`);
      }
    } else {
      missingTables.push(tableName);
    }
  }

  console.log('\n===========================================');
  console.log('SUMMARY');
  console.log('===========================================');
  console.log(`Total tables found: ${existingTables.length}`);
  console.log(`Tables checked: ${potentialTables.length}`);
  console.log('\n');

  console.log('EXISTING TABLES LIST:');
  console.log('-------------------');
  existingTables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name} (${table.rowCount || 0} rows)`);
  });

  console.log('\n===========================================');
  console.log('COMPLETE TABLE INVENTORY');
  console.log('===========================================');
  
  // Sort tables alphabetically
  existingTables.sort((a, b) => a.name.localeCompare(b.name));
  
  existingTables.forEach((table, index) => {
    console.log(`\n${index + 1}. TABLE: ${table.name}`);
    console.log(`   Rows: ${table.rowCount || 0}`);
    if (table.columns && table.columns.length > 0) {
      console.log(`   Columns (${table.columns.length}): ${table.columns.join(', ')}`);
    }
  });
}

// Run the function
listAllTables().catch(console.error);