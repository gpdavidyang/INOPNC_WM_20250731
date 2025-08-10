import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, anonKey)

async function debugBrowserUIFlow() {
  console.log('🔍 브라우저 UI 흐름 디버깅\n')
  
  try {
    // 1. 로그인 (브라우저에서 하는 것과 동일)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (authError) {
      console.error('❌ 인증 실패:', authError.message)
      return
    }
    
    console.log('✅ 로그인 성공:', authData.user?.email)
    
    // 2. SiteInfoTabs 컴포넌트가 하는 것처럼 사이트 히스토리 가져오기
    console.log('\n📋 사이트 히스토리 조회 (SiteInfoTabs와 동일한 방식)...')
    
    // This simulates what would happen in SiteInfoTabs
    // Let's assume we get a site from history and convert it to selectedSite
    const mockSiteHistory = [
      {
        site_id: '55386936-56b0-465e-bcc2-8313db735ca9',
        site_name: '강남 A현장',
        site_address: '서울 강남구',
        site_status: 'active',
        assigned_date: '2025-01-01',
        unassigned_date: null,
        work_process: '콘크리트 타설',
        work_section: '지하 1층'
      }
    ]
    
    // SiteInfoTabs creates selectedSite like this:
    const selectedSite = {
      site_id: mockSiteHistory[0].site_id,
      site_name: mockSiteHistory[0].site_name,
      site_address: mockSiteHistory[0].site_address,
      site_status: mockSiteHistory[0].site_status,
      start_date: mockSiteHistory[0].assigned_date,
      end_date: mockSiteHistory[0].unassigned_date,
      accommodation_address: null,
      accommodation_name: null,
      work_process: mockSiteHistory[0].work_process,
      work_section: mockSiteHistory[0].work_section,
      component_name: null,
      manager_name: null,
      safety_manager_name: null,
      construction_manager_phone: null,
      safety_manager_phone: null
    }
    
    console.log('🏗️ SiteInfoTabs가 생성한 selectedSite:', selectedSite)
    
    // 3. MaterialManagementSimplified가 받는 props 시뮬레이션
    console.log('\n📦 MaterialManagementSimplified 전달 데이터:')
    console.log('   currentSite?.site_id:', selectedSite?.site_id)
    console.log('   currentSite?.site_name:', selectedSite?.site_name)
    
    // 4. NPC1000DailyDashboard가 받는 props
    const currentSiteId = selectedSite?.site_id
    const currentSiteName = selectedSite?.site_name
    
    console.log('\n📊 NPC1000DailyDashboard props:')
    console.log('   currentSiteId:', currentSiteId)
    console.log('   currentSiteName:', currentSiteName)
    console.log('   typeof currentSiteId:', typeof currentSiteId)
    
    if (!currentSiteId) {
      console.log('❌ currentSiteId가 없어서 컴포넌트에서 early return')
      return
    }
    
    // 5. 실제 쿼리 실행 (NPC1000DailyDashboard.loadNPCData()와 동일)
    console.log('\n🔄 NPC-1000 데이터 로딩 시뮬레이션...')
    
    // Records query
    const { data: recordsData, error: recordsError } = await supabase
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
          sites!inner(
            name
          )
        )
      `)
      .eq('daily_reports.site_id', currentSiteId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (recordsError) {
      console.error('❌ Records 쿼리 실패:', recordsError)
      console.error('   Error code:', recordsError.code)
      console.error('   Error message:', recordsError.message)
      console.error('   Error details:', recordsError.details)
      console.error('   Error hint:', recordsError.hint)
      return
    }
    
    console.log('✅ Records 쿼리 성공!')
    console.log('   찾은 레코드 수:', recordsData?.length || 0)
    
    // Site summary query
    const { data: summaryData, error: summaryError } = await supabase
      .from('npc1000_site_summary')
      .select('*')
      .eq('site_id', currentSiteId)
      .order('category, material_name')
    
    if (summaryError) {
      console.error('❌ Summary 쿼리 실패:', summaryError)
      return
    }
    
    console.log('✅ Summary 쿼리 성공!')
    console.log('   요약 데이터 수:', summaryData?.length || 0)
    
    // 6. 데이터 변환 (컴포넌트와 동일)
    const transformedRecords = recordsData?.map((record: any) => ({
      id: record.id,
      daily_report_id: record.daily_report_id,
      material_name: record.npc1000_materials.material_name,
      category: record.npc1000_materials.category,
      npc_code: record.npc1000_materials.npc_code,
      unit: record.npc1000_materials.unit,
      incoming_quantity: record.incoming_quantity,
      used_quantity: record.used_quantity,
      remaining_quantity: record.remaining_quantity,
      total_cost: record.total_cost,
      delivery_date: record.delivery_date,
      supplier: record.supplier,
      work_date: record.daily_reports.work_date,
      site_name: record.daily_reports.sites.name
    })) || []
    
    console.log('\n📋 데이터 변환 결과:')
    console.log('   변환된 레코드 수:', transformedRecords.length)
    if (transformedRecords.length > 0) {
      console.log('   샘플 데이터:', {
        material: transformedRecords[0].material_name,
        used: transformedRecords[0].used_quantity,
        date: transformedRecords[0].work_date,
        site: transformedRecords[0].site_name
      })
    }
    
    console.log('\n🎉 모든 단계 성공! UI에서 데이터가 정상적으로 표시되어야 합니다.')
    
  } catch (error) {
    console.error('💥 예상치 못한 오류:', error)
  }
}

debugBrowserUIFlow()