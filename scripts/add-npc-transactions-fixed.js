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

async function addNPCTransactions() {
  try {
    console.log('📝 Adding NPC-1000 transaction history...');
    
    const userSiteId = 'fb777dd6-fde2-4fe7-a83b-72605372d0c5'; // 송파 C현장
    
    // Use system admin user ID for created_by
    const userId = 'b9341ed7-79fc-413d-a0fe-6e7fc7889f5f'; // admin@inopnc.com
    
    console.log('Using user ID:', userId);
    
    // Get NPC materials for this site
    const { data: npcMaterials } = await supabase
      .from('materials')
      .select('*')
      .like('code', 'NPC-%');
    
    console.log('Found NPC materials:', npcMaterials?.length || 0);
    
    if (!npcMaterials || npcMaterials.length === 0) {
      console.log('No NPC materials found');
      return;
    }
    
    // Create transactions for the last 7 days
    const transactions = [];
    const today = new Date();
    
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString();
      
      // Add some incoming transactions (deliveries)
      if (dayOffset === 6 || dayOffset === 3) { // 6 days ago and 3 days ago
        for (const material of npcMaterials.slice(0, 4)) { // Use first 4 materials
          const quantity = material.code === 'NPC-1000' ? 200 + Math.floor(Math.random() * 100) :
                          material.code === 'NPC-1000S' ? 100 + Math.floor(Math.random() * 50) :
                          material.code === 'NPC-CEMENT' ? 300 + Math.floor(Math.random() * 100) :
                          50 + Math.floor(Math.random() * 50);
          
          transactions.push({
            site_id: userSiteId,
            material_id: material.id,
            transaction_type: 'in',
            quantity: quantity,
            unit_price: material.unit_price || 1200,
            notes: `입고 - ${material.name}`,
            created_by: userId,
            created_at: dateStr,
            updated_at: dateStr
          });
        }
      }
      
      // Add some outgoing transactions (usage) for most days
      if (dayOffset < 6) {
        for (const material of npcMaterials.slice(0, 3)) { // Use first 3 materials
          const maxUsage = material.code === 'NPC-1000' ? 50 :
                          material.code === 'NPC-1000S' ? 30 :
                          material.code === 'NPC-CEMENT' ? 80 : 20;
          
          const quantity = Math.floor(Math.random() * maxUsage) + 5;
          
          transactions.push({
            site_id: userSiteId,
            material_id: material.id,
            transaction_type: 'out',
            quantity: quantity,
            unit_price: material.unit_price || 1200,
            notes: `사용 - ${material.name}`,
            created_by: userId,
            created_at: dateStr,
            updated_at: dateStr
          });
        }
      }
    }
    
    console.log(`📦 Creating ${transactions.length} transaction records...`);
    
    // Insert transactions in batches
    const batchSize = 50;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('material_transactions')
        .insert(batch);
      
      if (insertError) {
        console.error(`Batch ${Math.floor(i/batchSize) + 1} error:`, insertError.message);
      } else {
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transactions.length/batchSize)}`);
      }
    }
    
    // Verify the transactions
    console.log('\n🔍 Verifying transaction data...');
    
    const { data: verifyTransactions } = await supabase
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
      .limit(10);
    
    console.log('Recent transactions count:', verifyTransactions?.length || 0);
    if (verifyTransactions && verifyTransactions.length > 0) {
      console.log('Sample transactions:');
      verifyTransactions.slice(0, 3).forEach(tx => {
        console.log(`  • ${tx.materials?.code}: ${tx.transaction_type} ${tx.quantity} on ${tx.created_at?.split('T')[0]}`);
      });
      
      // Calculate total inventory movement
      const totalIn = verifyTransactions.filter(tx => tx.transaction_type === 'in').reduce((sum, tx) => sum + Number(tx.quantity), 0);
      const totalOut = verifyTransactions.filter(tx => tx.transaction_type === 'out').reduce((sum, tx) => sum + Number(tx.quantity), 0);
      console.log(`Total movements: ${totalIn} in, ${totalOut} out`);
    }
    
    console.log('\n🎉 Transaction creation completed!');
    console.log('📱 The NPC-1000 movements table should now show data!');
    
  } catch (error) {
    console.error('❌ Transaction creation failed:', error);
  }
}

addNPCTransactions();