#!/usr/bin/env node

/**
 * TypeScript 일반적인 오류 자동 수정 스크립트
 * 사용법: node scripts/fix-common-errors.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DRY_RUN = process.argv.includes('--dry-run');

// 수정 패턴 정의
const FIX_PATTERNS = [
  {
    name: 'Button variant="default" to "primary" (only in Button components)',
    pattern: /<Button[^>]*variant\s*=\s*["']default["']/g,
    replacement: (match) => match.replace('variant="default"', 'variant="primary"'),
    filePattern: '**/*.{tsx,jsx}'
  },
  {
    name: 'Button size="icon" to "sm"',
    pattern: /size\s*=\s*["']icon["']/g,
    replacement: 'size="sm"',
    filePattern: '**/*.{tsx,jsx}'
  },
  {
    name: 'Badge variant="destructive" to "error"',
    pattern: /variant\s*=\s*["']destructive["']/g,
    replacement: 'variant="error"',
    filePattern: '**/*.{tsx,jsx}'
  },
  {
    name: 'Set spread to Array.from',
    pattern: /\[\.\.\.new\s+Set\s*\(/g,
    replacement: 'Array.from(new Set(',
    filePattern: '**/*.{ts,tsx}'
  },
  {
    name: 'Supabase from() type assertion',
    pattern: /await\s+this\.supabase\s*\n?\s*\.from\(/g,
    replacement: 'await (this.supabase as any)\n        .from(',
    filePattern: '**/*.{ts,tsx}'
  },
  {
    name: 'Supabase from() type assertion (single line)',
    pattern: /await\s+supabase\.from\(/g,
    replacement: 'await (supabase as any).from(',
    filePattern: '**/*.{ts,tsx}'
  },
  {
    name: 'Navigator.msSaveBlob type assertion',
    pattern: /navigator\.msSaveBlob/g,
    replacement: '(navigator as any).msSaveBlob',
    filePattern: '**/*.{ts,tsx}'
  },
  {
    name: 'CronJob nextDate().toISOString()',
    pattern: /\.nextDate\(\)\.toISOString\(\)/g,
    replacement: '.nextDate().toJSDate().toISOString()',
    filePattern: '**/*.{ts,tsx}'
  },
  // Implicit any 타입 수정 패턴들
  {
    name: 'Array reduce implicit any - acc',
    pattern: /\.reduce\(\((acc|sum),\s*([a-zA-Z_]+)\)/g,
    replacement: '.reduce(($1: any, $2: any)',
    filePattern: '**/*.{ts,tsx}'
  },
  {
    name: 'Array filter/map implicit any',
    pattern: /\.(filter|map|forEach|find|some|every)\(\(([a-zA-Z_]+)\)\s*=>/g,
    replacement: '.$1(($2: any) =>',
    filePattern: '**/*.{ts,tsx}'
  },
  {
    name: 'getByLink to getByRole',
    pattern: /page\.getByLink/g,
    replacement: 'page.getByRole(\'link\'',
    filePattern: '**/*.spec.ts'
  }
];

// 파일 수정 함수
function fixFile(filePath, patterns) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const changes = [];

    patterns.forEach(({ name, pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        if (!DRY_RUN) {
          if (typeof replacement === 'function') {
            content = content.replace(pattern, replacement);
          } else {
            content = content.replace(pattern, replacement);
          }
        }
        modified = true;
        changes.push({
          pattern: name,
          count: matches.length
        });
      }
    });

    if (modified) {
      if (!DRY_RUN) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
      return { filePath, changes };
    }

    return null;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

// 메인 함수
async function main() {
  console.log('🔧 TypeScript Common Error Fixer\n');
  
  if (DRY_RUN) {
    console.log('🔍 Running in DRY RUN mode - no files will be modified\n');
  }

  const results = {
    filesModified: 0,
    totalChanges: 0,
    changesByPattern: {}
  };

  // 각 패턴에 대해 처리
  for (const fixPattern of FIX_PATTERNS) {
    const files = glob.sync(fixPattern.filePattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
    });

    console.log(`\n📋 Processing pattern: ${fixPattern.name}`);
    console.log(`   Files to check: ${files.length}`);

    let patternChanges = 0;

    files.forEach(file => {
      const result = fixFile(file, [fixPattern]);
      if (result) {
        results.filesModified++;
        result.changes.forEach(change => {
          patternChanges += change.count;
          results.totalChanges += change.count;
        });
        
        if (result.changes.length > 0) {
          console.log(`   ✓ ${file}: ${result.changes[0].count} changes`);
        }
      }
    });

    results.changesByPattern[fixPattern.name] = patternChanges;
    
    if (patternChanges > 0) {
      console.log(`   Total changes: ${patternChanges}`);
    } else {
      console.log(`   No matches found`);
    }
  }

  // 결과 요약
  console.log('\n📊 Summary:');
  console.log(`   Files modified: ${results.filesModified}`);
  console.log(`   Total changes: ${results.totalChanges}`);
  
  console.log('\n🏷️  Changes by pattern:');
  Object.entries(results.changesByPattern).forEach(([pattern, count]) => {
    if (count > 0) {
      console.log(`   - ${pattern}: ${count}`);
    }
  });

  if (DRY_RUN && results.totalChanges > 0) {
    console.log('\n💡 To apply these changes, run without --dry-run flag:');
    console.log('   node scripts/fix-common-errors.js');
  }

  // 추가 수정이 필요한 패턴 감지
  detectAdditionalPatterns();
}

// 추가 패턴 감지
function detectAdditionalPatterns() {
  console.log('\n🔍 Detecting additional patterns that may need manual fixes...\n');
  
  const additionalPatterns = [
    {
      name: 'Missing property access',
      pattern: /Property\s+'(.+)'\s+does\s+not\s+exist/g,
      suggestion: 'Add type assertion (as any) or check property existence'
    },
    {
      name: 'Null type issues',
      pattern: /Type\s+'null'\s+is\s+not\s+assignable/g,
      suggestion: 'Use optional chaining (?.) or nullish coalescing (??)'
    },
    {
      name: 'Dynamic table names',
      pattern: /\.from\(([a-zA-Z_]+)\)/g,
      suggestion: 'Add (supabase as any) for dynamic table names'
    }
  ];

  const allFiles = glob.sync('**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
  });

  additionalPatterns.forEach(({ name, pattern, suggestion }) => {
    let matchCount = 0;
    const matchedFiles = [];

    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(pattern);
      if (matches) {
        matchCount += matches.length;
        matchedFiles.push(file);
      }
    });

    if (matchCount > 0) {
      console.log(`⚠️  ${name}: ${matchCount} potential issues in ${matchedFiles.length} files`);
      console.log(`   Suggestion: ${suggestion}`);
    }
  });
}

// glob 패키지 확인 및 설치
function checkDependencies() {
  try {
    require('glob');
  } catch (error) {
    console.error('❌ Missing dependency: glob');
    console.log('📦 Installing glob...');
    require('child_process').execSync('npm install --save-dev glob', { stdio: 'inherit' });
    console.log('✅ glob installed successfully\n');
  }
}

// 실행
checkDependencies();
main().catch(console.error);