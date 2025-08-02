import { renderHook, act } from '@testing-library/react'
import { useCanvasState } from '@/components/markup/hooks/use-canvas-state'
import type { MarkupEditorState } from '@/types/markup'

describe('useCanvasState', () => {
  let mockEditorState: MarkupEditorState
  let mockSetEditorState: jest.Mock

  beforeEach(() => {
    mockSetEditorState = jest.fn()
    
    mockEditorState = {
      markupObjects: [],
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

  describe('zoomIn', () => {
    it('should increase zoom by factor of 1.2', () => {
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.zoomIn()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      // Check the function passed to setEditorState
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.zoom).toBe(1.2)
    })

    it('should not zoom beyond maximum limit of 5', () => {
      mockEditorState.viewerState.zoom = 5
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.zoomIn()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.zoom).toBe(5) // Should remain at max
    })

    it('should preserve other viewerState properties', () => {
      mockEditorState.viewerState = {
        zoom: 1,
        panX: 100,
        panY: 200,
        isDragging: true,
        dragStart: { x: 50, y: 75 }
      }
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.zoomIn()
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.panX).toBe(100)
      expect(newState.viewerState.panY).toBe(200)
      expect(newState.viewerState.isDragging).toBe(true)
      expect(newState.viewerState.dragStart).toEqual({ x: 50, y: 75 })
    })
  })

  describe('zoomOut', () => {
    it('should decrease zoom by factor of 1.2', () => {
      mockEditorState.viewerState.zoom = 2.4
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.zoomOut()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.zoom).toBe(2)
    })

    it('should not zoom below minimum limit of 0.25', () => {
      mockEditorState.viewerState.zoom = 0.25
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.zoomOut()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.zoom).toBe(0.25) // Should remain at min
    })

    it('should preserve other viewerState properties', () => {
      mockEditorState.viewerState = {
        zoom: 2,
        panX: 150,
        panY: 250,
        isDragging: false,
        dragStart: { x: 10, y: 20 }
      }
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.zoomOut()
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.panX).toBe(150)
      expect(newState.viewerState.panY).toBe(250)
      expect(newState.viewerState.isDragging).toBe(false)
      expect(newState.viewerState.dragStart).toEqual({ x: 10, y: 20 })
    })
  })

  describe('resetZoom', () => {
    it('should reset zoom to 1 and pan to 0,0', () => {
      mockEditorState.viewerState = {
        zoom: 3.5,
        panX: 200,
        panY: 150,
        isDragging: true,
        dragStart: { x: 30, y: 40 }
      }
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.resetZoom()
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.zoom).toBe(1)
      expect(newState.viewerState.panX).toBe(0)
      expect(newState.viewerState.panY).toBe(0)
    })

    it('should preserve other viewerState properties', () => {
      mockEditorState.viewerState = {
        zoom: 2.5,
        panX: 100,
        panY: 200,
        isDragging: true,
        dragStart: { x: 25, y: 35 }
      }
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.resetZoom()
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.isDragging).toBe(true)
      expect(newState.viewerState.dragStart).toEqual({ x: 25, y: 35 })
    })
  })

  describe('pan', () => {
    it('should add delta values to current pan position', () => {
      mockEditorState.viewerState = {
        zoom: 1.5,
        panX: 50,
        panY: 75,
        isDragging: false,
        dragStart: { x: 0, y: 0 }
      }
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.pan(20, -10)
      })

      expect(mockSetEditorState).toHaveBeenCalledWith(expect.any(Function))
      
      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.panX).toBe(70) // 50 + 20
      expect(newState.viewerState.panY).toBe(65) // 75 + (-10)
    })

    it('should handle negative delta values', () => {
      mockEditorState.viewerState = {
        zoom: 1,
        panX: 100,
        panY: 100,
        isDragging: false,
        dragStart: { x: 0, y: 0 }
      }
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.pan(-30, -50)
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.panX).toBe(70) // 100 + (-30)
      expect(newState.viewerState.panY).toBe(50) // 100 + (-50)
    })

    it('should preserve other viewerState properties', () => {
      mockEditorState.viewerState = {
        zoom: 2.0,
        panX: 0,
        panY: 0,
        isDragging: true,
        dragStart: { x: 15, y: 25 }
      }
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.pan(10, 20)
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.zoom).toBe(2.0)
      expect(newState.viewerState.isDragging).toBe(true)
      expect(newState.viewerState.dragStart).toEqual({ x: 15, y: 25 })
    })

    it('should handle zero delta values', () => {
      mockEditorState.viewerState = {
        zoom: 1,
        panX: 100,
        panY: 100,
        isDragging: false,
        dragStart: { x: 0, y: 0 }
      }
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.pan(0, 0)
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.panX).toBe(100) // No change
      expect(newState.viewerState.panY).toBe(100) // No change
    })
  })

  describe('hook dependencies', () => {
    it('should update callbacks when setEditorState changes', () => {
      const newSetEditorState = jest.fn()
      
      const { result, rerender } = renderHook(
        ({ setEditorState }) => useCanvasState(mockEditorState, setEditorState),
        { 
          initialProps: { setEditorState: mockSetEditorState } 
        }
      )

      const initialZoomIn = result.current.zoomIn
      
      rerender({ setEditorState: newSetEditorState })

      // Callbacks should be different due to dependency changes
      expect(result.current.zoomIn).not.toBe(initialZoomIn)
    })
  })

  describe('edge cases', () => {
    it('should handle very small zoom increments correctly', () => {
      mockEditorState.viewerState.zoom = 0.3
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.zoomOut()
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.zoom).toBe(0.25) // Should hit minimum
    })

    it('should handle very large zoom increments correctly', () => {
      mockEditorState.viewerState.zoom = 4.5
      
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.zoomIn()
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.zoom).toBe(5) // Should hit maximum
    })

    it('should handle very large pan values', () => {
      const { result } = renderHook(() => 
        useCanvasState(mockEditorState, mockSetEditorState)
      )

      act(() => {
        result.current.pan(999999, -999999)
      })

      const updateFunction = mockSetEditorState.mock.calls[0][0]
      const newState = updateFunction(mockEditorState)
      
      expect(newState.viewerState.panX).toBe(999999)
      expect(newState.viewerState.panY).toBe(-999999)
    })
  })
})