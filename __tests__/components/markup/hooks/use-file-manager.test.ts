import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileManager } from '@/components/markup/hooks/use-file-manager'
import type { MarkupEditorState, MarkupObject } from '@/types/markup'
import type { MarkupDocument } from '@/types'

// Mock fetch globally
global.fetch = jest.fn()

// Mock console.error - note that jest.setup.js also modifies console.error globally
const originalConsoleError = console.error
const mockConsoleError = jest.fn()

beforeAll(() => {
  console.error = mockConsoleError
})

afterAll(() => {
  console.error = originalConsoleError
})

describe('useFileManager', () => {
  let mockEditorState: MarkupEditorState
  let mockSetEditorState: jest.Mock

  const mockMarkupObject: MarkupObject = {
    id: 'box-1',
    type: 'box',
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    color: 'red',
    strokeWidth: 2,
    createdAt: '2023-01-01T00:00:00Z',
    modifiedAt: '2023-01-01T00:00:00Z'
  }

  const mockDocument: MarkupDocument = {
    id: 'doc-1',
    title: 'Test Document',
    description: 'Test description',
    original_blueprint_url: 'https://example.com/blueprint.jpg',
    original_blueprint_filename: 'blueprint.jpg',
    markup_data: [mockMarkupObject],
    location: 'personal',
    created_by: 'user-1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    site_id: null,
    is_deleted: false,
    markup_count: 1,
    preview_image_url: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockConsoleError.mockClear()
    mockSetEditorState = jest.fn()
    
    mockEditorState = {
      markupObjects: [mockMarkupObject],
      selectedObjects: [],
      undoStack: [],
      redoStack: [],
      toolState: {
        activeTool: 'select',
        boxColor: 'red',
        textColor: 'black',
        strokeWidth: 2,
        fontSize: 16,
        clipboard: []
      },
      viewerState: {
        zoom: 1,
        panX: 0,
        panY: 0,
        isDragging: false,
        dragStart: { x: 0, y: 0 }
      },
      currentFile: null
    }

    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('saveDocument', () => {
    const saveParams = {
      fileName: 'Test Document',
      location: 'personal' as const,
      description: 'Test description',
      blueprintUrl: 'https://example.com/blueprint.jpg',
      blueprintFileName: 'blueprint.jpg'
    }

    it('should save new document successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockDocument
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      let savedDocument: MarkupDocument | undefined

      await act(async () => {
        savedDocument = await result.current.saveDocument(saveParams)
      })

      expect(fetch).toHaveBeenCalledWith('/api/markup-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: saveParams.fileName,
          description: saveParams.description,
          original_blueprint_url: saveParams.blueprintUrl,
          original_blueprint_filename: saveParams.blueprintFileName,
          markup_data: mockEditorState.markupObjects,
          location: saveParams.location,
          preview_image_url: null
        })
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      expect(savedDocument).toEqual(mockDocument)
    })

    it('should update existing document successfully', async () => {
      mockEditorState.currentFile = mockDocument

      const mockResponse = {
        success: true,
        data: { ...mockDocument, title: 'Updated Document' }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      let savedDocument: MarkupDocument | undefined

      await act(async () => {
        savedDocument = await result.current.saveDocument(saveParams)
      })

      expect(fetch).toHaveBeenCalledWith(`/api/markup-documents/${mockDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: saveParams.fileName,
          description: saveParams.description,
          original_blueprint_url: saveParams.blueprintUrl,
          original_blueprint_filename: saveParams.blueprintFileName,
          markup_data: mockEditorState.markupObjects,
          location: saveParams.location,
          preview_image_url: null
        })
      })

      expect(savedDocument).toEqual(mockResponse.data)
    })

    it('should set saving state during save operation', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDocument })
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.saveDocument(saveParams)
      })

      // Check that isSaving is set to true at the start
      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      const firstCall = mockSetEditorState.mock.calls[0][0]
      const stateWithSaving = firstCall(mockEditorState)
      expect(stateWithSaving.isSaving).toBe(true)
    })

    it('should handle save failure with error response', async () => {
      const errorResponse = {
        error: 'Save failed'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      let thrownError: any
      try {
        await act(async () => {
          await result.current.saveDocument(saveParams)
        })
      } catch (error) {
        thrownError = error
      }

      expect(thrownError).toBeDefined()
      expect(thrownError.message).toBe('Save failed')
      expect(mockConsoleError).toHaveBeenCalledWith('Save document failed:', errorResponse)
    })

    it('should handle network errors', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      await expect(
        act(async () => {
          await result.current.saveDocument(saveParams)
        })
      ).rejects.toThrow('Network error')

      expect(console.error).toHaveBeenCalledWith('Failed to save document:', expect.any(Error))
    })

    it('should reset saving state on error', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      await expect(
        act(async () => {
          await result.current.saveDocument(saveParams)
        })
      ).rejects.toThrow('Network error')

      // Check that isSaving is set to false on error
      const errorCall = mockSetEditorState.mock.calls.find(call => {
        const updatedState = call[0](mockEditorState)
        return updatedState.isSaving === false
      })
      expect(errorCall).toBeDefined()
    })
  })

  describe('openDocument', () => {
    it('should open document successfully', async () => {
      const mockResponse = {
        success: true,
        data: mockDocument
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      let openResult: any

      await act(async () => {
        openResult = await result.current.openDocument(mockDocument)
      })

      expect(fetch).toHaveBeenCalledWith(`/api/markup-documents/${mockDocument.id}`)

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      expect(openResult).toEqual({
        document: mockDocument,
        blueprintUrl: mockDocument.original_blueprint_url,
        blueprintFileName: mockDocument.original_blueprint_filename
      })
    })

    it('should set loading state during open operation', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDocument })
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.openDocument(mockDocument)
      })

      // Check that isLoading is set to true at the start
      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      const firstCall = mockSetEditorState.mock.calls[0][0]
      const stateWithLoading = firstCall(mockEditorState)
      expect(stateWithLoading.isLoading).toBe(true)
    })

    it('should handle open failure with error response', async () => {
      const errorResponse = {
        success: false,
        error: 'Document not found'
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      await expect(
        act(async () => {
          await result.current.openDocument(mockDocument)
        })
      ).rejects.toThrow('Document not found')
    })

    it('should handle network errors during open', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      await expect(
        act(async () => {
          await result.current.openDocument(mockDocument)
        })
      ).rejects.toThrow('Network error')

      expect(console.error).toHaveBeenCalledWith('Failed to open document:', expect.any(Error))
    })

    it('should reset loading state on error', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      await expect(
        act(async () => {
          await result.current.openDocument(mockDocument)
        })
      ).rejects.toThrow('Network error')

      // Check that isLoading is set to false on error
      const errorCall = mockSetEditorState.mock.calls.find(call => {
        const updatedState = call[0](mockEditorState)
        return updatedState.isLoading === false
      })
      expect(errorCall).toBeDefined()
    })

    it('should update editor state with loaded document data', async () => {
      const mockResponse = {
        success: true,
        data: mockDocument
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      await act(async () => {
        await result.current.openDocument(mockDocument)
      })

      // Find the call that sets the loaded document
      const successCall = mockSetEditorState.mock.calls.find(call => {
        const updatedState = call[0](mockEditorState)
        return updatedState.currentFile !== null
      })

      expect(successCall).toBeDefined()
      
      if (successCall) {
        const updatedState = successCall[0](mockEditorState)
        expect(updatedState.currentFile).toEqual(mockDocument)
        expect(updatedState.markupObjects).toEqual(mockDocument.markup_data)
        expect(updatedState.isLoading).toBe(false)
        expect(updatedState.showOpenDialog).toBe(false)
      }
    })

    it('should handle document with no markup data', async () => {
      const documentWithoutMarkup = {
        ...mockDocument,
        markup_data: null
      }

      const mockResponse = {
        success: true,
        data: documentWithoutMarkup
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const { result } = renderHook(() => 
        useFileManager(mockEditorState, mockSetEditorState)
      )

      await act(async () => {
        await result.current.openDocument(documentWithoutMarkup)
      })

      // Find the call that sets the loaded document
      const successCall = mockSetEditorState.mock.calls.find(call => {
        const updatedState = call[0](mockEditorState)
        return updatedState.currentFile !== null
      })

      if (successCall) {
        const updatedState = successCall[0](mockEditorState)
        expect(updatedState.markupObjects).toEqual([])
      }
    })
  })

  describe('hook dependencies', () => {
    it('should update callbacks when dependencies change', () => {
      const { result, rerender } = renderHook(
        ({ editorState, setEditorState }) => useFileManager(editorState, setEditorState),
        { 
          initialProps: { 
            editorState: mockEditorState, 
            setEditorState: mockSetEditorState 
          } 
        }
      )

      const initialSaveDocument = result.current.saveDocument
      
      // Change editor state
      const newEditorState = {
        ...mockEditorState,
        markupObjects: []
      }
      
      rerender({ 
        editorState: newEditorState, 
        setEditorState: mockSetEditorState 
      })

      // saveDocument callback should be different due to dependency changes
      expect(result.current.saveDocument).not.toBe(initialSaveDocument)
    })
  })
})