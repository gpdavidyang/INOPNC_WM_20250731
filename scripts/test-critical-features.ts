#!/usr/bin/env npx tsx

/**
 * Critical Features Test
 * 이 테스트는 핵심 기능이 변경되지 않았는지 확인합니다.
 */

import { createClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

const criticalTests = [
  {
    name: 'Supabase Server Cookie Handling',
    file: 'lib/supabase/server.ts',
    test: () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'lib/supabase/server.ts'),
        'utf-8'
      )
      
      // 필수 패턴 체크
      const requiredPatterns = [
        'getAll()',
        'setAll(cookiesToSet)',
        'try {',
        'catch',
        'sameSite: \'lax\'',
        'secure: process.env.NODE_ENV === \'production\'',
        'httpOnly: true'
      ]
      
      const missing = requiredPatterns.filter(pattern => !content.includes(pattern))
      
      if (missing.length > 0) {
        throw new Error(`Missing critical patterns: ${missing.join(', ')}`)
      }
      
      return true
    }
  },
  {
    name: 'Auth Actions No Redirect',
    file: 'app/auth/actions.ts',
    test: () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'app/auth/actions.ts'),
        'utf-8'
      )
      
      // redirect가 없어야 함
      if (content.includes('redirect(') && !content.includes('// redirect(')) {
        throw new Error('Server actions should not use redirect()')
      }
      
      // success 반환 확인
      if (!content.includes('return { success: true }')) {
        throw new Error('Server actions should return { success: true }')
      }
      
      return true
    }
  },
  {
    name: 'Middleware Session Handling',
    file: 'middleware.ts',
    test: () => {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'middleware.ts'),
        'utf-8'
      )
      
      const requiredPatterns = [
        'getUser()',
        'refreshSession()',
        'publicPaths',
        'try {',
        'catch'
      ]
      
      const missing = requiredPatterns.filter(pattern => !content.includes(pattern))
      
      if (missing.length > 0) {
        throw new Error(`Missing critical patterns: ${missing.join(', ')}`)
      }
      
      return true
    }
  }
]

console.log('🔍 Running critical features test...\n')

let passed = 0
let failed = 0

for (const test of criticalTests) {
  try {
    test.test()
    console.log(`✅ ${test.name}`)
    passed++
  } catch (error) {
    console.log(`❌ ${test.name}`)
    console.log(`   ${(error as Error).message || error}`)
    failed++
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.log('\n⚠️  Critical features have been modified!')
  console.log('Please review changes carefully.')
  process.exit(1)
}

console.log('\n✅ All critical features intact!')
process.exit(0)