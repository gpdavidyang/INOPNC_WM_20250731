import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, anonKey)

async function testNPCQuery() {
  console.log('🔍 NPC-1000 데이터 쿼리 테스트\n')
  
  // Sign in as manager
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'manager@inopnc.com',
    password: 'password123'
  })
  
  if (authError) {
    console.error('❌ 로그인 실패:', authError.message)
    return
  }
  
  console.log('✅ 로그인 성공:', authData.user?.email)
  console.log('User ID:', authData.user?.id)
  
  // Get user's current site
  const { data: currentSite, error: siteError } = await supabase
    .from('user_current_sites')
    .select('site_id, site_name')
    .eq('user_id', authData.user?.id)
    .single()
  
  let testSiteId: string
  let testSiteName: string
  
  if (siteError) {
    console.log('⚠️ 현재 사이트 없음:', siteError.message)
    console.log('📋 사용 가능한 사이트 조회 중...')
    
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3)
    
    if (!sitesError && sites && sites.length > 0) {
      console.log('📍 사용 가능한 사이트:', sites.map(s => `${s.name} (${s.id})`))
      testSiteId = sites[0].id
      testSiteName = sites[0].name
    } else {
      console.error('❌ 사용 가능한 사이트가 없습니다')
      return
    }
  } else {
    console.log('✅ 현재 사이트:', currentSite.site_name, '(', currentSite.site_id, ')')
    testSiteId = currentSite.site_id
    testSiteName = currentSite.site_name
  }
  
  console.log(`\n🧪 테스트 사이트: ${testSiteName} (${testSiteId})`)
  
  // Test NPC-1000 daily records query
  console.log('\n📊 NPC-1000 작업일지 연동 데이터 조회...')
  const { data: recordsData, error: recordsError } = await supabase
    .from('npc1000_daily_records')
    .select(`
      id,
      daily_report_id,
      incoming_quantity,
      used_quantity,
      remaining_quantity,
      total_cost,
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
    .eq('daily_reports.site_id', testSiteId)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (recordsError) {
    console.error('❌ 레코드 쿼리 실패:', recordsError)
  } else {
    console.log('✅ 쿼리 성공!')
    console.log('📊 찾은 레코드 수:', recordsData?.length || 0)
    if (recordsData && recordsData.length > 0) {
      console.log('샘플 레코드:')
      recordsData.slice(0, 3).forEach((record, i) => {
        console.log(`  ${i + 1}. ${record.npc1000_materials.material_name}`)
        console.log(`     사용량: ${record.used_quantity}${record.npc1000_materials.unit}`)
        console.log(`     작업일: ${record.daily_reports.work_date}`)
        console.log(`     현장: ${record.daily_reports.sites.name}`)
      })
    }
  }
  
  // Test site summary view
  console.log('\n📈 사이트 요약 데이터 조회...')
  const { data: summaryData, error: summaryError } = await supabase
    .from('npc1000_site_summary')
    .select('*')
    .eq('site_id', testSiteId)
    .limit(5)
  
  if (summaryError) {
    console.error('❌ 사이트 요약 쿼리 실패:', summaryError)
  } else {
    console.log('✅ 사이트 요약 쿼리 성공!')
    console.log('📈 요약 데이터 수:', summaryData?.length || 0)
    if (summaryData && summaryData.length > 0) {
      console.log('요약 데이터:')
      summaryData.forEach((summary, i) => {
        console.log(`  ${i + 1}. ${summary.material_name}`)
        console.log(`     카테고리: ${summary.category}`)
        console.log(`     총 사용량: ${summary.total_used}${summary.unit}`)
        console.log(`     기록 수: ${summary.report_count}건`)
        console.log(`     총 비용: ${summary.total_cost.toLocaleString()}원`)
      })
    }
  }
  
  // Check if the site has ANY NPC-1000 data
  console.log('\n🔍 해당 사이트의 모든 NPC-1000 데이터 확인...')
  const { count: totalRecords } = await supabase
    .from('npc1000_daily_records')
    .select('*', { count: 'exact', head: true })
    .eq('daily_reports.site_id', testSiteId)
  
  console.log(`📊 해당 사이트 총 NPC-1000 기록 수: ${totalRecords || 0}건`)
  
  if (totalRecords === 0) {
    console.log('\n💡 해당 사이트에 NPC-1000 데이터가 없습니다. 다른 사이트 확인...')
    
    const { data: allSitesWithData, error: allSitesError } = await supabase
      .from('npc1000_site_summary')
      .select('site_id, site_name, COUNT(*) as record_count')
      .limit(5)
    
    if (!allSitesError && allSitesWithData && allSitesWithData.length > 0) {
      console.log('🗂️ NPC-1000 데이터가 있는 사이트들:')
      allSitesWithData.forEach((site, i) => {
        console.log(`  ${i + 1}. ${site.site_name} (${site.site_id})`)
      })
    }
  }
}

testNPCQuery()