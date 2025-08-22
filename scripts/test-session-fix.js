#!/usr/bin/env node

/**
 * Test script to verify session persistence fix
 * This tests the complete flow:
 * 1. Login
 * 2. Session sync  
 * 3. Session bridge
 * 4. Verify session is accessible
 */

const https = require('https')
const http = require('http')

const BASE_URL = 'http://localhost:3001'

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const protocol = url.protocol === 'https:' ? https : http
    
    const req = protocol.request(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json, headers: res.headers })
        } catch {
          resolve({ status: res.statusCode, data, headers: res.headers })
        }
      })
    })
    
    req.on('error', reject)
    
    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    
    req.end()
  })
}

async function testSessionFlow() {
  log('\n=== Testing Session Persistence Fix ===\n', 'blue')
  
  try {
    // Step 1: Check initial session status
    log('1. Checking initial session status...', 'yellow')
    const initialCheck = await makeRequest('/api/auth/sync-session', {
      method: 'GET'
    })
    
    if (initialCheck.data.hasSession) {
      log(`   ✓ Session already exists for: ${initialCheck.data.userEmail}`, 'green')
      return
    } else {
      log('   × No initial session found', 'red')
    }
    
    // Step 2: Perform login (simulate client-side login)
    log('\n2. Simulating client-side login...', 'yellow')
    // Note: This would normally be done through Supabase client
    // For testing, we'll just verify the sync endpoint works
    
    // Step 3: Test session sync endpoint
    log('\n3. Testing session sync endpoint...', 'yellow')
    
    // Simulate having tokens (in real scenario these come from Supabase auth)
    const testTokens = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token'
    }
    
    const syncResult = await makeRequest('/api/auth/sync-session', {
      method: 'POST',
      body: testTokens
    })
    
    if (syncResult.status === 200 && syncResult.data.success) {
      log('   ✓ Session sync successful', 'green')
    } else {
      log(`   × Session sync failed: ${syncResult.data.error || 'Unknown error'}`, 'red')
    }
    
    // Step 4: Test bridge session endpoint
    log('\n4. Testing session bridge endpoint...', 'yellow')
    
    const bridgeResult = await makeRequest('/api/auth/bridge-session', {
      method: 'POST'
    })
    
    if (bridgeResult.status === 200 && bridgeResult.data.session) {
      log('   ✓ Session bridge successful', 'green')
      log(`   User: ${bridgeResult.data.session.user?.email}`, 'blue')
    } else {
      log(`   × Session bridge failed: ${bridgeResult.data.error || 'Unknown error'}`, 'red')
    }
    
    // Step 5: Verify session is accessible
    log('\n5. Verifying session is accessible...', 'yellow')
    
    const finalCheck = await makeRequest('/api/auth/sync-session', {
      method: 'GET'
    })
    
    if (finalCheck.data.hasSession && finalCheck.data.hasUser) {
      log('   ✓ Session is accessible!', 'green')
      log(`   User: ${finalCheck.data.userEmail}`, 'blue')
      log('\n✓ Session persistence fix is working correctly!', 'green')
    } else {
      log('   × Session not accessible after bridge', 'red')
      log('   Session errors:', 'yellow')
      if (finalCheck.data.sessionError) {
        log(`   - Session: ${finalCheck.data.sessionError}`, 'red')
      }
      if (finalCheck.data.userError) {
        log(`   - User: ${finalCheck.data.userError}`, 'red')
      }
    }
    
  } catch (error) {
    log(`\n× Test failed with error: ${error.message}`, 'red')
    console.error(error)
  }
}

// Run the test
testSessionFlow().catch(console.error)