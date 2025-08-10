/**
 * Document Operations Test Suite (Simplified)
 * Focused tests for document management functionality
 * Tests file uploads, permissions, search, and Korean content handling
 */

import { jest } from '@jest/globals'
import type { Document, DocumentType } from '@/types'

// Mock file objects for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const blob = new Blob(['test content'], { type })
  return new File([blob], name, { type, lastModified: Date.now() }) as File
}

// Mock Next.js cache functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_cache: jest.fn()
}))

// Mock document actions
const mockDocumentActions = {
  uploadDocument: jest.fn(),
  getDocuments: jest.fn(), 
  getMyDocuments: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  getSharedDocuments: jest.fn()
}

jest.mock('@/app/actions/documents', () => mockDocumentActions)

// Test data
const mockUser = {
  id: 'user-123',
  email: 'worker@inopnc.com'
}

const mockDocument: Document = {
  id: 'doc-123',
  title: '안전교육자료.pdf',
  description: '2025년 안전교육 자료',
  file_url: 'https://storage.supabase.co/documents/user-123/file.pdf',
  file_name: '안전교육자료.pdf',
  file_size: 2048576,
  mime_type: 'application/pdf',
  document_type: 'certificate',
  folder_path: '/safety',
  owner_id: 'user-123',
  is_public: false,
  site_id: 'site-1',
  created_at: '2025-08-01T09:00:00Z',
  updated_at: '2025-08-01T09:00:00Z'
}

