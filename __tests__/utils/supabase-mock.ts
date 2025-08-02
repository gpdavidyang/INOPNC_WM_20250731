/**
 * Supabase Mock Utilities
 * Standardized mocking for Supabase client operations across all tests
 */

interface MockQueryResult {
  data?: any
  error?: any
}

interface MockQueryBuilder {
  select: jest.Mock
  update: jest.Mock
  upsert: jest.Mock
  insert: jest.Mock
  delete: jest.Mock
  eq: jest.Mock
  neq: jest.Mock
  gt: jest.Mock
  gte: jest.Mock
  lt: jest.Mock
  lte: jest.Mock
  like: jest.Mock
  ilike: jest.Mock
  is: jest.Mock
  in: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
}

export interface MockSupabaseClient {
  auth: {
    signInWithPassword: jest.Mock
    signUp: jest.Mock
    signOut: jest.Mock
    getUser: jest.Mock
    getSession: jest.Mock
    onAuthStateChange: jest.Mock
  }
  from: jest.Mock
  rpc: jest.Mock
  storage: {
    from: jest.Mock
  }
}

/**
 * Creates a fresh mock query builder with all methods
 */
export const createMockQueryBuilder = (): MockQueryBuilder => {
  const builder = {
    select: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    like: jest.fn(),
    ilike: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  }

  // Set up chaining for all methods to return builder
  Object.keys(builder).forEach(key => {
    if (key !== 'single' && key !== 'maybeSingle') {
      builder[key as keyof MockQueryBuilder].mockReturnValue(builder)
    }
  })

  // Set up default resolved values for terminal methods
  builder.single.mockResolvedValue({ data: null, error: null })
  builder.maybeSingle.mockResolvedValue({ data: null, error: null })

  return builder
}

/**
 * Creates a complete mock Supabase client
 */
export const createMockSupabaseClient = (): MockSupabaseClient => ({
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
  },
  from: jest.fn(() => createMockQueryBuilder()),
  rpc: jest.fn(),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
      getPublicUrl: jest.fn(),
      createSignedUrl: jest.fn(),
    })),
  },
})

/**
 * Mock successful auth responses
 */
export const mockAuthSuccess = {
  signIn: (user: any) => ({
    data: { user, session: { access_token: 'mock_token' } },
    error: null,
  }),
  signUp: (user: any) => ({
    data: { user, session: null },
    error: null,
  }),
  signOut: () => ({
    error: null,
  }),
  getUser: (user: any) => ({
    data: { user },
    error: null,
  }),
}

/**
 * Mock auth error responses
 */
export const mockAuthError = {
  signIn: (message: string) => ({
    data: null,
    error: { message },
  }),
  signUp: (message: string) => ({
    data: null,
    error: { message },
  }),
  signOut: (message: string) => ({
    error: { message },
  }),
  getUser: (message: string) => ({
    data: { user: null },
    error: { message },
  }),
}

/**
 * Mock database operation responses
 */
export const mockDbSuccess = {
  select: (data: any) => ({ data, error: null }),
  insert: (data: any) => ({ data, error: null }),
  update: (data: any) => ({ data, error: null }),
  upsert: (data: any) => ({ data, error: null }),
  delete: () => ({ data: null, error: null }),
  rpc: (data: any) => ({ data, error: null }),
}

export const mockDbError = {
  select: (message: string) => ({ data: null, error: { message } }),
  insert: (message: string) => ({ data: null, error: { message } }),
  update: (message: string) => ({ data: null, error: { message } }),
  upsert: (message: string) => ({ data: null, error: { message } }),
  delete: (message: string) => ({ data: null, error: { message } }),
  rpc: (message: string) => ({ data: null, error: { message } }),
}

/**
 * Common test data fixtures
 */
export const mockUsers = {
  worker: {
    id: 'worker-123',
    email: 'worker@inopnc.com',
    user_metadata: {
      full_name: 'Test Worker',
      phone: '+1234567890',
      role: 'worker',
    },
  },
  manager: {
    id: 'manager-123',
    email: 'manager@inopnc.com',
    user_metadata: {
      full_name: 'Site Manager',
      phone: '+1234567891',
      role: 'site_manager',
    },
  },
  admin: {
    id: 'admin-123',
    email: 'admin@inopnc.com',
    user_metadata: {
      full_name: 'System Admin',
      phone: '+1234567892',
      role: 'admin',
    },
  },
  systemAdmin: {
    id: 'system-admin-123',
    email: 'davidswyang@gmail.com',
    user_metadata: {
      full_name: 'David Yang',
      phone: '+1234567893',
      role: 'system_admin',
    },
  },
}

