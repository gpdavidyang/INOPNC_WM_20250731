const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY가 필요합니다!')
  process.exit(1)
}

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedData() {
  console.log('🌱 시드 데이터 생성 중...\n')

  try {
    // 1. 샘플 현장 생성
    console.log('🏗️ 샘플 현장 생성...')
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .insert([
        {
          name: '강남 A현장',
          address: '서울시 강남구 테헤란로 456',
          status: 'active',
          description: '강남지역 주요 건설현장',
          construction_manager_phone: '010-1234-5678',
          safety_manager_phone: '010-1234-5679',
          accommodation_name: '강남 숙소',
          accommodation_address: '서울시 강남구 역삼동 123-45',
          start_date: '2025-01-01',
          end_date: '2025-12-31'
        },
        {
          name: '서초 B현장', 
          address: '서울시 서초구 서초대로 789',
          status: 'active',
          description: '서초지역 오피스빌딩 건설',
          construction_manager_phone: '010-9876-5432',
          safety_manager_phone: '010-9876-5433',
          accommodation_name: '서초 게스트하우스',
          accommodation_address: '서울시 서초구 방배동 789-12',
          start_date: '2025-02-01',
          end_date: '2025-11-30'
        },
        {
          name: '송파 C현장',
          address: '서울시 송파구 올림픽로 321',
          status: 'active',
          description: '송파구 복합건물 건설예정',
          construction_manager_phone: '010-5555-7777',
          safety_manager_phone: '010-5555-7778',
          accommodation_name: '송파 숙박시설',
          accommodation_address: '서울시 송파구 잠실동 321-67',
          start_date: '2025-03-01',
          end_date: '2026-02-28'
        }
      ])
      .select()

    if (sitesError) {
      console.log('❌ 현장 생성 실패:', sitesError.message)
      return
    }

    console.log(`✅ ${sites.length}개 현장 생성 완료:`)
    sites.forEach(site => {
      console.log(`   - ${site.name} (${site.status})`)
    })

    // 2. 사용자 목록 가져오기
    console.log('\n👥 사용자 목록 확인...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')

    if (profilesError) {
      console.log('❌ 사용자 목록 조회 실패:', profilesError.message)
      return
    }

    console.log(`✅ ${profiles.length}개 사용자 확인됨`)

    // 3. 사용자-현장 할당 생성
    console.log('\n🎯 사용자-현장 할당 생성...')
    const assignments = []

    // 각 사용자를 현장에 할당
    profiles.forEach((profile, index) => {
      const siteIndex = index % sites.length // 순환 할당
      const site = sites[siteIndex]
      
      assignments.push({
        user_id: profile.id,
        site_id: site.id,
        is_active: true,
        assigned_date: new Date().toISOString().split('T')[0]
      })
    })

    const { data: assignmentData, error: assignmentError } = await supabase
      .from('site_assignments')
      .insert(assignments)
      .select()

    if (assignmentError) {
      console.log('❌ 사용자-현장 할당 실패:', assignmentError.message)
    } else {
      console.log(`✅ ${assignmentData.length}개 할당 완료:`)
      assignmentData.forEach(assignment => {
        const user = profiles.find(p => p.id === assignment.user_id)
        const site = sites.find(s => s.id === assignment.site_id)
        console.log(`   - ${user?.full_name} → ${site?.name} [${assignment.role}]`)
      })
    }

    // 4. 샘플 일일보고서 생성
    console.log('\n📝 샘플 일일보고서 생성...')
    const reports = []
    
    // 각 활성 현장에 대해 최근 3일간의 보고서 생성
    const activeSites = sites.filter(site => site.status === 'active')
    const workers = profiles.filter(p => p.role === 'worker' || p.role === 'site_manager')
    
    for (let i = 0; i < 3; i++) {
      const workDate = new Date()
      workDate.setDate(workDate.getDate() - i)
      
      activeSites.forEach(site => {
        const worker = workers[Math.floor(Math.random() * workers.length)]
        
        reports.push({
          site_id: site.id,
          work_date: workDate.toISOString().split('T')[0],
          member_name: worker.full_name,
          process_type: ['구조체공사', '마감공사', '토공사', '철근공사'][Math.floor(Math.random() * 4)],
          total_workers: Math.floor(Math.random() * 10) + 5,
          npc1000_used: Math.floor(Math.random() * 500) + 100,
          issues: Math.random() > 0.7 ? '특이사항 없음' : null,
          status: 'submitted',
          created_by: worker.id,
          submitted_by: worker.id
        })
      })
    }

    const { data: reportData, error: reportError } = await supabase
      .from('daily_reports')
      .insert(reports)
      .select()

    if (reportError) {
      console.log('❌ 일일보고서 생성 실패:', reportError.message)
    } else {
      console.log(`✅ ${reportData.length}개 일일보고서 생성 완료`)
    }

    console.log('\n🎉 시드 데이터 생성 완료!')
    console.log('이제 애플리케이션에서 데이터를 확인할 수 있습니다.')

  } catch (error) {
    console.error('❌ 시드 데이터 생성 중 오류:', error)
  }
}

seedData()