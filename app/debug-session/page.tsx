'use client'

import { ElevatedCard, getContainerClasses, getSectionClasses, PrimaryButton, SecondaryButton } from '@/components/ui'
import { createClient, forceSessionRefresh, resetClient } from '@/lib/supabase/client'
import { bridgeSession, ensureClientSession } from '@/lib/supabase/session-bridge'
import { useEffect, useState } from 'react'

export default function DebugSessionPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[DEBUG-SESSION] ${message}`)
  }

  const checkClientSession = async () => {
    setIsLoading(true)
    addLog('Checking client session...')
    
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      addLog(`❌ Error getting session: ${error.message}`)
    } else if (session) {
      addLog(`✅ Session found: ${session.user?.email}`)
      addLog(`   Access token: ${session.access_token?.substring(0, 20)}...`)
      addLog(`   Expires at: ${new Date(session.expires_at! * 1000).toLocaleString()}`)
    } else {
      addLog('❌ No session found')
    }
    
    setIsLoading(false)
  }

  const checkCookies = () => {
    addLog('Checking cookies...')
    const cookies = document.cookie.split(';')
    const authCookies = cookies.filter(c => c.includes('sb-'))
    
    if (authCookies.length > 0) {
      addLog(`Found ${authCookies.length} Supabase cookies:`)
      authCookies.forEach(cookie => {
        const [name] = cookie.trim().split('=')
        addLog(`   ${name}`)
      })
    } else {
      addLog('❌ No Supabase cookies found')
    }
  }

  const performBridgeSession = async () => {
    setIsLoading(true)
    addLog('Starting session bridge...')
    
    const result = await bridgeSession()
    
    if (result.success) {
      addLog(`✅ Bridge successful: ${result.session?.user?.email}`)
      
      // Wait a bit for cookies to propagate
      addLog('Waiting for cookie propagation...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if session is now available
      await checkClientSession()
    } else {
      addLog(`❌ Bridge failed: ${result.error}`)
    }
    
    setIsLoading(false)
  }

  const performEnsureSession = async () => {
    setIsLoading(true)
    addLog('Ensuring client session...')
    
    const result = await ensureClientSession()
    
    if (result.success) {
      addLog(`✅ Session ensured: ${result.session?.user?.email}`)
    } else {
      addLog(`❌ Ensure failed: ${result.error}`)
    }
    
    setIsLoading(false)
  }

  const performResetClient = async () => {
    setIsLoading(true)
    addLog('Resetting client singleton...')
    
    resetClient()
    addLog('Client reset complete')
    
    // Check session with fresh client
    await checkClientSession()
    
    setIsLoading(false)
  }

  const performForceRefresh = async () => {
    setIsLoading(true)
    addLog('Forcing session refresh...')
    
    const result = await forceSessionRefresh()
    
    if (result.success) {
      addLog(`✅ Refresh successful: ${result.session?.user?.email}`)
    } else {
      addLog(`❌ Refresh failed: ${result.error}`)
    }
    
    setIsLoading(false)
  }

  const checkServerSession = async () => {
    setIsLoading(true)
    addLog('Checking server session...')
    
    try {
      const response = await fetch('/api/auth/sync-session', {
        method: 'GET',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        addLog(`Server session status:`)
        addLog(`   Has session: ${data.hasSession}`)
        addLog(`   Has user: ${data.hasUser}`)
        addLog(`   User email: ${data.userEmail || 'N/A'}`)
        
        if (data.sessionError) {
          addLog(`   Session error: ${data.sessionError}`)
        }
        if (data.userError) {
          addLog(`   User error: ${data.userError}`)
        }
      } else {
        addLog(`❌ Server check failed: ${data.error}`)
      }
    } catch (error) {
      addLog(`❌ Server check error: ${error}`)
    }
    
    setIsLoading(false)
  }

  const performManualLogin = async () => {
    setIsLoading(true)
    addLog('Performing manual login...')
    
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'manager@inopnc.com',
      password: 'password123'
    })
    
    if (error) {
      addLog(`❌ Login failed: ${error.message}`)
    } else if (data.session) {
      addLog(`✅ Login successful: ${data.user?.email}`)
      addLog(`   Access token: ${data.session.access_token?.substring(0, 20)}...`)
      
      // Wait for auth state change to propagate
      addLog('Waiting for auth state change...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if session is available
      await checkClientSession()
    }
    
    setIsLoading(false)
  }

  const clearLogs = () => {
    setLogs([])
  }

  useEffect(() => {
    // Initial checks
    checkCookies()
    checkClientSession()
    checkServerSession()
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className={getContainerClasses()}>
        <div className="py-6">
          <div className={getSectionClasses()}>
            <ElevatedCard className="p-6">
              <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Session Debug Tool</h1>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <PrimaryButton
                  onClick={checkClientSession}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Check Client Session
                </PrimaryButton>
                
                <PrimaryButton
                  onClick={checkServerSession}
                  disabled={isLoading}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Check Server Session
                </PrimaryButton>
                
                <PrimaryButton
                  onClick={checkCookies}
                  disabled={isLoading}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Check Cookies
                </PrimaryButton>
                
                <PrimaryButton
                  onClick={performBridgeSession}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Bridge Session
                </PrimaryButton>
                
                <PrimaryButton
                  onClick={performEnsureSession}
                  disabled={isLoading}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  Ensure Session
                </PrimaryButton>
                
                <PrimaryButton
                  onClick={performResetClient}
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Reset Client
                </PrimaryButton>
                
                <PrimaryButton
                  onClick={performForceRefresh}
                  disabled={isLoading}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  Force Refresh
                </PrimaryButton>
                
                <PrimaryButton
                  onClick={performManualLogin}
                  disabled={isLoading}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  Manual Login
                </PrimaryButton>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Logs</h2>
                <SecondaryButton
                  onClick={clearLogs}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Clear Logs
                </SecondaryButton>
              </div>
              
              <div className="p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm" style={{ backgroundColor: 'var(--muted-bg)', color: 'var(--text)' }}>
                {logs.length === 0 ? (
                  <div style={{ color: 'var(--muted)' }}>No logs yet...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
              
              {isLoading && (
                <div className="mt-4 text-center" style={{ color: 'var(--muted)' }}>
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--text)' }}></div>
                  <span className="ml-2">Processing...</span>
                </div>
              )}
            </ElevatedCard>
          </div>
        </div>
      </div>
    </div>
  )
}