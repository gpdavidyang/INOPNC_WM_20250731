#!/usr/bin/env tsx
/**
 * Script to get comprehensive database summary with real data
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getDatabaseSummary() {
  console.log('📊 데이터베이스 현황 요약\n')
  console.log('=' + '='.repeat(50))
  
  try {
    // 현장 수
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, status, address')
    
    if (sitesError) throw sitesError
    
    console.log('\n🏗️  현장 정보:')
    console.log(`   전체 현장 수: ${sites?.length || 0}개`)
    if (sites) {
      const activeSites = sites.filter(s => s.status === 'active')
      console.log(`   활성 현장: ${activeSites.length}개`)
      console.log('   현장 목록:')
      sites.forEach(site => {
        console.log(`   - ${site.name} (${site.status})`)
        console.log(`     주소: ${site.address || '주소 없음'}`)
      })
    }
    
    // 사용자 수
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
    
    if (profilesError) throw profilesError
    
    console.log('\n👥 사용자 정보:')
    console.log(`   전체 사용자 수: ${profiles?.length || 0}명`)
    if (profiles) {
      const roleStats: Record<string, number> = {}
      profiles.forEach(p => {
        roleStats[p.role] = (roleStats[p.role] || 0) + 1
      })
      console.log('   역할별 분포:')
      Object.entries(roleStats).forEach(([role, count]) => {
        const roleName = {
          'worker': '작업자',
          'site_manager': '현장관리자', 
          'customer_manager': '파트너사',
          'admin': '관리자',
          'system_admin': '시스템관리자'
        }[role] || role
        console.log(`   - ${roleName}: ${count}명`)
      })
    }
    
    // 출근 기록
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .select('id, work_date, status')
    
    if (attendanceError) throw attendanceError
    
    console.log('\n📅 출근 기록:')
    console.log(`   전체 출근 기록: ${attendance?.length || 0}건`)
    if (attendance) {
      const statusStats: Record<string, number> = {}
      attendance.forEach(a => {
        statusStats[a.status || 'unknown'] = (statusStats[a.status || 'unknown'] || 0) + 1
      })
      console.log('   상태별 분포:')
      Object.entries(statusStats).forEach(([status, count]) => {
        const statusName = {
          'present': '출근',
          'absent': '결근',
          'leave': '휴가',
          'sick': '병가'
        }[status] || status
        console.log(`   - ${statusName}: ${count}건`)
      })
    }
    
    // 작업일지
    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('id, work_date, status, created_at')
    
    if (reportsError) throw reportsError
    
    console.log('\n📝 작업일지:')
    console.log(`   전체 작업일지: ${reports?.length || 0}건`)
    if (reports) {
      const statusStats: Record<string, number> = {}
      reports.forEach(r => {
        statusStats[r.status] = (statusStats[r.status] || 0) + 1
      })
      console.log('   상태별 분포:')
      Object.entries(statusStats).forEach(([status, count]) => {
        const statusName = {
          'draft': '임시저장',
          'submitted': '제출완료',
          'approved': '승인완료'
        }[status] || status
        console.log(`   - ${statusName}: ${count}건`)
      })
    }
    
    // 문서
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, title, document_type, created_at')
    
    if (documentsError) throw documentsError
    
    console.log('\n📄 문서:')
    console.log(`   전체 문서: ${documents?.length || 0}건`)
    if (documents) {
      const typeStats: Record<string, number> = {}
      documents.forEach(d => {
        typeStats[d.document_type] = (typeStats[d.document_type] || 0) + 1
      })
      console.log('   문서 종류별:')
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}건`)
      })
    }
    
    // 알림
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, title, type, is_read, created_at')
    
    if (notificationsError) throw notificationsError
    
    console.log('\n🔔 알림:')
    console.log(`   전체 알림: ${notifications?.length || 0}건`)
    if (notifications) {
      const unreadCount = notifications.filter(n => !n.is_read).length
      console.log(`   미읽음 알림: ${unreadCount}건`)
      console.log(`   읽음 알림: ${notifications.length - unreadCount}건`)
    }
    
    // 조직 정보
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, type')
    
    if (orgError) throw orgError
    
    console.log('\n🏢 조직 정보:')
    console.log(`   전체 조직: ${organizations?.length || 0}개`)
    if (organizations) {
      organizations.forEach(org => {
        console.log(`   - ${org.name} (${org.type})`)
      })
    }

    // 마크업 문서
    const { data: markupDocs, error: markupError } = await supabase
      .from('markup_documents')
      .select('id, title, location, created_at')
    
    if (markupError) throw markupError
    
    console.log('\n🎨 마크업 문서 (도면):')
    console.log(`   전체 마크업 문서: ${markupDocs?.length || 0}건`)
    if (markupDocs) {
      const locationStats: Record<string, number> = {}
      markupDocs.forEach(d => {
        locationStats[d.location] = (locationStats[d.location] || 0) + 1
      })
      console.log('   위치별 분포:')
      Object.entries(locationStats).forEach(([location, count]) => {
        const locationName = {
          'personal': '개인',
          'shared': '공유'
        }[location] || location
        console.log(`   - ${locationName}: ${count}건`)
      })
    }
    
    console.log('\n' + '=' + '='.repeat(50))
    console.log('✅ 데이터베이스 연결 성공 및 데이터 조회 완료')
    
  } catch (error) {
    console.error('❌ 데이터 조회 중 오류 발생:', error.message)
  }
}

// Run the summary
getDatabaseSummary().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})