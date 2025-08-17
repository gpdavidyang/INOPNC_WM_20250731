const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNPCDashboard() {
  try {
    console.log('🧪 Testing NPC-1000 Dashboard Data Flow...');
    
    const userSiteId = 'fb777dd6-fde2-4fe7-a83b-72605372d0c5'; // 송파 C현장
    
    // Test 1: Inventory Query (matches the Server Action)
    console.log('\n1️⃣ Testing inventory query...');
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
      .eq('site_id', userSiteId)
      .like('materials.code', 'NPC-%');
    
    console.log('Inventory results:', inventoryData?.length || 0);
    console.log('Inventory error:', inventoryError?.message || 'None');
    if (inventoryData && inventoryData.length > 0) {
      const totalStock = inventoryData.reduce((sum, item) => sum + (item.current_stock || 0), 0);
      console.log('Total current stock:', totalStock);
      console.log('Sample inventory:');
      inventoryData.slice(0, 2).forEach(item => {
        console.log(`  • ${item.materials?.code}: ${item.current_stock} current, ${item.available_stock} available`);
      });
    }
    
    // Test 2: Transactions Query (matches the Server Action)
    console.log('\n2️⃣ Testing transactions query...');
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
      .eq('site_id', userSiteId)
      .like('materials.code', 'NPC-%')
      .order('created_at', { ascending: false })
      .limit(100);
    
    console.log('Transactions results:', transactions?.length || 0);
    console.log('Transactions error:', transactionsError?.message || 'None');
    if (transactions && transactions.length > 0) {
      console.log('Sample transactions:');
      transactions.slice(0, 3).forEach(tx => {
        console.log(`  • ${tx.materials?.code}: ${tx.transaction_type} ${tx.quantity} on ${tx.created_at?.split('T')[0]}`);
      });
    }
    
    // Test 3: Daily Status Calculation (matches component logic)
    console.log('\n3️⃣ Testing daily status calculation...');
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    if (transactions && transactions.length > 0) {
      // Calculate today's transactions
      const todayTransactions = transactions.filter(t => 
        t.created_at && t.created_at.split('T')[0] === today
      );
      
      const todayIncoming = todayTransactions
        .filter(t => t.transaction_type === 'in')
        .reduce((sum, t) => sum + (t.quantity || 0), 0);
      
      const todayUsed = todayTransactions
        .filter(t => t.transaction_type === 'out')
        .reduce((sum, t) => sum + (t.quantity || 0), 0);
      
      console.log(`Today's activity: ${todayIncoming} incoming, ${todayUsed} used`);
      console.log(`Today's transactions count: ${todayTransactions.length}`);
    }
    
    // Test 4: Movement Table Data (matches component logic)
    console.log('\n4️⃣ Testing movement table data...');
    if (transactions && transactions.length > 0) {
      // Group transactions by date for movements table
      const movementsByDate = new Map();
      
      transactions.forEach(t => {
        if (!t.created_at) return;
        const date = t.created_at.split('T')[0];
        const existing = movementsByDate.get(date) || { incoming: 0, used: 0, inventory: 0 };
        
        if (t.transaction_type === 'in') {
          existing.incoming += t.quantity || 0;
        } else if (t.transaction_type === 'out') {
          existing.used += t.quantity || 0;
        }
        
        movementsByDate.set(date, existing);
      });
      
      const movementsData = Array.from(movementsByDate.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);
      
      console.log('Movement table data count:', movementsData.length);
      console.log('Sample movements:');
      movementsData.slice(0, 3).forEach(movement => {
        console.log(`  • ${movement.date}: ${movement.incoming} in, ${movement.used} out`);
      });
    }
    
    console.log('\n🎯 Dashboard Test Summary:');
    console.log(`✅ Inventory Records: ${inventoryData?.length || 0}`);
    console.log(`✅ Transaction Records: ${transactions?.length || 0}`);
    console.log(`✅ Data should be visible in NPC-1000 관리 tab!`);
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error);
  }
}

testNPCDashboard();