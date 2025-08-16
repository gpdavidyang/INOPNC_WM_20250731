import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import * as Sentry from '@sentry/nextjs'
import { performanceTracker } from '@/lib/monitoring/performance-metrics'

// Direct access to environment variables for client-side
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Client-side validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables on client-side:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY
  })
}

// Query cache for optimizing repeated queries
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes default TTL

// Connection pool configuration
interface ClientConfig {
  enableQueryCache?: boolean
  enablePerformanceMonitoring?: boolean
  defaultCacheTTL?: number
  slowQueryThreshold?: number
}

const defaultConfig: ClientConfig = {
  enableQueryCache: true,
  enablePerformanceMonitoring: true,
  defaultCacheTTL: CACHE_TTL,
  slowQueryThreshold: 1000
}

// Enhanced client with monitoring and optimization
class EnhancedSupabaseClient {
  private client: ReturnType<typeof createBrowserClient<Database>>
  private config: ClientConfig

  constructor(config: ClientConfig = {}) {
    this.config = { ...defaultConfig, ...config }
    this.client = createBrowserClient<Database>(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!
    )
  }

  // Wrap queries with performance monitoring and caching
  from(table: keyof Database['public']['Tables']) {
    const originalFrom = this.client.from(table)
    
    return {
      ...originalFrom,
      select: (columns?: string) => {
        const query = originalFrom.select(columns)
        
        return this.wrapQueryBuilder(query, table, 'select', columns)
      },
      
      // Add monitoring to other operations
      insert: (values: any) => this.wrapMutation(originalFrom.insert(values), table, 'insert'),
      update: (values: any) => this.wrapMutation(originalFrom.update(values), table, 'update'),
      delete: () => this.wrapMutation(originalFrom.delete(), table, 'delete'),
      upsert: (values: any) => this.wrapMutation(originalFrom.upsert(values), table, 'upsert')
    }
  }

