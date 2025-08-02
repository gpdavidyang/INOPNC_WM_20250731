/**
 * Comprehensive Supabase mocking utilities
 * Provides consistent mocks for Supabase client across all tests
 */

import { createMockProfile } from './test-utils'

// Mock Supabase client structure
export const createMockSupabaseClient = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    rangeGt: jest.fn().mockReturnThis(),
    rangeGte: jest.fn().mockReturnThis(),
    rangeLt: jest.fn().mockReturnThis(),
    rangeLte: jest.fn().mockReturnThis(),
    rangeAdjacent: jest.fn().mockReturnThis(),
    overlaps: jest.fn().mockReturnThis(),
    textSearch: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    csv: jest.fn().mockResolvedValue({ data: '', error: null }),
    geojson: jest.fn().mockResolvedValue({ data: null, error: null }),
    explain: jest.fn().mockResolvedValue({ data: null, error: null }),
    rollback: jest.fn().mockResolvedValue({ data: null, error: null }),
    returns: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  }

  const mockAuth = {
    getSession: jest.fn().mockResolvedValue({
      data: { 
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: createMockProfile(),
        }
      },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({
      data: { user: createMockProfile() },
      error: null,
    }),
    signUp: jest.fn().mockResolvedValue({
      data: { user: createMockProfile(), session: null },
      error: null,
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { 
        user: createMockProfile(),
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: createMockProfile(),
        }
      },
      error: null,
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
    updateUser: jest.fn().mockResolvedValue({
      data: { user: createMockProfile() },
      error: null,
    }),
    setSession: jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    refreshSession: jest.fn().mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  }

  const mockStorage = {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'mock-file-path' },
        error: null,
      }),
      download: jest.fn().mockResolvedValue({
        data: new Blob(['mock file content']),
        error: null,
      }),
      remove: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      list: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://mock-storage-url.com/file' },
      }),
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://mock-signed-url.com/file' },
        error: null,
      }),
    }),
  }

  const mockRealtime = {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue(Promise.resolve('SUBSCRIBED')),
      unsubscribe: jest.fn().mockReturnValue(Promise.resolve('UNSUBSCRIBED')),
      send: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
    removeAllChannels: jest.fn(),
    getChannels: jest.fn().mockReturnValue([]),
  }

  return {
    from: jest.fn().mockReturnValue(mockQuery),
    auth: mockAuth,
    storage: mockStorage,
    realtime: mockRealtime,
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    channel: mockRealtime.channel,
    removeChannel: mockRealtime.removeChannel,
    removeAllChannels: mockRealtime.removeAllChannels,
    getChannels: mockRealtime.getChannels,
  }
}

// Global mock Supabase client instance
export const mockSupabase = createMockSupabaseClient()

// Helper to reset all Supabase mocks
export const resetSupabaseMocks = () => {
  jest.clearAllMocks()
  
  // Reset query mock to default successful responses
  const mockQuery = mockSupabase.from() as any
  mockQuery.then.mockResolvedValue({ data: [], error: null })
  mockQuery.single.mockResolvedValue({ data: null, error: null })
  mockQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
  
  // Reset auth mock to default successful responses
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { 
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: createMockProfile(),
      }
    },
    error: null,
  })
  
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: createMockProfile() },
    error: null,
  })
}

// Helper to mock authentication state
export const mockAuthenticatedUser = (user = createMockProfile()) => {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { 
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user,
      }
    },
    error: null,
  })
  
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  })
}

// Helper to mock unauthenticated state
export const mockUnauthenticatedUser = () => {
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  })
  
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  })
}

// Helper to mock specific table responses
export const mockTableResponse = (tableName: string, data: any[], error: any = null) => {
  const mockQuery = mockSupabase.from(tableName) as any
  mockQuery.then.mockResolvedValue({ data, error })
  return mockQuery
}

// Helper to mock database errors
export const mockDatabaseError = (tableName: string, errorMessage: string) => {
  const mockQuery = mockSupabase.from(tableName) as any
  mockQuery.then.mockResolvedValue({
    data: null,
    error: {
      message: errorMessage,
      details: 'Mock database error for testing',
      hint: null,
      code: '42P01',
    },
  })
  return mockQuery
}

// Helper to mock insert operations
export const mockInsertOperation = (tableName: string, insertedData: any) => {
  const mockQuery = mockSupabase.from(tableName) as any
  mockQuery.insert.mockReturnThis()
  mockQuery.select.mockReturnThis()
  mockQuery.single.mockResolvedValue({ data: insertedData, error: null })
  return mockQuery
}

// Helper to mock update operations
export const mockUpdateOperation = (tableName: string, updatedData: any) => {
  const mockQuery = mockSupabase.from(tableName) as any
  mockQuery.update.mockReturnThis()
  mockQuery.eq.mockReturnThis()
  mockQuery.select.mockReturnThis()
  mockQuery.single.mockResolvedValue({ data: updatedData, error: null })
  return mockQuery
}

// Helper to mock delete operations
export const mockDeleteOperation = (tableName: string) => {
  const mockQuery = mockSupabase.from(tableName) as any
  mockQuery.delete.mockReturnThis()
  mockQuery.eq.mockReturnThis()
  mockQuery.then.mockResolvedValue({ data: null, error: null })
  return mockQuery
}

// Mock Supabase client module
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}))