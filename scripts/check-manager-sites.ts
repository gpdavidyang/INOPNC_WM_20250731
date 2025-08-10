import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role to bypass RLS for debugging
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkManagerSites() {
  console.log('🔍 manager@inopnc.com 사용자의 현장 접근 권한 확인\n')

  try {
    // 1. manager@inopnc.com 사용자 정보 확인
    console.log('👤 사용자 정보 확인:')
    const { data: managerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'manager@inopnc.com')
      .single()

    if (profileError || !managerProfile) {
      console.log('❌ manager@inopnc.com 사용자를 찾을 수 없습니다:', profileError?.message)
      return
    }

    console.log(`✅ 사용자 발견: ${managerProfile.full_name} [${managerProfile.role}]`)
    console.log(`   ID: ${managerProfile.id}`)

    // 2. 현재 생성된 모든 현장 확인
    console.log('\n🏗️ 전체 현장 목록:')
    const { data: allSites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false })

    if (sitesError) {
      console.log('❌ 현장 목록 조회 실패:', sitesError.message)
      return
    }

    if (!allSites || allSites.length === 0) {
      console.log('❌ 생성된 현장이 없습니다!')
      console.log('💡 시드 스크립트가 실제로 실행되지 않았을 가능성이 높습니다.')
      return
    }

    console.log(`✅ 총 ${allSites.length}개 현장 발견:`)
    allSites.forEach(site => {
      console.log(`   - ${site.name} (${site.address}) [${site.status}]`)
      console.log(`     ID: ${site.id}`)
      console.log(`     생성일: ${new Date(site.created_at).toLocaleString('ko-KR')}`)
    })

    // 3. 사용자-현장 할당 확인
    console.log('\n🎯 사용자-현장 할당 상태:')
    const { data: assignments, error: assignError } = await supabase
      .from('site_assignments')
      .select('*')
      .eq('user_id', managerProfile.id)

    if (assignError) {
      console.log('❌ 할당 조회 실패:', assignError.message)
      return
    }

    if (!assignments || assignments.length === 0) {
      console.log('❌ manager@inopnc.com 사용자에게 할당된 현장이 없습니다!')
      
      // 모든 할당 확인해보기
      console.log('\n📋 전체 할당 현황 확인:')
      const { data: allAssignments, error: allAssignError } = await supabase
        .from('site_assignments')
        .select('*')

      if (allAssignError) {
        console.log('❌ 전체 할당 조회 실패:', allAssignError.message)
      } else if (!allAssignments || allAssignments.length === 0) {
        console.log('❌ 시스템에 할당 데이터가 전혀 없습니다!')
      } else {
        console.log(`✅ 전체 ${allAssignments.length}개 할당 발견:`)
        allAssignments.forEach(assignment => {
          console.log(`   - User ID: ${assignment.user_id.substring(0,8)}... → Site ID: ${assignment.site_id.substring(0,8)}... (Active: ${assignment.is_active})`)
        })
        
        // manager 사용자의 할당 찾기
        const managerAssignments = allAssignments.filter(a => a.user_id === managerProfile.id)
        console.log(`\n🎯 manager@inopnc.com 할당: ${managerAssignments.length}개`)
        managerAssignments.forEach(assignment => {
          const site = allSites.find(s => s.id === assignment.site_id)
          console.log(`   - ${site?.name || 'Unknown Site'} (Active: ${assignment.is_active})`)
        })
      }
      
      return
    }

    console.log(`✅ ${assignments.length}개 현장에 할당됨:`)
    assignments.forEach(assignment => {
      const site = allSites.find(s => s.id === assignment.site_id)
      console.log(`   - ${site?.name || 'Unknown Site'} (${site?.address || 'No address'})`)
      console.log(`     활성: ${assignment.is_active}`)
      console.log(`     할당일: ${assignment.assigned_date}`)
    })

    // 4. RLS 정책으로 인한 실제 접근 가능성 테스트
    console.log('\n🔒 RLS 정책 하에서의 접근 테스트:')
    
    // Anon key로 테스트 (실제 앱에서 사용하는 방식)
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // 실제 로그인 시뮬레이션은 어려우므로, RLS 정책 자체를 확인
    console.log('💡 실제 로그인 상태에서는 RLS 정책에 따라 접근이 결정됩니다.')
    console.log('💡 getCurrentUserSite, getUserSiteHistory 함수를 통해 데이터를 가져와야 합니다.')

    // 5. 예상되는 결과
    console.log('\n📊 예상 결과:')
    const activeSites = assignments.filter(a => a.is_active)
    const managerSites = activeSites.map(a => {
      const site = allSites.find(s => s.id === a.site_id)
      return site?.name || 'Unknown Site'
    })
    console.log(`manager@inopnc.com이 볼 수 있어야 할 현장: ${managerSites.join(', ')}`)

  } catch (error) {
    console.error('❌ 확인 중 오류:', error)
  }
}

checkManagerSites()