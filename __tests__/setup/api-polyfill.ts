/**
 * API polyfills for testing environment
 * Required for Next.js API route testing with Request/Response objects
 */

import { TextEncoder, TextDecoder } from 'util'

// Add polyfills for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any
}

// Mock Request class
class MockRequest {
  public method: string = 'GET'
  public headers: MockHeaders
  private _body: any
  private _url: string
  
  constructor(url: string, init?: RequestInit) {
    this._url = url
    if (init) {
      this.method = init.method || 'GET'
      this._body = init.body
    }
    this.headers = new MockHeaders(init?.headers)
  }
  
  get url() {
    return this._url
  }
  
  async json() {
    return this._body ? JSON.parse(this._body) : {}
  }
  
  async text() {
    return this._body || ''
  }
}

// Mock Response class
class MockResponse {
  public status: number
  public statusText: string
  public headers: MockHeaders
  private _body: any
  
  constructor(body?: any, init?: ResponseInit) {
    this.status = init?.status || 200
    this.statusText = init?.statusText || 'OK'
    this.headers = new MockHeaders(init?.headers)
    this._body = body
  }
  
  static json(data: any, init?: ResponseInit) {
    const response = new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    })
    return response
  }
  
  async json() {
    return this._body ? JSON.parse(this._body) : {}
  }
  
  async text() {
    return this._body || ''
  }
}

// Mock Headers class
class MockHeaders {
  private headers: Record<string, string> = {}
  
  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value))
      } else if (init instanceof MockHeaders) {
        this.headers = { ...init.headers }
      } else {
        Object.entries(init).forEach(([key, value]) => this.set(key, value))
      }
    }
  }
  
  set(name: string, value: string) {
    this.headers[name.toLowerCase()] = value
  }
  
  get(name: string) {
    return this.headers[name.toLowerCase()] || null
  }
  
  has(name: string) {
    return name.toLowerCase() in this.headers
  }
  
  delete(name: string) {
    delete this.headers[name.toLowerCase()]
  }
  
  append(name: string, value: string) {
    this.set(name, value)
  }
  
  forEach(callback: (value: string, key: string) => void) {
    Object.entries(this.headers).forEach(([key, value]) => callback(value, key))
  }
  
  entries() {
    return Object.entries(this.headers).map(([key, value]) => [key, value])
  }
  
  keys() {
    return Object.keys(this.headers)
  }
  
  values() {
    return Object.values(this.headers)
  }
  
  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]()
  }
}

// Set global objects
if (typeof global.Request === 'undefined') {
  // @ts-ignore
  global.Request = MockRequest
}

if (typeof global.Response === 'undefined') {
  // @ts-ignore
  global.Response = MockResponse
}

if (typeof global.Headers === 'undefined') {
  // @ts-ignore
  global.Headers = MockHeaders
}

if (typeof global.fetch === 'undefined') {
  // @ts-ignore
  global.fetch = jest.fn()
}

// For Jest - this file must contain at least one test
describe('API Polyfill Setup', () => {
  it('should setup required globals for API testing', () => {
    expect(global.Request).toBeDefined()
    expect(global.Response).toBeDefined()
    expect(global.Headers).toBeDefined()
    expect(global.fetch).toBeDefined()
    expect(global.TextEncoder).toBeDefined()
    expect(global.TextDecoder).toBeDefined()
  })
})

export {}