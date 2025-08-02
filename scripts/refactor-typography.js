const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Typography Refactoring Tool');
console.log('==============================\n');

// 모든 TypeScript 파일에서 getTypographyClass 사용 찾기
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'scripts/**']
});

let totalChanges = 0;
let fileCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let changes = [];
  
  // Pattern 1: getTypographyClass(size, isLargeFont) → getFullTypographyClass('body', size, isLargeFont)
  content = content.replace(
    /getTypographyClass\((['"`][\w-]+['"`]),\s*(\w+)\)/g,
    (match, size, isLargeFont) => {
      changes.push(`  - ${match} → getFullTypographyClass('body', ${size}, ${isLargeFont})`);
      return `getFullTypographyClass('body', ${size}, ${isLargeFont})`;
    }
  );
  
  // Pattern 2: getTypographyClass with template literals
  content = content.replace(
    /getTypographyClass\(\`([^`]+)\`,\s*(\w+)\)/g,
    (match, size, isLargeFont) => {
      changes.push(`  - ${match} → getFullTypographyClass('body', \`${size}\`, ${isLargeFont})`);
      return `getFullTypographyClass('body', \`${size}\`, ${isLargeFont})`;
    }
  );
  
  // Pattern 3: Import statement update
  if (content.includes("from '@/contexts/FontSizeContext'")) {
    content = content.replace(
      /import\s*\{([^}]*)\}\s*from\s*['"]@\/contexts\/FontSizeContext['"]/g,
      (match, imports) => {
        const importList = imports.split(',').map(s => s.trim());
        const hasGetTypography = importList.includes('getTypographyClass');
        const hasGetFullTypography = importList.includes('getFullTypographyClass');
        
        if (hasGetTypography && !hasGetFullTypography) {
          const newImportList = importList.map(imp => 
            imp === 'getTypographyClass' ? 'getFullTypographyClass' : imp
          );
          const newImports = newImportList.join(', ');
          changes.push(`  - Import: getTypographyClass → getFullTypographyClass`);
          return `import { ${newImports} } from '@/contexts/FontSizeContext'`;
        }
        return match;
      }
    );
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    fileCount++;
    totalChanges += changes.length;
    console.log(`✅ Updated: ${file}`);
    changes.forEach(change => console.log(change));
    console.log('');
  }
});

console.log('==============================');
console.log(`📊 Summary:`);
console.log(`   - Files scanned: ${files.length}`);
console.log(`   - Files updated: ${fileCount}`);
console.log(`   - Total changes: ${totalChanges}`);
console.log('\n✨ Typography refactoring complete!');