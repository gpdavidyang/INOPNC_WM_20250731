#!/usr/bin/env tsx
/**
 * Script to insert PTW document into database for all sites
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertPTWDocument() {
  console.log('📄 PTW 문서 데이터베이스 삽입 시작\n')
  console.log('=' + '='.repeat(60))
  
  try {
    // 1. PTW 파일 확인
    const ptwFilePath = path.join(process.cwd(), 'docs/PTW.pdf')
    if (!fs.existsSync(ptwFilePath)) {
      throw new Error(`PTW 파일을 찾을 수 없습니다: ${ptwFilePath}`)
    }
    
    const fileStats = fs.statSync(ptwFilePath)
    console.log(`\n✅ PTW 파일 확인 완료`)
    console.log(`   파일 경로: ${ptwFilePath}`)
    console.log(`   파일 크기: ${(fileStats.size / 1024).toFixed(2)} KB`)
    
    // 2. 시스템 관리자 계정 확인 (문서 소유자로 사용)
    const { data: systemAdmin, error: adminError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'system_admin')
      .single()
    
    if (adminError || !systemAdmin) {
      throw new Error('시스템 관리자 계정을 찾을 수 없습니다.')
    }
    
    console.log(`\n✅ 시스템 관리자 확인`)
    console.log(`   이름: ${systemAdmin.full_name}`)
    console.log(`   이메일: ${systemAdmin.email}`)
    
    // 3. 활성 현장 목록 조회
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, address')
      .eq('status', 'active')
      .order('name')
    
    if (sitesError) throw sitesError
    
    console.log(`\n✅ 활성 현장 조회 완료: ${sites?.length || 0}개`)
    sites?.forEach(site => {
      console.log(`   - ${site.name}`)
    })
    
    // 4. 기존 PTW 문서 확인 (documents 테이블 사용)
    const { data: existingPTW, error: checkError } = await supabase
      .from('documents')
      .select('id, site_id, title')
      .ilike('title', '%PTW%')
      .or('title.ilike.%작업허가서%')
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    if (existingPTW && existingPTW.length > 0) {
      console.log(`\n⚠️  기존 PTW 문서 발견: ${existingPTW.length}건`)
      existingPTW.forEach(doc => {
        console.log(`   - ${doc.title} (ID: ${doc.id})`)
      })
      console.log(`\n삭제하고 새로 생성합니다...`)
      
      // 기존 문서 삭제
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .in('id', existingPTW.map(doc => doc.id))
      
      if (deleteError) throw deleteError
      console.log(`✅ 기존 PTW 문서 삭제 완료`)
    }
    
    // 5. PTW 문서를 각 현장에 삽입
    if (!sites || sites.length === 0) {
      throw new Error('활성 현장이 없습니다.')
    }
    
    console.log(`\n🔄 PTW 문서 삽입 시작...`)
    
    const documentsToInsert = sites.map(site => ({
      title: `[${site.name}] 작업허가서 (PTW)`,
      description: `${site.name}에서 사용하는 작업허가서(Permit to Work) 양식입니다. 고위험 작업 시 필수로 작성해야 하는 안전관리 문서입니다.`,
      file_url: '/docs/PTW.pdf', // public 폴더에 있는 파일
      file_name: `${site.name}_작업허가서_PTW.pdf`,
      file_size: fileStats.size,
      mime_type: 'application/pdf',
      document_type: 'certificate', // certificate 타입 사용
      folder_path: '/safety/ptw',
      owner_id: systemAdmin.id,
      site_id: site.id,
      is_public: true, // 현장 내 모든 사용자가 접근 가능
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    const { data: insertedDocs, error: insertError } = await supabase
      .from('documents')
      .insert(documentsToInsert)
      .select('id, title, site_id')
    
    if (insertError) throw insertError
    
    console.log(`\n✅ PTW 문서 삽입 완료: ${insertedDocs?.length || 0}건`)
    
    // 6. 삽입된 문서 확인
    if (insertedDocs) {
      console.log(`\n📋 삽입된 PTW 문서 목록:`)
      insertedDocs.forEach((doc: any, index: number) => {
        console.log(`   ${index + 1}. ${doc.title}`)
        console.log(`      ID: ${doc.id}`)
        console.log(`      현장 ID: ${doc.site_id}`)
      })
    }
    
    // 7. 추가 검증 - 전체 PTW 문서 수 확인
    const { data: finalCount, error: countError } = await supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .ilike('title', '%PTW%')
    
    if (countError && countError.code !== 'PGRST116') {
      throw countError
    }
    
    console.log(`\n📊 최종 PTW 문서 수: ${finalCount?.length || 0}건`)
    
    // 8. 파일 접근성 안내
    console.log(`\n📁 파일 설정 안내:`)
    console.log(`   - PTW.pdf 파일은 현재 docs/ 폴더에 있습니다`)
    console.log(`   - 실제 서비스에서는 다음 중 하나로 설정해야 합니다:`)
    console.log(`     1) public/docs/PTW.pdf 로 이동`)
    console.log(`     2) Supabase Storage에 업로드`)
    console.log(`     3) 외부 CDN에 업로드`)
    
    console.log(`\n💡 활용 방법:`)
    console.log(`   - 각 현장별로 동일한 PTW 양식을 제공`)
    console.log(`   - TodaySiteInfo 컴포넌트에서 PTW 문서 다운로드 가능`)
    console.log(`   - 모든 현장 작업자가 안전관리 목적으로 활용`)
    console.log(`   - 고위험 작업 시 필수 작성 문서`)
    
    console.log('\n' + '=' + '='.repeat(60))
    console.log('✅ PTW 문서 데이터베이스 삽입 완료')
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message)
    console.error('상세 오류:', error)
    process.exit(1)
  }
}

// 실행
insertPTWDocument().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})