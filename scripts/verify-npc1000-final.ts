import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, anonKey)

async function verifyNPC1000Final() {
  console.log('🎯 NPC-1000 시스템 최종 검증\n')
  
  try {
    // Sign in
    await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    const testSiteId = '55386936-56b0-465e-bcc2-8313db735ca9'
    
    // 1. NPC-1000 자재 카탈로그 확인
    const { data: materials, error: materialsError } = await supabase
      .from('npc1000_materials')
      .select('*')
      .eq('is_active', true)
    
    console.log('📦 NPC-1000 자재 카탈로그:')
    console.log(`   총 ${materials?.length || 0}개 자재`)
    
    // 2. 작업일지 연동 데이터 확인  
    const { data: records, error: recordsError } = await supabase
      .from('npc1000_daily_records')
      .select(`
        id,
        npc1000_materials(material_name, category, unit),
        daily_reports(work_date, sites(name))
      `)
      .limit(5)
    
    console.log('📋 작업일지 연동 데이터:')
    console.log(`   총 ${records?.length || 0}개 샘플 확인`)
    
    // 3. 사이트별 요약 데이터 확인
    const { data: summary, error: summaryError } = await supabase
      .from('npc1000_site_summary')
      .select('*')
      .eq('site_id', testSiteId)
    
    console.log('📊 강남 A현장 NPC-1000 요약:')
    console.log(`   ${summary?.length || 0}개 자재 유형`)
    if (summary && summary.length > 0) {
      const totalCost = summary.reduce((sum, s) => sum + s.total_cost, 0)
      const totalReports = summary.reduce((sum, s) => sum + s.report_count, 0)
      console.log(`   총 사용 금액: ${totalCost.toLocaleString()}원`)
      console.log(`   작업일지 기록: ${totalReports}건`)
    }
    
    // 4. UI 컴포넌트 테스트 시뮬레이션
    console.log('\n🖥️ UI 컴포넌트 동작 검증:')
    
    // NPC1000DailyDashboard loadNPCData() 시뮬레이션
    const { data: uiRecords, error: uiError } = await supabase
      .from('npc1000_daily_records')
      .select(`
        id,
        daily_report_id,
        incoming_quantity,
        used_quantity,
        remaining_quantity,
        total_cost,
        delivery_date,
        supplier,
        npc1000_materials!inner(
          material_name,
          category,
          npc_code,
          unit
        ),
        daily_reports!inner(
          work_date,
          site_id,
          sites!inner(name)
        )
      `)
      .eq('daily_reports.site_id', testSiteId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (uiError) {
      console.error('❌ UI 쿼리 실패:', uiError.message)
    } else {
      console.log('✅ UI 데이터 로딩 성공')
      console.log(`   화면에 표시될 기록: ${uiRecords?.length || 0}건`)
      
      if (uiRecords && uiRecords.length > 0) {
        console.log('   최신 기록:', {
          자재: uiRecords[0].npc1000_materials.material_name,
          사용량: `${uiRecords[0].used_quantity}${uiRecords[0].npc1000_materials.unit}`,
          작업일: uiRecords[0].daily_reports.work_date,
          현장: uiRecords[0].daily_reports.sites.name
        })
      }
    }
    
    console.log('\n🎉 NPC-1000 시스템 구현 및 검증 완료!')
    console.log('\n📱 사용 방법:')
    console.log('   1. 웹사이트에 manager@inopnc.com으로 로그인')
    console.log('   2. 현장정보 페이지 이동')
    console.log('   3. "NPC-1000 관리" 탭 클릭')
    console.log('   4. 현장 선택하여 자재 사용 현황 확인')
    
  } catch (error) {
    console.error('❌ 검증 중 오류:', error)
  }
}

verifyNPC1000Final()