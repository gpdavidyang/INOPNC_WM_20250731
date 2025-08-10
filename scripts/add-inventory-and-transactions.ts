import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceKey)

async function addInventoryAndTransactions() {
  console.log('📊 자재 재고 및 거래이력 데이터 생성 시작\n')
  
  try {
    // Get existing materials
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
    
    if (materialsError) throw materialsError
    console.log(`✅ 기존 자재: ${materials?.length || 0}개`)
    
    // Get first 5 sites for inventory
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .limit(5)
    
    if (sitesError || !sites || sites.length === 0) {
      throw new Error('No sites found')
    }
    
    console.log('✅ 현장 목록:')
    sites.forEach(site => console.log(`   - ${site.name} (${site.id})`))
    
    // Get system admin user for created_by
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'system_admin')
      .limit(1)
    
    const createdBy = profiles?.[0]?.id
    if (!createdBy) {
      throw new Error('No system_admin user found for created_by field')
    }
    
    console.log(`✅ 생성자 ID: ${createdBy}`)

    // 1. Insert Inventory Data
    console.log('\n📦 1단계: 재고 데이터 생성')
    const inventoryData = []
    
    for (const site of sites) {
      console.log(`   🏗️ ${site.name} 현장 재고 생성...`)
      
      for (const material of materials!) {
        // 각 자재별로 현실적인 재고량 설정
        let currentStock = 0
        
        switch (material.unit) {
          case 'm³': // 콘크리트, 골재
            currentStock = Math.floor(Math.random() * 200) + 50  // 50-250m³
            break
          case 'ton': // 철근, 시멘트
            currentStock = Math.floor(Math.random() * 50) + 10   // 10-60ton
            break
          case 'sheet': // 합판
            currentStock = Math.floor(Math.random() * 500) + 100 // 100-600매
            break
          case 'm': // 각목
            currentStock = Math.floor(Math.random() * 2000) + 500 // 500-2500m
            break
          case 'm²': // 와이어메쉬
            currentStock = Math.floor(Math.random() * 1000) + 200 // 200-1200m²
            break
          default:
            currentStock = Math.floor(Math.random() * 100) + 20
        }
        
        inventoryData.push({
          site_id: site.id,
          material_id: material.id,
          current_stock: currentStock,
          reserved_stock: Math.floor(currentStock * 0.1) // 10% reserved
        })
      }
    }
    
    const { data: insertedInventory, error: inventoryInsertError } = await supabase
      .from('material_inventory')
      .insert(inventoryData)
      .select()
    
    if (inventoryInsertError) throw inventoryInsertError
    
    console.log(`✅ ${insertedInventory?.length || 0}개 재고 기록 삽입 완료`)

    // 2. Insert Transaction History
    console.log('\n📈 2단계: 자재 거래 이력 생성')
    
    const transactionData = []
    const transactionTypes = ['in', 'out', 'adjustment', 'transfer']
    const transactionNames = { 'in': '입고', 'out': '출고', 'adjustment': '재고조정', 'transfer': '이관' }
    
    // 각 현장별로 최근 30일간의 거래 이력 생성
    for (const site of sites) {
      console.log(`   🏗️ ${site.name} 현장 거래 이력...`)
      
      // 랜덤하게 일부 자재에 대해 거래 이력 생성
      const selectedMaterials = materials!
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(materials!.length * 0.6)) // 60% 자재만 선택
      
      for (let i = 0; i < 10; i++) { // 현장당 10개 거래 기록
        const material = selectedMaterials[Math.floor(Math.random() * selectedMaterials.length)]
        const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)]
        const daysAgo = Math.floor(Math.random() * 30)
        const transactionDate = new Date()
        transactionDate.setDate(transactionDate.getDate() - daysAgo)
        
        let quantity = 0
        switch (material.unit) {
          case 'm³':
            quantity = Math.floor(Math.random() * 50) + 10  // 10-60m³
            break
          case 'ton':
            quantity = Math.floor(Math.random() * 20) + 5   // 5-25ton
            break
          case 'sheet':
            quantity = Math.floor(Math.random() * 100) + 20 // 20-120매
            break
          case 'm':
            quantity = Math.floor(Math.random() * 500) + 100 // 100-600m
            break
          case 'm²':
            quantity = Math.floor(Math.random() * 200) + 50  // 50-250m²
            break
          default:
            quantity = Math.floor(Math.random() * 50) + 10
        }
        
        // 출고는 음수로 처리
        if (transactionType === 'out') {
          quantity = -quantity
        }
        
        transactionData.push({
          site_id: site.id,
          material_id: material.id,
          transaction_type: transactionType,
          quantity,
          unit_price: material.unit_price,
          total_price: Math.abs(quantity) * material.unit_price,
          transaction_date: transactionDate.toISOString().split('T')[0],
          notes: `${transactionNames[transactionType as keyof typeof transactionNames]} - ${material.name}`,
          created_by: createdBy
        })
      }
    }
    
    const { data: insertedTransactions, error: transactionInsertError } = await supabase
      .from('material_transactions')
      .insert(transactionData)
      .select()
    
    if (transactionInsertError) throw transactionInsertError
    
    console.log(`✅ ${insertedTransactions?.length || 0}개 거래 이력 삽입 완료`)

    // 3. Summary Report
    console.log('\n📋 삽입 완료 요약:')
    console.log(`   📦 기존 자재: ${materials?.length || 0}개`)
    console.log(`   📊 새 재고 기록: ${insertedInventory?.length || 0}개`)
    console.log(`   📈 새 거래 이력: ${insertedTransactions?.length || 0}개`)
    console.log(`   🏗️ 현장: ${sites.length}개`)
    
    console.log('\n🎉 NPC-1000 재고 및 거래 이력 생성 완료!')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

addInventoryAndTransactions()