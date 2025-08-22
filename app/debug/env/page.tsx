// Environment Debug Page - For Production Debugging
import { ElevatedCard, getContainerClasses, getSectionClasses } from '@/components/ui'

export default function EnvDebug() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className={getContainerClasses()}>
        <div className="py-6">
          <div className={getSectionClasses()}>
            <ElevatedCard className="p-6">
              <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--text)' }}>Environment Debug</h1>
              
              <div className="grid gap-6">
                
                {/* Environment Variables Status */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Environment Variables</h2>
                  <div className="space-y-4">
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between">
                        <strong style={{ color: 'var(--text)' }}>NEXT_PUBLIC_SUPABASE_URL:</strong>
                        <span className={`px-2 py-1 rounded text-sm ${supabaseUrl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {supabaseUrl ? 'SET' : 'MISSING'}
                        </span>
                      </div>
                      <div className="p-3 rounded mt-2 font-mono text-sm break-all" style={{ backgroundColor: 'var(--muted-bg)' }}>
                        {supabaseUrl || 'Not set'}
                      </div>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between">
                        <strong style={{ color: 'var(--text)' }}>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
                        <span className={`px-2 py-1 rounded text-sm ${supabaseKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {supabaseKey ? 'SET' : 'MISSING'}
                        </span>
                      </div>
                      <div className="p-3 rounded mt-2 font-mono text-sm" style={{ backgroundColor: 'var(--muted-bg)' }}>
                        {supabaseKey ? `${supabaseKey.substring(0, 50)}...` : 'Not set'}
                      </div>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <strong style={{ color: 'var(--text)' }}>NODE_ENV:</strong>
                      <div className="p-3 rounded mt-2 font-mono text-sm" style={{ backgroundColor: 'var(--muted-bg)' }}>
                        {process.env.NODE_ENV}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Summary */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Configuration Status</h2>
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 ${supabaseUrl && supabaseKey ? 'text-green-600' : 'text-red-600'}`}>
                      <div className={`w-3 h-3 rounded-full ${supabaseUrl && supabaseKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">
                        {supabaseUrl && supabaseKey ? 'Configuration is complete' : 'Configuration is incomplete'}
                      </span>
                    </div>
                    
                    {(!supabaseUrl || !supabaseKey) && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <h3 className="font-semibold text-yellow-800">Missing Configuration:</h3>
                        <ul className="mt-2 text-yellow-700 text-sm">
                          {!supabaseUrl && <li>• NEXT_PUBLIC_SUPABASE_URL is not set</li>}
                          {!supabaseKey && <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY is not set</li>}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Connectivity */}
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Connection Test</h2>
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>
                    {supabaseUrl && supabaseKey ? (
                      <div className="space-y-2">
                        <p>✅ Environment variables are properly configured</p>
                        <p>🔗 Supabase URL: <code className="px-1 rounded" style={{ backgroundColor: 'var(--muted-bg)' }}>{supabaseUrl}</code></p>
                        <p>🔑 API Key: Configured and masked for security</p>
                      </div>
                    ) : (
                      <div className="text-red-600">
                        <p>❌ Missing required environment variables</p>
                        <p className="mt-2">Please check vercel.json env configuration or Vercel project environment variables.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ElevatedCard>
          </div>
        </div>
      </div>
    </div>
  )
}