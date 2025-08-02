/**
 * Supabase API Mock Helper
 * Provides async-aware mocking for API route tests
 */

export interface MockQueryBuilder {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
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
  in_: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  range: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
}

export class SupabaseQueryMock implements MockQueryBuilder {
  private data: any = null
  private error: any = null
  private shouldResolve: boolean = true
  
  // Query builder methods
  select = jest.fn().mockReturnThis()
  insert = jest.fn().mockReturnThis()
  update = jest.fn().mockReturnThis()
  delete = jest.fn().mockReturnThis()
  eq = jest.fn().mockReturnThis()
  neq = jest.fn().mockReturnThis()
  gt = jest.fn().mockReturnThis()
  gte = jest.fn().mockReturnThis()
  lt = jest.fn().mockReturnThis()
  lte = jest.fn().mockReturnThis()
  like = jest.fn().mockReturnThis()
  ilike = jest.fn().mockReturnThis()
  is = jest.fn().mockReturnThis()
  in_ = jest.fn().mockReturnThis()
  order = jest.fn().mockReturnThis()
  limit = jest.fn().mockReturnThis()
  range = jest.fn().mockReturnThis()
  single = jest.fn().mockReturnThis()
  maybeSingle = jest.fn().mockReturnThis()
  
  constructor(data: any = null, error: any = null) {
    this.data = data
    this.error = error
    this.shouldResolve = !error
  }
  
  // Make the query builder thenable
  then(onFulfilled?: any, onRejected?: any): Promise<any> {
    const result = { data: this.data, error: this.error }
    
    if (this.shouldResolve) {
      return Promise.resolve(result).then(onFulfilled, onRejected)
    } else {
      return Promise.reject(this.error).then(onFulfilled, onRejected)
    }
  }
  
  catch(onRejected: any): Promise<any> {
    return this.then(undefined, onRejected)
  }
  
  finally(onFinally?: any): Promise<any> {
    return this.then().finally(onFinally)
  }
  
  // Allow chaining to return this for all methods
  mockReturnThis() {
    return this
  }
  
  // Set the mock data
  mockResolvedValue(data: any, error: any = null) {
    this.data = data
    this.error = error
    this.shouldResolve = !error
    return this
  }
  
  mockRejectedValue(error: any) {
    this.error = error
    this.shouldResolve = false
    return this
  }
}

export interface MockSupabaseClient {
  auth: {
    getUser: jest.Mock
    getSession: jest.Mock
    signInWithPassword: jest.Mock
    signUp: jest.Mock
    signOut: jest.Mock
  }
  from: jest.Mock
  rpc: jest.Mock
  storage: {
    from: jest.Mock
  }
}

export function createMockSupabaseClient(
  defaultData: any = null,
  defaultError: any = null
): MockSupabaseClient {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: null, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: null, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(() => new SupabaseQueryMock(defaultData, defaultError)),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: null, error: null }),
        download: jest.fn().mockResolvedValue({ data: null, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: '' } }),
      })),
    },
  }
}

// Test for the mock utility
describe('Supabase API Mock', () => {
  it('should create chainable query mock', async () => {
    const mockData = { id: 1, name: 'Test' }
    const query = new SupabaseQueryMock(mockData)
    
    const result = await query
      .select('*')
      .eq('id', 1)
      .single()
    
    expect(result).toEqual({ data: mockData, error: null })
    expect(query.select).toHaveBeenCalledWith('*')
    expect(query.eq).toHaveBeenCalledWith('id', 1)
    expect(query.single).toHaveBeenCalled()
  })
  
  it('should handle errors properly', async () => {
    const mockError = new Error('Database error')
    const query = new SupabaseQueryMock(null, mockError)
    
    await expect(query.select('*')).rejects.toThrow('Database error')
  })
  
  it('should create mock supabase client', () => {
    const client = createMockSupabaseClient()
    
    expect(client.auth.getUser).toBeDefined()
    expect(client.from).toBeDefined()
    expect(client.rpc).toBeDefined()
    expect(client.storage.from).toBeDefined()
  })
})