  // Wrap query builder with performance monitoring and caching
  private wrapQueryBuilder(query: any, table: string, operation: string, columns?: string) {
    if (!this.config.enablePerformanceMonitoring) {
      return query
    }

    const cacheKey = this.generateCacheKey(table, operation, columns)
    
    // Return a proxy that preserves all query builder methods
    return new Proxy(query, {
      get: (target, prop) => {
        // If it's a terminal method (then, catch, finally), wrap with monitoring
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return async (...args: any[]) => {
            const startTime = performance.now()
            
            return Sentry.startSpan({
              name: `Supabase ${operation}: ${table}`,
              op: 'db.query',
              attributes: {
                'db.table': table,
                'db.operation': operation,
                'db.columns': columns || '*'
              }
            }, async (span) => {
              try {
                // Check cache for SELECT operations
                if (operation === 'select' && this.config.enableQueryCache) {
                  const cached = this.getCachedQuery(cacheKey)
                  if (cached) {
                    performanceTracker.recordMetric('supabaseCacheHit', 1)
                    span.setAttribute('cache.hit', true)
                    return Promise.resolve(cached)
                  }
                }
                
                const result = await target[prop](...args)
                const duration = performance.now() - startTime
                
                performanceTracker.recordMetric('supabaseQueryTime', duration)
                span.setMeasurement?.('db.query.duration', duration, 'millisecond')
                
                if (duration > this.config.slowQueryThreshold!) {
                  Sentry.captureMessage(
                    `Slow Supabase ${operation}: ${table} took ${duration}ms`,
                    'warning'
                  )
                }
                
                // Cache successful SELECT results
                if (operation === 'select' && this.config.enableQueryCache && result?.data) {
                  this.setCachedQuery(cacheKey, result, this.config.defaultCacheTTL!)
                  performanceTracker.recordMetric('supabaseCacheMiss', 1)
                }
                
                return result
              } catch (error) {
                const duration = performance.now() - startTime
                span.setMeasurement?.('db.query.duration', duration, 'millisecond')
                
                Sentry.captureException(error, {
                  tags: { component: 'supabase-client' },
                  contexts: {
                    query: {
                      table,
                      operation,
                      columns,
                      duration
                    }
                  }
                })
                
                performanceTracker.recordMetric('supabaseQueryError', 1)
                throw error
              }
            })
          }
        }
        
        // For all other properties, return them as-is to preserve the query builder chain
        const value = target[prop]
        
        // If it's a function, wrap it to maintain the proxy chain
        if (typeof value === 'function') {
          return (...args: any[]) => {
            const result = value.apply(target, args)
            // If the result is chainable (has query builder methods), wrap it too
            if (result && typeof result === 'object' && 'then' in result) {
              return this.wrapQueryBuilder(result, table, operation, columns)
            }
            return result
          }
        }
        
        return value
      }
    })
  }

  // Wrap mutations with monitoring
  private wrapMutation(query: any, table: string, operation: string) {
    if (!this.config.enablePerformanceMonitoring) {
      return query
    }

    return {
      ...query,
      then: async (resolve: any, reject: any) => {
        const startTime = performance.now()
        
        return Sentry.startSpan({
          name: `Supabase ${operation}: ${table}`,
          op: 'db.mutation',
          attributes: {
            'db.table': table,
            'db.operation': operation
          }
        }, async (span) => {
          try {
            const result = await query
            const duration = performance.now() - startTime
            
            performanceTracker.recordMetric('supabaseMutationTime', duration)
            span.setMeasurement?.('db.mutation.duration', duration, 'millisecond')
            
            if (duration > this.config.slowQueryThreshold!) {
              Sentry.captureMessage(
                `Slow Supabase ${operation}: ${table} took ${duration}ms`,
                'warning'
              )
            }
            
            // Clear relevant cache entries after mutations
            if (this.config.enableQueryCache) {
              this.invalidateTableCache(table)
            }
            
            return resolve(result)
          } catch (error) {
            const duration = performance.now() - startTime
            span.setMeasurement?.('db.mutation.duration', duration, 'millisecond')
            
            Sentry.captureException(error, {
              tags: { component: 'supabase-client' },
              contexts: {
                mutation: {
                  table,
                  operation,
                  duration
                }
              }
            })
            
            performanceTracker.recordMetric('supabaseMutationError', 1)
            return reject(error)
          }
        })
      }
    }
  }

  // Auth methods with monitoring
  get auth() {
    return {
      ...this.client.auth,
      signInWithPassword: async (credentials: any) => {
        return performanceTracker.trackApiCall(
          'auth.signInWithPassword',
          () => this.client.auth.signInWithPassword(credentials)
        )
      },
      signUp: async (credentials: any) => {
        return performanceTracker.trackApiCall(
          'auth.signUp',
          () => this.client.auth.signUp(credentials)
        )
      },
      signOut: async () => {
        return performanceTracker.trackApiCall(
          'auth.signOut',
          () => this.client.auth.signOut()
        )
      },
      getSession: async () => {
        return performanceTracker.trackApiCall(
          'auth.getSession',
          () => this.client.auth.getSession()
        )
      },
      getUser: async () => {
        return performanceTracker.trackApiCall(
          'auth.getUser',
          () => this.client.auth.getUser()
        )
      },
      refreshSession: async (refreshToken?: string) => {
        return performanceTracker.trackApiCall(
          'auth.refreshSession',
          () => this.client.auth.refreshSession(refreshToken)
        )
      },
      onAuthStateChange: (callback: any) => {
        // This method doesn't need performance tracking as it's just setting up a listener
        return this.client.auth.onAuthStateChange(callback)
      }
    }
  }

  // Storage methods with monitoring
  get storage() {
    return {
      from: (bucket: string) => ({
        ...this.client.storage.from(bucket),
        upload: async (path: string, file: any, options?: any) => {
          return performanceTracker.trackApiCall(
            `storage.upload.${bucket}`,
            () => this.client.storage.from(bucket).upload(path, file, options)
          )
        }
      })
    }
  }

  // Cache management
  private generateCacheKey(table: string, operation: string, columns?: string): string {
    return `${table}:${operation}:${columns || '*'}`
  }

  private getCachedQuery(key: string) {
    const cached = queryCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      queryCache.delete(key)
      return null
    }
    
    return cached.data
  }

  private setCachedQuery(key: string, data: any, ttl: number) {
    queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private invalidateTableCache(table: string) {
    for (const [key] of queryCache) {
      if (key.startsWith(`${table}:`)) {
        queryCache.delete(key)
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: queryCache.size,
      entries: Array.from(queryCache.keys())
    }
  }

  // Clear cache manually
  clearCache(table?: string) {
    if (table) {
      this.invalidateTableCache(table)
    } else {
      queryCache.clear()
    }
  }

  // Access original client if needed
  get raw() {
    return this.client
  }
}

// Create singleton enhanced client
let enhancedClient: EnhancedSupabaseClient | null = null

export function createClient(config?: ClientConfig) {
  if (!enhancedClient) {
    enhancedClient = new EnhancedSupabaseClient(config)
  }
  return enhancedClient
}

// Export for direct access to raw client if needed
export function createRawClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!
  )
}