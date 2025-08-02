import { renderHook, act } from '@testing-library/react'
import { useMarkupTools } from '@/components/markup/hooks/use-markup-tools'
import type { MarkupEditorState, MarkupObject } from '@/types/markup'

// Mock markup objects for testing
const mockMarkupObject1: MarkupObject = {
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

const mockMarkupObject2: MarkupObject = {
  id: 'text-1',
  type: 'text',
  x: 200,
  y: 200,
  width: 100,
  height: 30,
  text: 'Test text',
  fontSize: 16,
  color: 'blue',
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z'
}

const mockMarkupObject3: MarkupObject = {
  id: 'drawing-1',
  type: 'drawing',
  x: 300,
  y: 300,
  width: 80,
  height: 80,
  points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
  color: 'green',
  strokeWidth: 3,
  createdAt: '2023-01-01T00:00:00Z',
  modifiedAt: '2023-01-01T00:00:00Z'
}

describe('useMarkupTools', () => {
  let mockEditorState: MarkupEditorState
  let mockSetEditorState: jest.Mock

  beforeEach(() => {
    mockSetEditorState = jest.fn()
    
    mockEditorState = {
      markupObjects: [mockMarkupObject1, mockMarkupObject2, mockMarkupObject3],
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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('undo', () => {
    it('should undo when undo stack is not empty', () => {
      const previousState = [mockMarkupObject1]
      mockEditorState.undoStack = [previousState]
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.undo()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      // Check the function passed to setEditorState
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.markupObjects).toEqual(previousState)
      expect(newState.undoStack).toEqual([])
      expect(newState.redoStack).toContain(mockEditorState.markupObjects)
    })

    it('should not undo when undo stack is empty', () => {
      mockEditorState.undoStack = []
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.undo()
      })

      expect(mockSetEditorState).not.toHaveBeenCalled()
    })
  })

  describe('redo', () => {
    it('should redo when redo stack is not empty', () => {
      const nextState = [mockMarkupObject1, mockMarkupObject2]
      mockEditorState.redoStack = [nextState]
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.redo()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      // Check the function passed to setEditorState
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.markupObjects).toEqual(nextState)
      expect(newState.redoStack).toEqual([])
      expect(newState.undoStack).toContain(mockEditorState.markupObjects)
    })

    it('should not redo when redo stack is empty', () => {
      mockEditorState.redoStack = []
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.redo()
      })

      expect(mockSetEditorState).not.toHaveBeenCalled()
    })
  })

  describe('deleteSelected', () => {
    it('should delete selected objects', () => {
      mockEditorState.selectedObjects = ['box-1', 'text-1']
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.deleteSelected()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      // Check the function passed to setEditorState
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.markupObjects).toEqual([mockMarkupObject3])
      expect(newState.selectedObjects).toEqual([])
      expect(newState.undoStack).toContain(mockEditorState.markupObjects)
      expect(newState.redoStack).toEqual([])
    })

    it('should not delete when no objects are selected', () => {
      mockEditorState.selectedObjects = []
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.deleteSelected()
      })

      expect(mockSetEditorState).not.toHaveBeenCalled()
    })
  })

  describe('copySelected', () => {
    it('should copy selected objects to clipboard', () => {
      mockEditorState.selectedObjects = ['box-1', 'text-1']
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.copySelected()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      // Check the function passed to setEditorState
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.toolState.clipboard).toEqual([mockMarkupObject1, mockMarkupObject2])
    })

    it('should not copy when no objects are selected', () => {
      mockEditorState.selectedObjects = []
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.copySelected()
      })

      expect(mockSetEditorState).not.toHaveBeenCalled()
    })
  })

  describe('paste', () => {
    beforeEach(() => {
      // Mock Date.now for consistent ID generation
      jest.spyOn(Date, 'now').mockReturnValue(1234567890)
      jest.spyOn(Math, 'random').mockReturnValue(0.5)
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-01-01T12:00:00Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should paste objects from clipboard', () => {
      mockEditorState.toolState.clipboard = [mockMarkupObject1, mockMarkupObject2]
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.paste()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      // Check the function passed to setEditorState
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.markupObjects).toHaveLength(5) // 3 original + 2 pasted
      expect(newState.undoStack).toContain(mockEditorState.markupObjects)
      expect(newState.redoStack).toEqual([])
      
      // Check that pasted objects have new IDs and offset positions
      const pastedObjects = newState.markupObjects.slice(3)
      expect(pastedObjects[0].id).not.toBe(mockMarkupObject1.id)
      expect(pastedObjects[0].x).toBe(mockMarkupObject1.x + 20)
      expect(pastedObjects[0].y).toBe(mockMarkupObject1.y + 20)
      expect(pastedObjects[1].id).not.toBe(mockMarkupObject2.id)
      expect(pastedObjects[1].x).toBe(mockMarkupObject2.x + 20)
      expect(pastedObjects[1].y).toBe(mockMarkupObject2.y + 20)
      
      // Check that pasted objects are selected
      expect(newState.selectedObjects).toEqual([pastedObjects[0].id, pastedObjects[1].id])
    })

    it('should not paste when clipboard is empty', () => {
      mockEditorState.toolState.clipboard = []
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.paste()
      })

      expect(mockSetEditorState).not.toHaveBeenCalled()
    })
  })

  describe('deselectAll', () => {
    it('should deselect all objects', () => {
      mockEditorState.selectedObjects = ['box-1', 'text-1', 'drawing-1']
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.deselectAll()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      // Check the function passed to setEditorState
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.selectedObjects).toEqual([])
    })

    it('should work when no objects are selected', () => {
      mockEditorState.selectedObjects = []
      
      const { result } = renderHook(() => 
        useMarkupTools(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.deselectAll()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      // Check the function passed to setEditorState
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.selectedObjects).toEqual([])
    })
  })

  describe('hook dependencies', () => {
    it('should update callbacks when dependencies change', () => {
      const { result, rerender } = renderHook(
        ({ editorState, setEditorState }) => useMarkupTools(editorState, setEditorState),
        { 
          initialProps: { 
            editorState: mockEditorState, 
            setEditorState: mockSetEditorState 
          } 
        }
      )

      const initialUndo = result.current.undo
      
      // Change editor state
      const newEditorState = {
        ...mockEditorState,
        markupObjects: [mockMarkupObject1],
        undoStack: [mockEditorState.markupObjects]
      }
      
      rerender({ 
        editorState: newEditorState, 
        setEditorState: mockSetEditorState 
      })

      // Callbacks should be different due to dependency changes
      expect(result.current.undo).not.toBe(initialUndo)
    })
  })
})