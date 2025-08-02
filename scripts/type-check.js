#!/usr/bin/env node

/**
 * TypeScript 타입 체크 및 자동 수정 스크립트
 * 사용법: node scripts/type-check.js [--fix] [--watch]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FIX_MODE = process.argv.includes('--fix');
const WATCH_MODE = process.argv.includes('--watch');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// TypeScript 체크 실행
function runTypeCheck() {
  log('\n🔍 Running TypeScript type check...', 'blue');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe', encoding: 'utf8' });
    log('✅ No TypeScript errors found!', 'green');
    return { success: true, errors: 0 };
  } catch (error) {
    const output = error.stdout || error.stderr || error.toString();
    const errorCount = (output.match(/error TS/g) || []).length;
    
    log(`❌ Found ${errorCount} TypeScript errors`, 'red');
    
    if (FIX_MODE) {
      return { success: false, errors: errorCount, output };
    } else {
      console.log(output);
      return { success: false, errors: errorCount };
    }
  }
}

// 자동 수정 실행
async function runAutoFix(errorOutput) {
  log('\n🔧 Attempting automatic fixes...', 'yellow');
  
  // 오류 분석
  try {
    fs.writeFileSync('temp-errors.log', errorOutput);
    execSync('node scripts/analyze-ts-errors.js temp-errors.log', { stdio: 'inherit' });
    fs.unlinkSync('temp-errors.log');
  } catch (error) {
    log('Failed to analyze errors', 'red');
  }
  
  // 일반적인 오류 수정
  log('\n🔧 Applying common fixes...', 'yellow');
  try {
    execSync('node scripts/fix-common-errors.js', { stdio: 'inherit' });
  } catch (error) {
    log('Failed to apply common fixes', 'red');
  }
  
  // 다시 타입 체크
  return runTypeCheck();
}

// Watch 모드
function runWatchMode() {
  log('👀 Starting TypeScript watch mode...', 'cyan');
  
  const tsc = spawn('npx', ['tsc', '--noEmit', '--watch'], {
    stdio: 'pipe'
  });
  
  let errorBuffer = '';
  
  tsc.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    
    if (output.includes('Watching for file changes')) {
      if (errorBuffer.includes('error')) {
        log('\n⚠️  Errors detected. Run with --fix to attempt automatic fixes.', 'yellow');
      }
      errorBuffer = '';
    } else {
      errorBuffer += output;
    }
  });
  
  tsc.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  tsc.on('close', (code) => {
    log(`\nTypeScript watch mode exited with code ${code}`, code === 0 ? 'green' : 'red');
  });
  
  // Ctrl+C 처리
  process.on('SIGINT', () => {
    tsc.kill();
    process.exit();
  });
}

// 통계 표시
function showStatistics() {
  try {
    const stats = {
      totalFiles: 0,
      tsFiles: 0,
      tsxFiles: 0,
      jsFiles: 0,
      jsxFiles: 0
    };
    
    const countFiles = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
          countFiles(filePath);
        } else if (stat.isFile()) {
          stats.totalFiles++;
          if (file.endsWith('.ts')) stats.tsFiles++;
          else if (file.endsWith('.tsx')) stats.tsxFiles++;
          else if (file.endsWith('.js')) stats.jsFiles++;
          else if (file.endsWith('.jsx')) stats.jsxFiles++;
        }
      });
    };
    
    countFiles(process.cwd());
    
    log('\n📊 Project Statistics:', 'magenta');
    log(`   Total files: ${stats.totalFiles}`);
    log(`   TypeScript files: ${stats.tsFiles + stats.tsxFiles} (.ts: ${stats.tsFiles}, .tsx: ${stats.tsxFiles})`);
    log(`   JavaScript files: ${stats.jsFiles + stats.jsxFiles} (.js: ${stats.jsFiles}, .jsx: ${stats.jsxFiles})`);
  } catch (error) {
    // 통계 실패 시 무시
  }
}

// 메인 함수
async function main() {
  log('🚀 TypeScript Type Checker', 'cyan');
  log('================================\n', 'cyan');
  
  if (WATCH_MODE) {
    runWatchMode();
    return;
  }
  
  // 타입 체크 실행
  let result = runTypeCheck();
  
  // 자동 수정 모드
  if (!result.success && FIX_MODE) {
    result = await runAutoFix(result.output);
    
    if (result.success) {
      log('\n✅ All errors fixed successfully!', 'green');
    } else {
      log(`\n⚠️  ${result.errors} errors remain after automatic fixes`, 'yellow');
      log('Some errors require manual intervention.', 'yellow');
    }
  }
  
  // 통계 표시
  showStatistics();
  
  // 도움말
  if (!result.success && !FIX_MODE) {
    log('\n💡 Tips:', 'cyan');
    log('   - Run with --fix to attempt automatic fixes');
    log('   - Run with --watch for continuous type checking');
    log('   - Check typescript-error-report.md for detailed analysis');
  }
  
  process.exit(result.success ? 0 : 1);
}

// 실행
main().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});