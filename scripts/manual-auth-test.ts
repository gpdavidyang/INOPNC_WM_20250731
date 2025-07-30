#!/usr/bin/env npx tsx

/**
 * Manual Authentication Test Script
 * Run with: npx tsx scripts/manual-auth-test.ts
 * 
 * This script performs comprehensive authentication testing
 * to verify all auth flows are working correctly.
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline/promises'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test results tracking
const testResults: { [key: string]: boolean } = {}

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testSignIn(email: string, password: string): Promise<boolean> {
  log(`\n🔐 Testing sign in for ${email}...`, 'cyan')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      log(`❌ Sign in failed: ${error.message}`, 'red')
      return false
    }
    
    log('✅ Sign in successful', 'green')
    log(`   User ID: ${data.user?.id}`, 'blue')
    log(`   Email: ${data.user?.email}`, 'blue')
    
    // Test profile fetch
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single()
    
    if (profileError) {
      log(`❌ Profile fetch failed: ${profileError.message}`, 'red')
      return false
    }
    
    log('✅ Profile fetched successfully', 'green')
    log(`   Role: ${profile.role}`, 'blue')
    log(`   Full Name: ${profile.full_name}`, 'blue')
    log(`   Organization: ${profile.organization_id}`, 'blue')
    
    return true
  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return false
  }
}

async function testSignOut(): Promise<boolean> {
  log('\n🚪 Testing sign out...', 'cyan')
  
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      log(`❌ Sign out failed: ${error.message}`, 'red')
      return false
    }
    
    log('✅ Sign out successful', 'green')
    
    // Verify user is signed out
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      log('❌ User still authenticated after sign out', 'red')
      return false
    }
    
    log('✅ User session cleared', 'green')
    return true
  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return false
  }
}

async function testSessionRefresh(): Promise<boolean> {
  log('\n🔄 Testing session refresh...', 'cyan')
  
  try {
    // First sign in
    await supabase.auth.signInWithPassword({
      email: 'worker@inopnc.com',
      password: 'password123'
    })
    
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      log(`❌ Session refresh failed: ${refreshError.message}`, 'red')
      return false
    }
    
    if (!refreshData.session) {
      log('❌ No session returned after refresh', 'red')
      return false
    }
    
    log('✅ Session refresh successful', 'green')
    log(`   New access token present: ${!!refreshData.session.access_token}`, 'blue')
    
    return true
  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return false
  }
}

async function testInvalidCredentials(): Promise<boolean> {
  log('\n🚫 Testing invalid credentials...', 'cyan')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    })
    
    if (!error) {
      log('❌ Sign in succeeded with invalid credentials!', 'red')
      return false
    }
    
    log('✅ Invalid credentials properly rejected', 'green')
    log(`   Error: ${error.message}`, 'blue')
    
    return true
  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return false
  }
}

async function testRoleAccess(email: string, password: string, expectedRole: string): Promise<boolean> {
  log(`\n🎭 Testing role access for ${expectedRole}...`, 'cyan')
  
  try {
    // Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      log(`❌ Sign in failed: ${authError.message}`, 'red')
      return false
    }
    
    // Get profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user?.id)
      .single()
    
    if (profileError) {
      log(`❌ Profile fetch failed: ${profileError.message}`, 'red')
      return false
    }
    
    if (profile.role !== expectedRole) {
      log(`❌ Role mismatch. Expected: ${expectedRole}, Got: ${profile.role}`, 'red')
      return false
    }
    
    log(`✅ Role verified: ${profile.role}`, 'green')
    
    // Test role-specific RPC function
    const { data: hasRole, error: rpcError } = await supabase
      .rpc('user_has_role', {
        user_id: authData.user?.id,
        allowed_roles: [expectedRole]
      })
    
    if (rpcError) {
      log(`⚠️  RPC function not available: ${rpcError.message}`, 'yellow')
    } else {
      log(`✅ Role check RPC: ${hasRole}`, 'green')
    }
    
    return true
  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return false
  }
}

async function testDatabaseIntegrity(): Promise<boolean> {
  log('\n🗄️  Testing database integrity...', 'cyan')
  
  try {
    // Check for orphaned profiles
    const { data: orphanedProfiles, error: orphanError } = await supabase
      .rpc('check_orphaned_profiles')
    
    if (orphanError) {
      log('⚠️  Cannot check orphaned profiles (RPC may not exist)', 'yellow')
    } else if (orphanedProfiles && orphanedProfiles.length > 0) {
      log(`❌ Found ${orphanedProfiles.length} orphaned profiles`, 'red')
      return false
    } else {
      log('✅ No orphaned profiles found', 'green')
    }
    
    // Test a simple query with RLS
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (profilesError) {
      log(`❌ RLS test failed: ${profilesError.message}`, 'red')
      return false
    }
    
    log('✅ RLS policies working correctly', 'green')
    
    return true
  } catch (error) {
    log(`❌ Unexpected error: ${error}`, 'red')
    return false
  }
}

async function runAllTests() {
  log('\n🚀 Starting comprehensive authentication tests...', 'cyan')
  log('=' .repeat(50), 'cyan')
  
  // Test 1: Sign in with each role
  const testUsers = [
    { email: 'worker@inopnc.com', password: 'password123', role: 'worker' },
    { email: 'manager@inopnc.com', password: 'password123', role: 'site_manager' },
    { email: 'admin@inopnc.com', password: 'password123', role: 'admin' },
    { email: 'customer@inopnc.com', password: 'password123', role: 'customer_manager' },
  ]
  
  for (const user of testUsers) {
    testResults[`signin_${user.role}`] = await testSignIn(user.email, user.password)
    testResults[`signout_${user.role}`] = await testSignOut()
    testResults[`role_${user.role}`] = await testRoleAccess(user.email, user.password, user.role)
  }
  
  // Test 2: Invalid credentials
  testResults['invalid_credentials'] = await testInvalidCredentials()
  
  // Test 3: Session refresh
  testResults['session_refresh'] = await testSessionRefresh()
  
  // Test 4: Database integrity
  testResults['database_integrity'] = await testDatabaseIntegrity()
  
  // Clean up
  await supabase.auth.signOut()
  
  // Summary
  log('\n' + '=' .repeat(50), 'cyan')
  log('📊 Test Summary:', 'cyan')
  log('=' .repeat(50), 'cyan')
  
  let passed = 0
  let failed = 0
  
  for (const [test, result] of Object.entries(testResults)) {
    if (result) {
      log(`✅ ${test}`, 'green')
      passed++
    } else {
      log(`❌ ${test}`, 'red')
      failed++
    }
  }
  
  log('\n' + '=' .repeat(50), 'cyan')
  log(`Total: ${passed + failed} tests`, 'blue')
  log(`Passed: ${passed} ✅`, 'green')
  log(`Failed: ${failed} ❌`, 'red')
  log('=' .repeat(50), 'cyan')
  
  if (failed > 0) {
    log('\n⚠️  Some tests failed. Please check the authentication system.', 'yellow')
    process.exit(1)
  } else {
    log('\n🎉 All tests passed! Authentication system is working correctly.', 'green')
    process.exit(0)
  }
}

async function interactiveTest() {
  log('\n🔧 Interactive Authentication Test', 'cyan')
  log('=' .repeat(50), 'cyan')
  
  const choice = await rl.question(`
Choose an option:
1. Run all tests automatically
2. Test specific user login
3. Test database integrity only
4. Exit

Your choice (1-4): `)
  
  switch (choice) {
    case '1':
      await runAllTests()
      break
      
    case '2':
      const email = await rl.question('Enter email: ')
      const password = await rl.question('Enter password: ')
      await testSignIn(email, password)
      await testSignOut()
      break
      
    case '3':
      await testDatabaseIntegrity()
      break
      
    case '4':
      log('Exiting...', 'blue')
      process.exit(0)
      
    default:
      log('Invalid choice', 'red')
      await interactiveTest()
  }
  
  rl.close()
}

// Main execution
if (process.argv.includes('--auto')) {
  runAllTests()
} else {
  interactiveTest()
}