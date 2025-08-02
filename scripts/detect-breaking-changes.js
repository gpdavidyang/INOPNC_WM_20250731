const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

console.log(chalk.blue.bold('🔍 Breaking Change Detector'));
console.log(chalk.blue('===========================\n'));

// Define patterns that might indicate breaking changes
const breakingPatterns = [
  {
    name: 'Function signature changes',
    patterns: [
      /function\s+(\w+)\s*\([^)]*\)/g,
      /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      /export\s+(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g
    ],
    description: 'Detects changes in function parameters'
  },
  {
    name: 'Import path changes',
    patterns: [
      /from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /require\s*\(['"]([^'"]+)['"]\)/g
    ],
    description: 'Detects changes in import/require paths'
  },
  {
    name: 'Component prop changes',
    patterns: [
      /interface\s+(\w+Props)\s*{[^}]+}/g,
      /type\s+(\w+Props)\s*=\s*{[^}]+}/g
    ],
    description: 'Detects changes in React component props'
  },
  {
    name: 'Deprecated function usage',
    patterns: [
      /getTypographyClass\(/g,
      /size\s*=\s*["']default["']/g,
      /variant\s*=\s*["']destructive["']/g
    ],
    description: 'Detects usage of deprecated functions or values'
  }
];

// Function to analyze a file for potential breaking changes
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  breakingPatterns.forEach(({ name, patterns, description }) => {
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Count line numbers for each match
        const lines = content.split('\n');
        matches.forEach(match => {
          let lineNumber = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(match.replace(/\s+/g, ' ').substring(0, 30))) {
              lineNumber = i + 1;
              break;
            }
          }
          
          issues.push({
            type: name,
            match: match.substring(0, 60) + (match.length > 60 ? '...' : ''),
            line: lineNumber,
            description
          });
        });
      }
    });
  });
  
  return issues;
}

// Scan all TypeScript files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'scripts/**']
});

console.log(`Scanning ${files.length} files for potential breaking changes...\n`);

const allIssues = new Map();
let totalIssues = 0;

files.forEach(file => {
  const issues = analyzeFile(file);
  if (issues.length > 0) {
    allIssues.set(file, issues);
    totalIssues += issues.length;
  }
});

// Report findings
if (totalIssues === 0) {
  console.log(chalk.green('✅ No potential breaking changes detected!'));
} else {
  console.log(chalk.yellow(`⚠️  Found ${totalIssues} potential issues in ${allIssues.size} files:\n`));
  
  // Group by issue type
  const issuesByType = new Map();
  
  allIssues.forEach((issues, file) => {
    issues.forEach(issue => {
      if (!issuesByType.has(issue.type)) {
        issuesByType.set(issue.type, []);
      }
      issuesByType.get(issue.type).push({ file, ...issue });
    });
  });
  
  // Display grouped issues
  issuesByType.forEach((issues, type) => {
    console.log(chalk.yellow.bold(`\n${type} (${issues.length} occurrences):`));
    console.log(chalk.gray(issues[0].description));
    
    // Show first 5 examples
    issues.slice(0, 5).forEach(issue => {
      console.log(chalk.cyan(`  ${issue.file}:${issue.line}`));
      console.log(chalk.gray(`    ${issue.match}`));
    });
    
    if (issues.length > 5) {
      console.log(chalk.gray(`  ... and ${issues.length - 5} more`));
    }
  });
  
  // Provide recommendations
  console.log(chalk.blue.bold('\n📝 Recommendations:'));
  
  if (issuesByType.has('Deprecated function usage')) {
    console.log(chalk.blue('  1. Run "npm run fix:all" to automatically fix common issues'));
  }
  
  if (issuesByType.has('Function signature changes')) {
    console.log(chalk.blue('  2. Consider using adapter functions for backward compatibility'));
  }
  
  if (issuesByType.has('Import path changes')) {
    console.log(chalk.blue('  3. Update all import paths using "npm run fix:imports"'));
  }
  
  console.log(chalk.blue('  4. Add deprecation warnings to changed functions'));
  console.log(chalk.blue('  5. Document all breaking changes in CHANGELOG.md'));
}

// Generate report file if issues were found
if (totalIssues > 0) {
  const reportPath = path.join(process.cwd(), 'breaking-changes-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    filesWithIssues: allIssues.size,
    totalIssues: totalIssues,
    issuesByType: Object.fromEntries(
      Array.from(issuesByType.entries()).map(([type, issues]) => [
        type,
        {
          count: issues.length,
          examples: issues.slice(0, 3).map(({ file, line, match }) => ({ file, line, match }))
        }
      ])
    )
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(chalk.green(`\n📄 Detailed report saved to: ${reportPath}`));
}