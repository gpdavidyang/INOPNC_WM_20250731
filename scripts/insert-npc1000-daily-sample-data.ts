import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceKey)

async function insertNPC1000DailySampleData() {
  console.log('🏗️ NPC-1000 작업일지 연동 샘플 데이터 생성 시작\n')
  
  try {
    // 1. Get available daily reports
    const { data: dailyReports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('id, work_date, site_id, created_by')
      .order('work_date', { ascending: false })
      .limit(20)
    
    if (reportsError) throw reportsError
    
    console.log(`✅ 작업일지: ${dailyReports?.length || 0}개 발견`)
    
    if (!dailyReports || dailyReports.length === 0) {
      console.log('⚠️ 작업일지가 없어서 샘플 데이터를 생성할 수 없습니다.')
      return
    }
    
    // 2. Get NPC-1000 materials
    const { data: npcMaterials, error: materialsError } = await supabase
      .from('npc1000_materials')
      .select('*')
      .eq('is_active', true)
    
    if (materialsError) throw materialsError
    
    console.log(`✅ NPC-1000 자재: ${npcMaterials?.length || 0}개`)
    
    // 3. Create sample NPC-1000 daily records
    console.log('\n📊 NPC-1000 작업일지 연동 데이터 생성...')
    
    const npcDailyRecords = []
    
    for (const report of dailyReports) {
      // For each daily report, randomly select 2-4 NPC-1000 materials
      const selectedMaterials = npcMaterials!
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 2) // 2-4 materials per report
      
      for (const material of selectedMaterials) {
        // Generate realistic quantities based on material type
        let incomingQty = 0
        let usedQty = 0
        let remainingQty = 0
        
        switch (material.unit) {
          case 'm³': // 콘크리트, 골재
            incomingQty = Math.floor(Math.random() * 20) + 5  // 5-25m³ 입고
            usedQty = Math.floor(incomingQty * (0.6 + Math.random() * 0.3)) // 60-90% 사용
            remainingQty = incomingQty - usedQty
            break
          case 'ton': // 철근, 시멘트  
            incomingQty = Math.floor(Math.random() * 5) + 1   // 1-6ton 입고
            usedQty = Math.floor(incomingQty * (0.7 + Math.random() * 0.2)) // 70-90% 사용
            remainingQty = incomingQty - usedQty
            break
          case 'sheet': // 합판
            incomingQty = Math.floor(Math.random() * 50) + 20 // 20-70매 입고
            usedQty = Math.floor(incomingQty * (0.8 + Math.random() * 0.15)) // 80-95% 사용
            remainingQty = incomingQty - usedQty
            break
          case 'm': // 각목
            incomingQty = Math.floor(Math.random() * 200) + 50 // 50-250m 입고
            usedQty = Math.floor(incomingQty * (0.75 + Math.random() * 0.2)) // 75-95% 사용
            remainingQty = incomingQty - usedQty
            break
          case 'm²': // 와이어메쉬
            incomingQty = Math.floor(Math.random() * 100) + 30 // 30-130m² 입고
            usedQty = Math.floor(incomingQty * (0.65 + Math.random() * 0.25)) // 65-90% 사용
            remainingQty = incomingQty - usedQty
            break
          default:
            incomingQty = Math.floor(Math.random() * 20) + 5
            usedQty = Math.floor(incomingQty * 0.8)
            remainingQty = incomingQty - usedQty
        }
        
        // Add some variation to simulate real usage
        const hasDelivery = Math.random() > 0.3 // 70% chance of delivery
        
        npcDailyRecords.push({
          daily_report_id: report.id,
          npc_material_id: material.id,
          incoming_quantity: hasDelivery ? incomingQty : 0,
          used_quantity: usedQty,
          remaining_quantity: remainingQty,
          unit_price: material.standard_price * (0.9 + Math.random() * 0.2), // ±10% price variation
          supplier: hasDelivery ? ['현대레미콘', '삼표레미콘', '포스코', '현대제철', '대한골재'][Math.floor(Math.random() * 5)] : null,
          delivery_date: hasDelivery ? report.work_date : null,
          notes: `${report.work_date} - ${material.material_name} 사용기록`,
          created_by: report.created_by
        })
      }
    }
    
    // 4. Insert the NPC-1000 daily records
    const { data: insertedRecords, error: insertError } = await supabase
      .from('npc1000_daily_records')
      .insert(npcDailyRecords)
      .select()
    
    if (insertError) throw insertError
    
    console.log(`✅ ${insertedRecords?.length || 0}개 NPC-1000 작업일지 연동 기록 생성 완료`)
    
    // 5. Summary by site
    console.log('\n📋 현장별 NPC-1000 사용 현황:')
    const { data: summary, error: summaryError } = await supabase
      .from('npc1000_site_summary')
      .select('*')
      .order('site_name, category, material_name')
    
    if (!summaryError && summary) {
      const siteGroups = summary.reduce((acc, record) => {
        if (!acc[record.site_name]) acc[record.site_name] = []
        acc[record.site_name].push(record)
        return acc
      }, {} as any)
      
      Object.entries(siteGroups).forEach(([siteName, records]: [string, any[]]) => {
        console.log(`\n  🏗️ ${siteName}:`)
        records.forEach(record => {
          console.log(`    - ${record.material_name}: 사용 ${record.total_used}${record.unit} (${record.report_count}회)`)
        })
      })
    }
    
    console.log('\n🎉 NPC-1000 작업일지 연동 샘플 데이터 생성 완료!')
    console.log('💡 이제 현장정보 → NPC-1000 관리 탭에서 데이터를 확인할 수 있습니다.')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

insertNPC1000DailySampleData()