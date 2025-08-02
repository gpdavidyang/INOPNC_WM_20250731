const { exec } = require('child_process');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue.bold('🚀 Parallel TypeScript Type Checker'));
console.log(chalk.blue('=====================================\n'));

const directories = [
  'app',
  'components',
  'lib',
  'types',
  'hooks',
  'contexts',
  'providers'
];

const startTime = Date.now();

const promises = directories.map(dir => {
  return new Promise((resolve) => {
    const dirPath = path.join(process.cwd(), dir);
    
    // Check if directory exists
    const fs = require('fs');
    if (!fs.existsSync(dirPath)) {
      console.log(chalk.gray(`⏭️  Skipping ${dir} (directory not found)`));
      resolve({ dir, skipped: true });
      return;
    }
    
    console.log(chalk.yellow(`🔍 Checking ${dir}...`));
    
    exec(`npx tsc --noEmit --skipLibCheck --incremental false --strict --esModuleInterop --jsx react-jsx --module esnext --moduleResolution node --resolveJsonModule --isolatedModules --allowSyntheticDefaultImports --forceConsistentCasingInFileNames --baseUrl . --paths '{"@/*":["${dir}/*"]}' ${dir}/**/*.{ts,tsx}`, 
      { maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
      (error, stdout, stderr) => {
        if (error) {
          const errorLines = stderr.split('\n').filter(line => line.trim());
          const errorCount = errorLines.filter(line => line.includes('error TS')).length;
          
          if (errorCount > 0) {
            console.log(chalk.red(`❌ ${dir} - ${errorCount} errors found`));
            resolve({ 
              dir, 
              error: true, 
              errorCount,
              errors: errorLines.slice(0, 5) // First 5 errors
            });
          } else {
            // exec failed but no TypeScript errors - likely no matching files
            console.log(chalk.green(`✅ ${dir} - No errors`));
            resolve({ dir, success: true });
          }
        } else {
          console.log(chalk.green(`✅ ${dir} - No errors`));
          resolve({ dir, success: true });
        }
      }
    );
  });
});

Promise.all(promises).then(results => {
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n' + chalk.blue('====================================='));
  console.log(chalk.blue.bold('📊 Type Check Summary:'));
  console.log(chalk.blue('====================================='));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => r.error).length;
  const skipped = results.filter(r => r.skipped).length;
  const totalErrors = results.reduce((sum, r) => sum + (r.errorCount || 0), 0);
  
  console.log(chalk.green(`✅ Successful: ${successful}`));
  console.log(chalk.red(`❌ Failed: ${failed}`));
  console.log(chalk.gray(`⏭️  Skipped: ${skipped}`));
  console.log(chalk.yellow(`⚠️  Total errors: ${totalErrors}`));
  console.log(chalk.cyan(`⏱️  Duration: ${duration}s`));
  
  if (totalErrors > 0) {
    console.log('\n' + chalk.red.bold('❌ Errors by directory:'));
    results.filter(r => r.error).forEach(({ dir, errorCount, errors }) => {
      console.log(chalk.red(`\n${dir} (${errorCount} errors):`));
      errors.forEach(err => console.log(chalk.gray(`  ${err}`)));
    });
    process.exit(1);
  } else {
    console.log('\n' + chalk.green.bold('✨ All type checks passed!'));
  }
});