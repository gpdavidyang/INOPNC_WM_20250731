const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Auto Import Fixer');
console.log('===================\n');

// Common import fixes
const importFixes = [
  {
    name: 'Select component imports',
    pattern: /from ['"]@\/components\/ui\/select['"]/g,
    replacement: `from '@/components/ui/select-new'`,
    description: 'Fix Select component import path'
  },
  {
    name: 'Typography function',
    pattern: /getTypographyClass/g,
    replacement: 'getFullTypographyClass',
    description: 'Update typography function name'
  },
  {
    name: 'Button size props',
    pattern: /size=["']default["']/g,
    replacement: `size="standard"`,
    description: 'Fix Button size prop'
  },
  {
    name: 'Button size sm',
    pattern: /size=["']sm["']/g,
    replacement: `size="compact"`,
    description: 'Fix Button size sm to compact'
  },
  {
    name: 'Button size lg',
    pattern: /size=["']lg["']/g,
    replacement: `size="field"`,
    description: 'Fix Button size lg to field'
  },
  {
    name: 'Button variant destructive',
    pattern: /variant=["']destructive["']/g,
    replacement: `variant="danger"`,
    description: 'Fix Button variant destructive to danger'
  }
];

const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'scripts/**']
});

let totalFixes = 0;
let filesFixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  let fixes = [];
  
  importFixes.forEach(fix => {
    if (fix.pattern.test(content)) {
      const matches = content.match(fix.pattern);
      const count = matches ? matches.length : 0;
      
      content = content.replace(fix.pattern, fix.replacement);
      fixes.push(`  - ${fix.description} (${count} occurrences)`);
      totalFixes += count;
    }
  });
  
  // Special case: Fix getFullTypographyClass calls with wrong parameters
  const typographyPattern = /getFullTypographyClass\((['"`][\w-]+['"`]),\s*(\w+)\)/g;
  const typographyMatches = originalContent.match(typographyPattern);
  if (typographyMatches) {
    content = content.replace(typographyPattern, (match, size, isLargeFont) => {
      fixes.push(`  - Add 'body' category to getFullTypographyClass call`);
      totalFixes++;
      return `getFullTypographyClass('body', ${size}, ${isLargeFont})`;
    });
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    filesFixed++;
    console.log(`✅ Fixed: ${file}`);
    fixes.forEach(fix => console.log(fix));
    console.log('');
  }
});

console.log('===================');
console.log(`📊 Summary:`);
console.log(`   - Files scanned: ${files.length}`);
console.log(`   - Files fixed: ${filesFixed}`);
console.log(`   - Total fixes applied: ${totalFixes}`);
console.log('\n✨ Auto-fix complete!');