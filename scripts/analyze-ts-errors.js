#!/usr/bin/env node

/**
 * TypeScript 오류 분석 및 패턴 분류 스크립트
 * 사용법: node scripts/analyze-ts-errors.js [error-log-file]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 오류 패턴 정의
const ERROR_PATTERNS = {
  supabaseTable: {
    pattern: /Argument of type '.*' is not assignable to parameter of type.*Tables/,
    solution: 'Add type assertion: (supabase as any)',
    category: 'Supabase Type Mismatch'
  },
  buttonVariant: {
    pattern: /Type '"default"' is not assignable to type.*variant/,
    solution: 'Change variant="default" to variant="primary"',
    category: 'Button Component Props'
  },
  buttonSize: {
    pattern: /Type '"icon"' is not assignable to type.*size/,
    solution: 'Change size="icon" to size="sm"',
    category: 'Button Component Props'
  },
  badgeVariant: {
    pattern: /Type '"destructive"' is not assignable to type.*Badge/,
    solution: 'Change variant="destructive" to variant="error"',
    category: 'Badge Component Props'
  },
  missingProperty: {
    pattern: /Property '(.+)' does not exist on type/,
    solution: 'Add type assertion or check property existence',
    category: 'Missing Property'
  },
  nullType: {
    pattern: /Type 'null' is not assignable to type 'string \| undefined'/,
    solution: 'Use optional chaining or default value',
    category: 'Null Type Issues'
  },
  setIteration: {
    pattern: /Type 'Set<.*>' can only be iterated through/,
    solution: 'Use Array.from() instead of spread operator',
    category: 'ES6 Compatibility'
  }
};

// TypeScript 오류 수집
function collectTypeScriptErrors() {
  console.log('📊 Collecting TypeScript errors...\n');
  
  try {
    execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ No TypeScript errors found!');
    return '';
  } catch (error) {
    return error.stdout || error.toString();
  }
}

// 오류 파싱
function parseErrors(errorOutput) {
  const errors = [];
  const lines = errorOutput.split('\n');
  
  let currentError = null;
  
  for (const line of lines) {
    // 파일 경로와 위치를 포함한 오류 라인
    const errorMatch = line.match(/(.+\.tsx?):(\d+):(\d+) - error TS\d+: (.+)/);
    
    if (errorMatch) {
      if (currentError) {
        errors.push(currentError);
      }
      
      currentError = {
        file: errorMatch[1],
        line: parseInt(errorMatch[2]),
        column: parseInt(errorMatch[3]),
        message: errorMatch[4],
        fullMessage: errorMatch[4],
        pattern: null,
        solution: null,
        category: 'Unknown'
      };
    } else if (currentError && line.trim()) {
      currentError.fullMessage += '\n' + line;
    }
  }
  
  if (currentError) {
    errors.push(currentError);
  }
  
  // 패턴 매칭
  errors.forEach(error => {
    for (const [key, pattern] of Object.entries(ERROR_PATTERNS)) {
      if (pattern.pattern.test(error.fullMessage)) {
        error.pattern = key;
        error.solution = pattern.solution;
        error.category = pattern.category;
        break;
      }
    }
  });
  
  return errors;
}

// 오류 통계 생성
function generateStatistics(errors) {
  const stats = {
    total: errors.length,
    byCategory: {},
    byFile: {},
    byPattern: {}
  };
  
  errors.forEach(error => {
    // 카테고리별
    stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
    
    // 파일별
    const fileName = path.basename(error.file);
    stats.byFile[fileName] = (stats.byFile[fileName] || 0) + 1;
    
    // 패턴별
    if (error.pattern) {
      stats.byPattern[error.pattern] = (stats.byPattern[error.pattern] || 0) + 1;
    }
  });
  
  return stats;
}

// 수정 제안 생성
function generateFixSuggestions(errors) {
  const suggestions = {};
  
  errors.forEach(error => {
    if (!error.pattern) return;
    
    if (!suggestions[error.pattern]) {
      suggestions[error.pattern] = {
        files: [],
        solution: error.solution,
        category: error.category,
        count: 0
      };
    }
    
    if (!suggestions[error.pattern].files.includes(error.file)) {
      suggestions[error.pattern].files.push(error.file);
    }
    suggestions[error.pattern].count++;
  });
  
  return suggestions;
}

// 리포트 생성
function generateReport(errors, stats, suggestions) {
  let report = '# TypeScript Error Analysis Report\n\n';
  report += `Generated at: ${new Date().toISOString()}\n\n`;
  
  // 요약
  report += '## Summary\n\n';
  report += `- Total Errors: ${stats.total}\n`;
  report += `- Affected Files: ${Object.keys(stats.byFile).length}\n`;
  report += `- Error Categories: ${Object.keys(stats.byCategory).length}\n\n`;
  
  // 카테고리별 통계
  report += '## Errors by Category\n\n';
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      report += `- ${category}: ${count} errors\n`;
    });
  
  report += '\n## Fix Suggestions\n\n';
  
  // 패턴별 수정 제안
  Object.entries(suggestions)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([pattern, data]) => {
      report += `### ${data.category} (${data.count} errors)\n\n`;
      report += `**Solution**: ${data.solution}\n\n`;
      report += '**Affected files**:\n';
      data.files.forEach(file => {
        report += `- ${file}\n`;
      });
      report += '\n';
    });
  
  // 상세 오류 목록
  report += '## Detailed Error List\n\n';
  errors.slice(0, 20).forEach((error, index) => {
    report += `### Error ${index + 1}\n`;
    report += `**File**: ${error.file}:${error.line}:${error.column}\n`;
    report += `**Category**: ${error.category}\n`;
    report += `**Message**: ${error.message}\n`;
    if (error.solution) {
      report += `**Solution**: ${error.solution}\n`;
    }
    report += '\n';
  });
  
  if (errors.length > 20) {
    report += `\n... and ${errors.length - 20} more errors\n`;
  }
  
  return report;
}

// 메인 함수
async function main() {
  console.log('🔍 TypeScript Error Analyzer\n');
  
  // 오류 수집
  const errorOutput = process.argv[2] 
    ? fs.readFileSync(process.argv[2], 'utf8')
    : collectTypeScriptErrors();
  
  if (!errorOutput.trim()) {
    console.log('✅ No TypeScript errors found!');
    return;
  }
  
  // 오류 파싱
  const errors = parseErrors(errorOutput);
  console.log(`📋 Found ${errors.length} errors\n`);
  
  // 통계 생성
  const stats = generateStatistics(errors);
  const suggestions = generateFixSuggestions(errors);
  
  // 리포트 생성
  const report = generateReport(errors, stats, suggestions);
  
  // 리포트 저장
  const reportPath = path.join(process.cwd(), 'typescript-error-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to: ${reportPath}\n`);
  
  // 콘솔 출력
  console.log('📊 Error Summary:');
  console.log(`   Total: ${stats.total} errors`);
  console.log(`   Files: ${Object.keys(stats.byFile).length} affected`);
  console.log('\n🏷️  Top Error Categories:');
  
  Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([category, count]) => {
      console.log(`   - ${category}: ${count}`);
    });
  
  console.log('\n💡 Quick Fix Suggestions:');
  Object.entries(suggestions)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .forEach(([pattern, data]) => {
      console.log(`   - ${data.category}: ${data.solution} (${data.count} occurrences)`);
    });
  
  // 자동 수정 가능 여부 확인
  const autoFixableCount = errors.filter(e => e.pattern).length;
  if (autoFixableCount > 0) {
    console.log(`\n🔧 ${autoFixableCount} errors can be auto-fixed. Run: npm run fix:types`);
  }
}

// 실행
main().catch(console.error);