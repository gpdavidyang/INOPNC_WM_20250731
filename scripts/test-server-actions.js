// 서버 액션을 통한 데이터 확인 스크립트
const { spawn } = require('child_process')
const path = require('path')

async function testServerActions() {
  console.log('🔍 서버 액션을 통한 데이터 확인 중...\n')

  // Next.js 개발 서버 실행
  const nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    env: { 
      ...process.env, 
      DEBUG: 'true',  // Debug 모드 활성화
      NODE_ENV: 'development'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  })

  let serverReady = false
  let output = []

  nextProcess.stdout.on('data', (data) => {
    const line = data.toString()
    output.push(line)
    console.log(line)
    
    if (line.includes('Ready') || line.includes('localhost:3000')) {
      serverReady = true
      console.log('\n✅ 서버 준비 완료! 브라우저에서 확인하세요.')
      console.log('🌐 http://localhost:3000 으로 접속하여 데이터를 확인하세요.')
      console.log('\n💡 확인사항:')
      console.log('1. 로그인 후 홈 탭에서 현장 정보 확인')
      console.log('2. 현장정보 페이지에서 현장 참여 이력 확인') 
      console.log('3. 작업일지 페이지에서 작업일지 목록 확인')
      console.log('4. 출근현황 페이지에서 출근 기록 확인')
      console.log('\n⏰ 30초 후 서버를 자동 종료합니다...')
      
      setTimeout(() => {
        console.log('\n🔸 서버를 종료합니다.')
        nextProcess.kill('SIGTERM')
      }, 30000)
    }
  })

  nextProcess.stderr.on('data', (data) => {
    const line = data.toString()
    if (line.includes('ERROR') || line.includes('Error')) {
      console.error('❌ 에러:', line)
    }
  })

  nextProcess.on('close', (code) => {
    console.log(`\n서버 종료됨 (코드: ${code})`)
    
    if (!serverReady) {
      console.log('\n❌ 서버 시작 실패. 에러 로그:')
      output.forEach(line => console.log(line))
    }
  })

  // 프로세스 종료 시 정리
  process.on('SIGINT', () => {
    console.log('\n🔸 프로세스 종료 중...')
    nextProcess.kill('SIGTERM')
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    nextProcess.kill('SIGTERM')
    process.exit(0)
  })
}

testServerActions()