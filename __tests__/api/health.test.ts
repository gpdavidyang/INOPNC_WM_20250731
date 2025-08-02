import { GET } from '@/app/api/health/route'

describe('/api/health', () => {
  describe('GET', () => {
    it('should return healthy status', async () => {
      const response = await GET()
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String)
      })
    })

    it('should include valid timestamp', async () => {
      const response = await GET()
      const json = await response.json()

      const timestamp = new Date(json.timestamp)
      expect(timestamp).toBeInstanceOf(Date)
      expect(timestamp.getTime()).toBeGreaterThan(0)
    })

    it('should return environment info', async () => {
      const originalEnv = process.env.NODE_ENV
      const originalVersion = process.env.npm_package_version

      // Test with development environment
      process.env.NODE_ENV = 'development'
      process.env.npm_package_version = '1.2.3'

      const response = await GET()
      const json = await response.json()

      expect(json.environment).toBe('development')
      expect(json.version).toBe('1.2.3')

      // Restore original values
      process.env.NODE_ENV = originalEnv
      process.env.npm_package_version = originalVersion
    })
  })
})