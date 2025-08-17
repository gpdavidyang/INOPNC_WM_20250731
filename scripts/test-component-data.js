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

async function testComponentData() {
  try {
    console.log('🔍 Testing data exactly as component would fetch it...');
    
    // Test the exact query the component uses
    const selectedSiteId = 'fb777dd6-fde2-4fe7-a83b-72605372d0c5'; // 송파 C현장 from logs
    
    console.log('Using site ID:', selectedSiteId);
    
    // Exact query from component
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('material_inventory')
      .select(`
        current_stock,
        reserved_stock,
        available_stock,
        last_updated,
        materials!inner(
          code,
          name,
          unit,
          unit_price
        )
      `)
      .eq('site_id', selectedSiteId)
      .like('materials.code', 'NPC-%');
    
    console.log('📊 Inventory Query Results:');
    console.log('Error:', inventoryError?.message || 'None');
    console.log('Data count:', inventoryData?.length || 0);
    
    if (inventoryData && inventoryData.length > 0) {
      console.log('Sample data:');
      inventoryData.slice(0, 3).forEach(item => {
        console.log(`  • ${item.materials?.code}: ${item.current_stock} stock, ${item.available_stock} available`);
      });
      
      // Calculate totals as component would
      const totalInventory = inventoryData.reduce((sum, item) => sum + (item.current_stock || 0), 0);
      console.log('Total inventory:', totalInventory);
    }
    
    // Also test transactions query
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
      .eq('site_id', selectedSiteId)
      .like('materials.code', 'NPC-%')
      .order('created_at', { ascending: false })
      .limit(100);
    
    console.log('📋 Transactions Query Results:');
    console.log('Error:', transactionsError?.message || 'None');
    console.log('Data count:', transactions?.length || 0);
    
    console.log('\n✅ Component data test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testComponentData();