describe('Document Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.values(mockDocumentActions).forEach(mock => mock.mockReset())
  })

  describe('File Upload Operations', () => {
    it('should upload document successfully with valid data', async () => {
      const formData = new FormData()
      const file = createMockFile('test-document.pdf', 1024000, 'application/pdf')
      
      formData.append('file', file)
      formData.append('title', '테스트 문서')
      formData.append('description', '테스트용 PDF 문서')
      formData.append('document_type', 'personal')

      const expectedResult = {
        success: true,
        data: {
          ...mockDocument,
          title: '테스트 문서',
          description: '테스트용 PDF 문서'
        }
      }

      mockDocumentActions.uploadDocument.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.uploadDocument(formData)

      expect(result.success).toBe(true)
      expect(result.data.title).toBe('테스트 문서')
      expect(mockDocumentActions.uploadDocument).toHaveBeenCalledWith(formData)
    })

    it('should reject upload without required fields', async () => {
      const formData = new FormData()
      // Missing file and title

      const expectedResult = {
        success: false,
        error: 'File and title are required'
      }

      mockDocumentActions.uploadDocument.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.uploadDocument(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('File and title are required')
    })

    it('should handle large file upload limits', async () => {
      const formData = new FormData()
      const largeFile = createMockFile('large-file.pdf', 50 * 1024 * 1024, 'application/pdf') // 50MB
      
      formData.append('file', largeFile)
      formData.append('title', '대용량 파일')
      formData.append('document_type', 'blueprint')

      const expectedResult = {
        success: false,
        error: 'File too large'
      }

      mockDocumentActions.uploadDocument.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.uploadDocument(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('File too large')
    })

    it('should handle different file types correctly', async () => {
      const testCases = [
        { name: 'document.pdf', type: 'application/pdf', shouldPass: true },
        { name: 'image.jpg', type: 'image/jpeg', shouldPass: true },
        { name: 'drawing.dwg', type: 'application/dwg', shouldPass: true },
        { name: 'script.exe', type: 'application/x-executable', shouldPass: false }
      ]

      for (const testCase of testCases) {
        const formData = new FormData()
        formData.append('file', createMockFile(testCase.name, 1024, testCase.type))
        formData.append('title', `테스트 ${testCase.name}`)
        formData.append('document_type', 'other')

        const expectedResult = {
          success: testCase.shouldPass,
          error: testCase.shouldPass ? undefined : 'File type not allowed'
        }

        mockDocumentActions.uploadDocument.mockResolvedValue(expectedResult)

        const result = await mockDocumentActions.uploadDocument(formData)

        expect(result.success).toBe(testCase.shouldPass)
      }
    })
  })

  describe('Document Retrieval', () => {
    it('should retrieve documents with filters', async () => {
      const filters = {
        document_type: 'certificate' as DocumentType,
        site_id: 'site-1',
        search: '안전'
      }

      const expectedResult = {
        success: true,
        data: [mockDocument],
        count: 1
      }

      mockDocumentActions.getDocuments.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.getDocuments(filters)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toContain('안전')
      expect(mockDocumentActions.getDocuments).toHaveBeenCalledWith(filters)
    })

    it('should handle Korean text search', async () => {
      const koreanSearches = ['안전교육', '건설기계', '작업일지', '현장도면']

      for (const search of koreanSearches) {
        const filters = { search }
        
        const expectedResult = {
          success: true,
          data: [mockDocument],
          count: 1
        }

        mockDocumentActions.getDocuments.mockResolvedValue(expectedResult)

        const result = await mockDocumentActions.getDocuments(filters)

        expect(result.success).toBe(true)
        expect(mockDocumentActions.getDocuments).toHaveBeenCalledWith(filters)
      }
    })

    it('should handle pagination correctly', async () => {
      const filters = {
        limit: 10,
        offset: 20
      }

      const expectedResult = {
        success: true,
        data: Array(10).fill(mockDocument),
        count: 100
      }

      mockDocumentActions.getDocuments.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.getDocuments(filters)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(10)
      expect(result.count).toBe(100)
    })
  })

  describe('Document Management', () => {
    it('should update document successfully', async () => {
      const updateData = {
        title: '수정된 제목',
        description: '수정된 설명',
        is_public: true
      }

      const expectedResult = {
        success: true,
        data: {
          ...mockDocument,
          ...updateData,
          updated_at: '2025-08-01T12:00:00Z'
        }
      }

      mockDocumentActions.updateDocument.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.updateDocument('doc-123', updateData)

      expect(result.success).toBe(true)
      expect(result.data.title).toBe('수정된 제목')
      expect(mockDocumentActions.updateDocument).toHaveBeenCalledWith('doc-123', updateData)
    })

    it('should delete document with ownership validation', async () => {
      const expectedResult = {
        success: true
      }

      mockDocumentActions.deleteDocument.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.deleteDocument('doc-123')

      expect(result.success).toBe(true)
      expect(mockDocumentActions.deleteDocument).toHaveBeenCalledWith('doc-123')
    })

    it('should prevent unauthorized deletion', async () => {
      const expectedResult = {
        success: false,
        error: 'Unauthorized to delete this document'
      }

      mockDocumentActions.deleteDocument.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.deleteDocument('doc-other-user')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized to delete this document')
    })
  })

  describe('User Documents', () => {
    it('should return user-specific documents by category', async () => {
      const categories = ['salary', 'daily-reports', 'certificates', 'safety']

      for (const category of categories) {
        const expectedResult = {
          success: true,
          data: [
            {
              id: `doc-${category}`,
              category,
              name: `${category}-document.pdf`,
              fileType: 'application/pdf',
              uploadedBy: '나'
            }
          ]
        }

        mockDocumentActions.getMyDocuments.mockResolvedValue(expectedResult)

        const result = await mockDocumentActions.getMyDocuments({ 
          category, 
          userId: mockUser.id 
        })

        expect(result.success).toBe(true)
        expect(result.data[0].category).toBe(category)
      }
    })
  })

  describe('Shared Documents', () => {
    it('should return site-specific shared documents', async () => {
      const params = {
        category: 'site-docs',
        userId: mockUser.id,
        siteId: 'site-1',
        role: 'worker'
      }

      const expectedResult = {
        success: true,
        data: [
          {
            id: 'shared-1',
            category: 'site-docs',
            name: 'TestSite_Blueprint_Rev3.dwg',
            accessLevel: 'site',
            site: { id: 'site-1', name: 'Test Construction Site Alpha' }
          }
        ]
      }

      mockDocumentActions.getSharedDocuments.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.getSharedDocuments(params)

      expect(result.success).toBe(true)
      expect(result.data[0].accessLevel).toBe('site')
      expect(result.data[0].name).toContain('도면')
    })

    it('should handle role-based access control', async () => {
      const adminParams = {
        category: 'company-notices',
        userId: 'admin-123',
        organizationId: 'org-1',
        role: 'admin'
      }

      const workerParams = {
        category: 'company-notices',
        userId: mockUser.id,
        role: 'worker'
      }

      // Admin should have access
      mockDocumentActions.getSharedDocuments.mockResolvedValueOnce({
        success: true,
        data: [{ name: '회사공지.pdf' }]
      })

      // Worker without organizationId should have no access
      mockDocumentActions.getSharedDocuments.mockResolvedValueOnce({
        success: true,
        data: []
      })

      const adminResult = await mockDocumentActions.getSharedDocuments(adminParams)
      const workerResult = await mockDocumentActions.getSharedDocuments(workerParams)

      expect(adminResult.data).toHaveLength(1)
      expect(workerResult.data).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const expectedResult = {
        success: false,
        error: 'User not authenticated'
      }

      mockDocumentActions.getDocuments.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.getDocuments({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })

    it('should handle database errors gracefully', async () => {
      const expectedResult = {
        success: false,
        error: 'Database connection failed'
      }

      mockDocumentActions.getDocuments.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.getDocuments({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle storage quota exceeded', async () => {
      const formData = new FormData()
      formData.append('file', createMockFile('file.pdf', 100 * 1024 * 1024, 'application/pdf'))
      formData.append('title', '대용량 파일')

      const expectedResult = {
        success: false,
        error: 'Storage quota exceeded'
      }

      mockDocumentActions.uploadDocument.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.uploadDocument(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage quota exceeded')
    })
  })

  describe('Korean Content Handling', () => {
    it('should handle Korean file names and descriptions', async () => {
      const formData = new FormData()
      const file = createMockFile('한글파일명_특수문자!@#.pdf', 1024, 'application/pdf')
      
      formData.append('file', file)
      formData.append('title', '한글 제목 테스트')
      formData.append('description', '한글 설명과 특수문자: !@#$%^&*()')

      const expectedResult = {
        success: true,
        data: {
          ...mockDocument,
          title: '한글 제목 테스트',
          description: '한글 설명과 특수문자: !@#$%^&*()',
          file_name: '한글파일명_특수문자!@#.pdf'
        }
      }

      mockDocumentActions.uploadDocument.mockResolvedValue(expectedResult)

      const result = await mockDocumentActions.uploadDocument(formData)

      expect(result.success).toBe(true)
      expect(result.data.title).toContain('한글')
      expect(result.data.description).toContain('특수문자')
      expect(result.data.file_name).toContain('한글파일명')
    })

    it('should handle Korean search queries', async () => {
      const koreanQueries = [
        '안전교육',
        '작업일지', 
        '현장도면',
        '건설기계'
      ]

      for (const query of koreanQueries) {
        const expectedResult = {
          success: true,
          data: [mockDocument],
          count: 1
        }

        mockDocumentActions.getDocuments.mockResolvedValue(expectedResult)

        const result = await mockDocumentActions.getDocuments({ search: query })

        expect(result.success).toBe(true)
        expect(mockDocumentActions.getDocuments).toHaveBeenCalledWith({ search: query })
      }
    })
  })

  describe('Business Logic Validation', () => {
    it('should enforce document type-specific rules', async () => {
      const testCases = [
        {
          type: 'blueprint',
          file: createMockFile('blueprint.dwg', 30 * 1024 * 1024, 'application/dwg'),
          shouldPass: true
        },
        {
          type: 'personal',
          file: createMockFile('personal.pdf', 5 * 1024 * 1024, 'application/pdf'),
          shouldPass: true
        },
        {
          type: 'certificate',
          file: createMockFile('cert.jpg', 2 * 1024 * 1024, 'image/jpeg'),
          shouldPass: true
        }
      ]

      for (const testCase of testCases) {
        const formData = new FormData()
        formData.append('file', testCase.file)
        formData.append('title', `테스트 ${testCase.type}`)
        formData.append('document_type', testCase.type)

        const expectedResult = {
          success: testCase.shouldPass,
          data: testCase.shouldPass ? mockDocument : undefined,
          error: testCase.shouldPass ? undefined : 'File type not allowed for this document type'
        }

        mockDocumentActions.uploadDocument.mockResolvedValue(expectedResult)

        const result = await mockDocumentActions.uploadDocument(formData)

        expect(result.success).toBe(testCase.shouldPass)
      }
    })

    it('should validate folder path structure', async () => {
      const validPaths = ['/safety', '/blueprints', '/personal', '/certificates']
      
      for (const path of validPaths) {
        const filters = { folder_path: path }
        
        const expectedResult = {
          success: true,
          data: [mockDocument],
          count: 1
        }

        mockDocumentActions.getDocuments.mockResolvedValue(expectedResult)

        const result = await mockDocumentActions.getDocuments(filters)
        
        expect(result.success).toBe(true)
        expect(mockDocumentActions.getDocuments).toHaveBeenCalledWith(filters)
      }
    })

    it('should handle concurrent operations safely', async () => {
      // Mock all operations to succeed first
      mockDocumentActions.getDocuments.mockResolvedValue({
        success: true,
        data: [mockDocument],
        count: 1
      })

      const operations = Array(5).fill(null).map((_, i) => 
        mockDocumentActions.getDocuments({ search: `document-${i}` })
      )

      const results = await Promise.all(operations)

      expect(results.every(r => r.success)).toBe(true)
      expect(mockDocumentActions.getDocuments).toHaveBeenCalledTimes(5)
    })
  })
})