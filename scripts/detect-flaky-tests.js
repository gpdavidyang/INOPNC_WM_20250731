#!/usr/bin/env node

/**
 * Detect flaky tests by analyzing multiple test runs
 * Usage: node detect-flaky-tests.js test-run-*.json
 */

const fs = require('fs');
const path = require('path');

function detectFlakyTests(jsonFiles) {
  const testRuns = jsonFiles.map(file => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
      return null;
    }
  }).filter(Boolean);
  
  if (testRuns.length === 0) {
    console.error('No valid test result files found');
    process.exit(1);
  }
  
  // Collect test results across all runs
  const testResults = {};
  
  testRuns.forEach((run, runIndex) => {
    run.testResults.forEach(suite => {
      suite.assertionResults.forEach(test => {
        const testKey = `${suite.name}::${test.fullName}`;
        
        if (!testResults[testKey]) {
          testResults[testKey] = {
            suite: suite.name,
            testName: test.fullName,
            results: []
          };
        }
        
        testResults[testKey].results.push({
          runIndex: runIndex + 1,
          status: test.status,
          duration: test.duration || 0,
          failureMessages: test.failureMessages || []
        });
      });
    });
  });
  
  // Find flaky tests (tests with inconsistent results)
  const flakyTests = [];
  
  Object.values(testResults).forEach(test => {
    const statuses = test.results.map(r => r.status);
    const uniqueStatuses = [...new Set(statuses)];
    
    if (uniqueStatuses.length > 1) {
      const passCount = statuses.filter(s => s === 'passed').length;
      const failCount = statuses.filter(s => s === 'failed').length;
      
      flakyTests.push({
        ...test,
        passCount,
        failCount,
        flakiness: (failCount / test.results.length) * 100,
        durations: test.results.map(r => r.duration),
        failureMessages: test.results
          .filter(r => r.status === 'failed')
          .map(r => r.failureMessages)
          .flat()
      });
    }
  });
  
  // Sort by flakiness percentage
  flakyTests.sort((a, b) => b.flakiness - a.flakiness);
  
  // Generate report
  console.log('# Flaky Test Detection Report\n');
  console.log(`Analyzed ${testRuns.length} test runs\n`);
  
  if (flakyTests.length === 0) {
    console.log('✅ No flaky tests detected!\n');
    console.log('All tests passed consistently across all runs.');
  } else {
    console.log(`⚠️ Found ${flakyTests.length} flaky tests\n`);
    
    console.log('## Summary\n');
    console.log(`- Total flaky tests: ${flakyTests.length}`);
    console.log(`- Most flaky: ${flakyTests[0]?.flakiness.toFixed(1)}% failure rate`);
    console.log(`- Least flaky: ${flakyTests[flakyTests.length - 1]?.flakiness.toFixed(1)}% failure rate\n`);
    
    console.log('## Flaky Test Details\n');
    
    flakyTests.forEach((test, index) => {
      console.log(`### ${index + 1}. ${test.testName}\n`);
      console.log(`**Suite:** \`${path.basename(test.suite)}\``);
      console.log(`**Flakiness:** ${test.flakiness.toFixed(1)}% (Failed ${test.failCount}/${test.results.length} times)`);
      console.log(`**Pass/Fail Pattern:** ${test.results.map(r => r.status === 'passed' ? '✅' : '❌').join(' ')}`);
      
      // Duration variance
      const avgDuration = test.durations.reduce((a, b) => a + b, 0) / test.durations.length;
      const maxDuration = Math.max(...test.durations);
      const minDuration = Math.min(...test.durations);
      
      console.log(`**Duration Variance:** ${minDuration}ms - ${maxDuration}ms (avg: ${avgDuration.toFixed(0)}ms)`);
      
      // Failure messages
      if (test.failureMessages.length > 0) {
        console.log('\n**Failure Messages:**');
        const uniqueMessages = [...new Set(test.failureMessages)];
        uniqueMessages.slice(0, 3).forEach(msg => {
          console.log('```');
          console.log(msg.split('\n').slice(0, 5).join('\n'));
          console.log('```');
        });
      }
      
      console.log('\n---\n');
    });
    
    // Recommendations
    console.log('## Recommendations\n');
    console.log('1. **High Priority** (>50% failure rate):');
    const highPriority = flakyTests.filter(t => t.flakiness > 50);
    if (highPriority.length > 0) {
      highPriority.forEach(test => {
        console.log(`   - ${test.testName}`);
      });
    } else {
      console.log('   - None');
    }
    
    console.log('\n2. **Medium Priority** (20-50% failure rate):');
    const mediumPriority = flakyTests.filter(t => t.flakiness >= 20 && t.flakiness <= 50);
    if (mediumPriority.length > 0) {
      mediumPriority.forEach(test => {
        console.log(`   - ${test.testName}`);
      });
    } else {
      console.log('   - None');
    }
    
    console.log('\n3. **Common Causes to Check:**');
    console.log('   - Race conditions in async operations');
    console.log('   - Timing-dependent assertions');
    console.log('   - Shared state between tests');
    console.log('   - External dependencies (APIs, databases)');
    console.log('   - Random data generation');
  }
}

// Main execution
if (process.argv.length < 3) {
  console.error('Usage: node detect-flaky-tests.js test-run-*.json');
  process.exit(1);
}

const jsonFiles = process.argv.slice(2);
detectFlakyTests(jsonFiles);