export const mockProfiles = {
  complete: {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '+1234567890',
    role: 'worker',
    organization_id: 'org-123',
    site_id: 'site-123',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  incomplete: {
    id: 'user-456',
    email: 'incomplete@example.com',
    full_name: null,
    phone: null,
    role: 'worker',
    organization_id: null,
    site_id: null,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
}

export const mockOrganizations = {
  inopnc: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'INOPNC',
    type: 'contractor',
    status: 'active',
  },
  customer: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Customer Corp',
    type: 'customer',
    status: 'active',
  },
}

export const mockSites = {
  site1: {
    id: '33333333-3333-3333-3333-333333333333',
    name: '강남 A현장',
    location: '서울시 강남구',
    status: 'active',
    organization_id: '11111111-1111-1111-1111-111111111111',
  },
  site2: {
    id: '44444444-4444-4444-4444-444444444444',
    name: '송파 B현장',
    location: '서울시 송파구',
    status: 'active',
    organization_id: '11111111-1111-1111-1111-111111111111',
  },
}

/**
 * Helper to set up common mock scenarios
 */
export class SupabaseMockHelper {
  constructor(private mockSupabase: MockSupabaseClient) {}

  /**
   * Sets up successful profile query
   */
  mockProfileQuery(profile: any) {
    const query = createMockQueryBuilder()
    query.single.mockResolvedValue(mockDbSuccess.select(profile))
    this.mockSupabase.from.mockReturnValue(query)
    return query
  }

  /**
   * Sets up failed profile query
   */
  mockProfileQueryError(message: string) {
    const query = createMockQueryBuilder()
    query.single.mockResolvedValue(mockDbError.select(message))
    this.mockSupabase.from.mockReturnValue(query)
    return query
  }

  /**
   * Sets up successful upsert operation
   */
  mockUpsertSuccess(data?: any) {
    const query = createMockQueryBuilder()
    // Set up upsert to return the builder for chaining, then single/select to resolve with data
    query.upsert.mockReturnValue(query)
    query.select.mockReturnValue(query)
    query.single.mockResolvedValue(mockDbSuccess.upsert(data))
    this.mockSupabase.from.mockReturnValue(query)
    return query
  }

  /**
   * Sets up failed upsert operation
   */
  mockUpsertError(message: string) {
    const query = createMockQueryBuilder()
    query.upsert.mockResolvedValue(mockDbError.upsert(message))
    this.mockSupabase.from.mockReturnValue(query)
    return query
  }

  /**
   * Sets up successful RPC call
   */
  mockRpcSuccess(data: any) {
    this.mockSupabase.rpc.mockResolvedValue(mockDbSuccess.rpc(data))
  }

  /**
   * Sets up failed RPC call
   */
  mockRpcError(message: string) {
    this.mockSupabase.rpc.mockResolvedValue(mockDbError.rpc(message))
  }

  /**
   * Resets all mocks
   */
  reset() {
    jest.clearAllMocks()
  }
}

/**
 * Global setup function for consistent test environment
 */
export const setupSupabaseMocks = () => {
  const mockSupabase = createMockSupabaseClient()
  const helper = new SupabaseMockHelper(mockSupabase)
  
  return {
    mockSupabase,
    helper,
    mockUsers,
    mockProfiles,
    mockOrganizations,
    mockSites,
  }
}

// Test for Jest requirement - Supabase mock utilities
describe('Supabase Mock Utilities', () => {
  it('should create mock supabase client', () => {
    const mockClient = createMockSupabaseClient()
    expect(mockClient.auth).toBeDefined()
    expect(mockClient.from).toBeDefined()
    expect(mockClient.rpc).toBeDefined()
    expect(mockClient.storage).toBeDefined()
  })
  
  it('should create mock query builder with chainable methods', () => {
    const builder = createMockQueryBuilder()
    expect(builder.select).toBeDefined()
    expect(builder.insert).toBeDefined()
    expect(builder.update).toBeDefined()
    expect(builder.delete).toBeDefined()
    
    // Test chaining
    const result = builder.select('*').eq('id', '123')
    expect(result).toBe(builder)
  })
  
  it('should setup mock helper with utility methods', () => {
    const { mockSupabase, helper } = setupSupabaseMocks()
    expect(helper).toBeInstanceOf(SupabaseMockHelper)
    expect(helper.mockProfileQuery).toBeDefined()
    expect(helper.mockUpsertSuccess).toBeDefined()
    expect(helper.reset).toBeDefined()
  })
  
  it('should provide test data fixtures', () => {
    expect(mockUsers.worker).toBeDefined()
    expect(mockProfiles.complete).toBeDefined()
    expect(mockOrganizations.inopnc).toBeDefined()
    expect(mockSites.site1).toBeDefined()
  })
})