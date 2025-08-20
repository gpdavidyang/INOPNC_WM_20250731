#!/usr/bin/env node

/**
 * 모든 문서 데이터를 한번에 생성하는 통합 스크립트
 * 내문서함, 공유문서함, 도면마킹 모든 샘플 데이터 생성
 */

const { createSampleDocuments } = require('./create-sample-documents.js')
const { createSharedDocuments } = require('./create-shared-documents.js')
const { createMarkupDocuments } = require('./create-markup-documents.js')

async function createAllDocuments() {
  console.log('🚀 모든 문서 샘플 데이터 생성을 시작합니다...\n')

  try {
    console.log('📄 1단계: 내문서함 샘플 데이터 생성')
    console.log('=' .repeat(50))
    await createSampleDocuments()
    console.log('\n')

    console.log('🤝 2단계: 공유문서함 샘플 데이터 생성')
    console.log('=' .repeat(50))
    await createSharedDocuments()
    console.log('\n')

    console.log('🎨 3단계: 도면마킹 샘플 데이터 생성')
    console.log('=' .repeat(50))
    await createMarkupDocuments()
    console.log('\n')

    console.log('🎉 모든 문서 샘플 데이터 생성이 완료되었습니다!')
    console.log('=' .repeat(60))
    console.log('📋 생성된 데이터 요약:')
    console.log('  📁 내문서함: 개인 업무 문서 (PDF, DOC, XLS, 이미지)')
    console.log('  🤝 공유문서함: 팀 공용 문서 (안전, 품질, 교육 자료)')
    console.log('  🎨 도면마킹: 건설 도면 + 마킹 데이터 (평면도, 배치도, 설비도)')
    console.log('')
    console.log('💡 테스트 가능한 기능:')
    console.log('  👁️ 미리보기: 모든 문서 실시간 미리보기')
    console.log('  ⬇️ 다운로드: 브라우저 다운로드 기능')
    console.log('  🔍 검색/필터: 파일명 검색, 타입별 필터링')
    console.log('  📝 마킹 편집: 도면에 박스, 텍스트, 그리기')
    console.log('  🔄 정렬: 날짜순, 이름순 정렬')
    console.log('')
    console.log('🌐 브라우저에서 테스트: http://localhost:3000/dashboard')

  } catch (error) {
    console.error('❌ 전체 생성 과정에서 오류 발생:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  createAllDocuments()
}

module.exports = { createAllDocuments }