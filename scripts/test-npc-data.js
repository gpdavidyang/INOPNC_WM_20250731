const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNPCData() {
  try {
    console.log('🔍 Testing NPC-1000 data accessibility...');
    
    // Test 1: Check materials
    console.log('\n1️⃣ Testing materials table...');
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .like('code', 'NPC-%');
    
    console.log('Materials result:', {
      count: materials?.length,
      error: materialsError?.message,
      sample: materials?.[0]
    });
    
    // Test 2: Check material inventory for first site
    console.log('\n2️⃣ Testing material_inventory table...');
    
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(1);
    
    console.log('Available sites:', sites);
    
    if (sites && sites.length > 0) {
      const testSiteId = sites[0].id;
      console.log('Testing with site ID:', testSiteId);
      
      const { data: inventory, error: inventoryError } = await supabase
        .from('material_inventory')
        .select(`
          current_stock,
          minimum_stock,
          maximum_stock,
          last_checked_at,
          materials!inner(
            code,
            name,
            unit,
            unit_price
          )
        `)
        .eq('site_id', testSiteId)
        .like('materials.code', 'NPC-%');
      
      console.log('Inventory result:', {
        count: inventory?.length,
        error: inventoryError?.message,
        sample: inventory?.[0]
      });
      
      // Test 3: Check material transactions
      console.log('\n3️⃣ Testing material_transactions table...');
      
      const { data: transactions, error: transactionsError } = await supabase
        .from('material_transactions')
        .select(`
          transaction_type,
          quantity,
          created_at,
          materials!inner(
            code,
            name
          )
        `)
        .eq('site_id', testSiteId)
        .like('materials.code', 'NPC-%')
        .limit(5);
      
      console.log('Transactions result:', {
        count: transactions?.length,
        error: transactionsError?.message,
        sample: transactions?.[0]
      });
    }
    
    // Test 4: Raw query to check table structures
    console.log('\n4️⃣ Testing raw table access...');
    
    const { data: rawMaterials, error: rawError } = await supabase
      .from('materials')
      .select('*')
      .limit(3);
    
    console.log('Raw materials sample:', {
      count: rawMaterials?.length,
      columns: rawMaterials?.[0] ? Object.keys(rawMaterials[0]) : [],
      error: rawError?.message
    });
    
    const { data: rawInventory, error: rawInvError } = await supabase
      .from('material_inventory')
      .select('*')
      .limit(3);
    
    console.log('Raw inventory sample:', {
      count: rawInventory?.length,
      columns: rawInventory?.[0] ? Object.keys(rawInventory[0]) : [],
      error: rawInvError?.message
    });
    
    console.log('\n✅ Data accessibility test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testNPCData();