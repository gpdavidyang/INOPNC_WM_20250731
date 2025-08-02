#!/usr/bin/env node

/**
 * Analyze test performance from Jest JSON output
 * Usage: node analyze-test-performance.js <test-results.json>
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SLOW_TEST_THRESHOLD = 5000; // 5 seconds
const VERY_SLOW_TEST_THRESHOLD = 10000; // 10 seconds

function analyzeTestPerformance(jsonFile) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
    
    // Collect all test results
    const allTests = [];
    
    data.testResults.forEach(suite => {
      suite.assertionResults.forEach(test => {
        allTests.push({
          suite: suite.name,
          testName: test.fullName,
          duration: test.duration || 0,
          status: test.status,
          failureMessages: test.failureMessages
        });
      });
    });
    
    // Sort by duration
    allTests.sort((a, b) => b.duration - a.duration);
    
    // Find slow tests
    const slowTests = allTests.filter(test => test.duration > SLOW_TEST_THRESHOLD);
    const verySlowTests = allTests.filter(test => test.duration > VERY_SLOW_TEST_THRESHOLD);
    
    // Calculate statistics
    const totalDuration = allTests.reduce((sum, test) => sum + test.duration, 0);
    const avgDuration = totalDuration / allTests.length;
    
    // Generate report
    console.log('=== Test Performance Analysis ===\n');
    
    console.log(`Total Tests: ${allTests.length}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Average Duration: ${avgDuration.toFixed(0)}ms`);
    console.log(`Slow Tests (>${SLOW_TEST_THRESHOLD}ms): ${slowTests.length}`);
    console.log(`Very Slow Tests (>${VERY_SLOW_TEST_THRESHOLD}ms): ${verySlowTests.length}\n`);
    
    if (verySlowTests.length > 0) {
      console.log('=== Very Slow Tests ===');
      verySlowTests.slice(0, 10).forEach((test, i) => {
        console.log(`${i + 1}. ${test.testName}`);
        console.log(`   Suite: ${test.suite}`);
        console.log(`   Duration: ${(test.duration / 1000).toFixed(2)}s`);
        console.log(`   Status: ${test.status}\n`);
      });
    }
    
    if (slowTests.length > 0) {
      console.log('=== Slow Tests ===');
      slowTests.slice(0, 20).forEach((test, i) => {
        if (test.duration <= VERY_SLOW_TEST_THRESHOLD) {
          console.log(`${i + 1}. ${test.testName}`);
          console.log(`   Duration: ${(test.duration / 1000).toFixed(2)}s`);
        }
      });
    }
    
    // Find test suites with highest total time
    const suiteStats = {};
    allTests.forEach(test => {
      const suiteName = test.suite;
      if (!suiteStats[suiteName]) {
        suiteStats[suiteName] = {
          count: 0,
          totalDuration: 0,
          slowTests: 0
        };
      }
      suiteStats[suiteName].count++;
      suiteStats[suiteName].totalDuration += test.duration;
      if (test.duration > SLOW_TEST_THRESHOLD) {
        suiteStats[suiteName].slowTests++;
      }
    });
    
    const sortedSuites = Object.entries(suiteStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalDuration - a.totalDuration);
    
    console.log('\n=== Slowest Test Suites ===');
    sortedSuites.slice(0, 10).forEach((suite, i) => {
      console.log(`${i + 1}. ${path.basename(suite.name)}`);
      console.log(`   Total Duration: ${(suite.totalDuration / 1000).toFixed(2)}s`);
      console.log(`   Test Count: ${suite.count}`);
      console.log(`   Avg Duration: ${(suite.totalDuration / suite.count).toFixed(0)}ms`);
      console.log(`   Slow Tests: ${suite.slowTests}\n`);
    });
    
    // Exit with error if too many slow tests
    if (verySlowTests.length > 5) {
      console.error('\n❌ Too many very slow tests detected!');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Error analyzing test performance:', error.message);
    process.exit(1);
  }
}

// Main execution
if (process.argv.length < 3) {
  console.error('Usage: node analyze-test-performance.js <test-results.json>');
  process.exit(1);
}

analyzeTestPerformance(process.argv[2]);