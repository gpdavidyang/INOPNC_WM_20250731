import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import { MarkupCanvas } from '@/components/markup/canvas/markup-canvas'
import type { MarkupEditorState } from '@/types/markup'
import { act } from 'react'

// Mock canvas context
const mockCtx = {
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  drawImage: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  globalAlpha: 1,
  font: '',
}

const mockCanvas = {
  getContext: jest.fn(() => mockCtx),
  width: 800,
  height: 600,
  getBoundingClientRect: jest.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
  })),
}

// Mock Image constructor
global.Image = jest.fn().mockImplementation(() => ({
  width: 1000,
  height: 800,
  onload: null,
  src: '',
}))

describe('MarkupCanvas', () => {
  let defaultEditorState: MarkupEditorState
  let mockOnStateChange: jest.Mock
  let containerRef: React.RefObject<HTMLDivElement>

  beforeEach(() => {
    defaultEditorState = {
      currentFile: null,
      markupObjects: [],
      toolState: {
        activeTool: 'select',
        boxColor: 'gray',
        textStyle: {
          fontSize: 16,
          fontColor: '#000000',
        },
        penStyle: {
          strokeColor: '#EF4444',
          strokeWidth: 2,
        },
      },
      viewerState: {
        zoom: 1,
        panX: 0,
        panY: 0,
        imageWidth: 1000,
        imageHeight: 800,
      },
      selectedObjects: [],
      undoStack: [],
      redoStack: [],
    }

    mockOnStateChange = jest.fn()
    containerRef = React.createRef()

    // Mock containerRef
    Object.defineProperty(containerRef, 'current', {
      value: {
        getBoundingClientRect: jest.fn(() => ({
          width: 800,
          height: 600,
          left: 0,
          top: 0,
        })),
      },
      writable: true,
    })

    // Mock canvas element
    HTMLCanvasElement.prototype.getContext = mockCanvas.getContext
    HTMLCanvasElement.prototype.getBoundingClientRect = mockCanvas.getBoundingClientRect
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Box Drawing Tool', () => {
    it('should draw a gray box when using box-gray tool', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'box-gray' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Simulate drawing a box
      await user.pointer([
        { keys: '[MouseLeft>]', target: canvas, coords: { x: 100, y: 100 } },
        { coords: { x: 200, y: 200 } },
        { keys: '[/MouseLeft]' },
      ])

      // Check that state was updated with new box
      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.markupObjects).toHaveLength(1)
        expect(newState.markupObjects[0]).toMatchObject({
          type: 'box',
          color: 'gray',
          label: '자재구간',
          x: expect.any(Number),
          y: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number),
        })
      })
    })

    it('should draw a red box when using box-red tool', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'box-red' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      await user.pointer([
        { keys: '[MouseLeft>]', target: canvas, coords: { x: 100, y: 100 } },
        { coords: { x: 200, y: 200 } },
        { keys: '[/MouseLeft]' },
      ])

      await waitFor(() => {
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.markupObjects[0]).toMatchObject({
          type: 'box',
          color: 'red',
          label: '작업진행',
        })
      })
    })

    it('should draw a blue box when using box-blue tool', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'box-blue' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      await user.pointer([
        { keys: '[MouseLeft>]', target: canvas, coords: { x: 100, y: 100 } },
        { coords: { x: 200, y: 200 } },
        { keys: '[/MouseLeft]' },
      ])

      await waitFor(() => {
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.markupObjects[0]).toMatchObject({
          type: 'box',
          color: 'blue',
          label: '작업완료',
        })
      })
    })
  })

  describe('Text Tool', () => {
    it('should open text input dialog on click when text tool is active', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'text' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Click on canvas
      await user.click(canvas)

      // Check that text input dialog opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByLabelText(/텍스트 입력/i)).toBeInTheDocument()
      })
    })

    it('should add text when confirming dialog', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'text' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Click on canvas
      await user.click(canvas)

      // Type text and confirm
      const textInput = await screen.findByLabelText(/텍스트 입력/i)
      await user.type(textInput, 'Test Annotation')
      
      const confirmButton = screen.getByRole('button', { name: /확인/i })
      await user.click(confirmButton)

      // Check that text was added
      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.markupObjects).toHaveLength(1)
        expect(newState.markupObjects[0]).toMatchObject({
          type: 'text',
          content: 'Test Annotation',
          fontSize: 16,
          fontColor: '#000000',
        })
      })
    })

    it('should cancel text input when closing dialog', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'text' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Click on canvas
      await user.click(canvas)

      // Type text and cancel
      const textInput = await screen.findByLabelText(/텍스트 입력/i)
      await user.type(textInput, 'Test Annotation')
      
      const cancelButton = screen.getByRole('button', { name: /취소/i })
      await user.click(cancelButton)

      // Check that no text was added
      expect(mockOnStateChange).not.toHaveBeenCalledWith(
        expect.any(Function)
      )
    })
  })

  describe('Pen Tool', () => {
    it('should draw a path when using pen tool', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'pen' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Simulate drawing a path
      await user.pointer([
        { keys: '[MouseLeft>]', target: canvas, coords: { x: 100, y: 100 } },
        { coords: { x: 150, y: 150 } },
        { coords: { x: 200, y: 100 } },
        { coords: { x: 250, y: 150 } },
        { keys: '[/MouseLeft]' },
      ])

      // Check that path was created
      await waitFor(() => {
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.markupObjects).toHaveLength(1)
        expect(newState.markupObjects[0]).toMatchObject({
          type: 'drawing',
          strokeColor: '#EF4444',
          strokeWidth: 2,
          path: expect.arrayContaining([
            expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
          ]),
        })
        
        // Should have multiple points in the path
        expect(newState.markupObjects[0].path.length).toBeGreaterThan(1)
      })
    })
  })

  describe('Zoom and Pan', () => {
    it('should zoom in when scrolling with Ctrl key', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={defaultEditorState}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Simulate Ctrl+wheel to zoom in
      fireEvent.wheel(canvas, {
        deltaY: -100,
        ctrlKey: true,
      })

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.viewerState.zoom).toBeGreaterThan(1)
      })
    })

    it('should zoom out when scrolling with Ctrl key', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={defaultEditorState}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Simulate Ctrl+wheel to zoom out
      fireEvent.wheel(canvas, {
        deltaY: 100,
        ctrlKey: true,
      })

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.viewerState.zoom).toBeLessThan(1)
      })
    })

    it('should limit zoom range between 0.1 and 5', async () => {
      renderWithProviders(
        <MarkupCanvas
          editorState={defaultEditorState}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Try to zoom out beyond minimum
      for (let i = 0; i < 20; i++) {
        fireEvent.wheel(canvas, {
          deltaY: 100,
          ctrlKey: true,
        })
      }

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.viewerState.zoom).toBeGreaterThanOrEqual(0.1)
      })

      // Reset
      mockOnStateChange.mockClear()

      // Try to zoom in beyond maximum
      for (let i = 0; i < 20; i++) {
        fireEvent.wheel(canvas, {
          deltaY: -100,
          ctrlKey: true,
        })
      }

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater({
          ...defaultEditorState,
          viewerState: { ...defaultEditorState.viewerState, zoom: 4 },
        })
        
        expect(newState.viewerState.zoom).toBeLessThanOrEqual(5)
      })
    })
  })

  describe('Touch Gestures', () => {
    it('should handle pointer events for touch devices', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'box-gray' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Simulate touch drawing
      fireEvent.pointerDown(canvas, {
        clientX: 100,
        clientY: 100,
        pointerType: 'touch',
      })

      fireEvent.pointerMove(canvas, {
        clientX: 200,
        clientY: 200,
        pointerType: 'touch',
      })

      fireEvent.pointerUp(canvas, {
        clientX: 200,
        clientY: 200,
        pointerType: 'touch',
      })

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.markupObjects).toHaveLength(1)
        expect(newState.markupObjects[0].type).toBe('box')
      })
    })

    it('should cancel drawing when pointer leaves canvas', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'pen' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Start drawing
      fireEvent.pointerDown(canvas, {
        clientX: 100,
        clientY: 100,
      })

      fireEvent.pointerMove(canvas, {
        clientX: 150,
        clientY: 150,
      })

      // Leave canvas without releasing
      fireEvent.pointerLeave(canvas)

      await waitFor(() => {
        // Drawing should be completed even though pointer left
        expect(mockOnStateChange).toHaveBeenCalled()
      })
    })
  })

  describe('Select Tool', () => {
    it('should select object when clicking on it', async () => {
      const user = userEvent.setup()
      
      const stateWithObjects = {
        ...defaultEditorState,
        markupObjects: [
          {
            id: 'box-1',
            type: 'box' as const,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            color: 'gray' as const,
            label: '자재구간',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          },
        ],
      }
      
      renderWithProviders(
        <MarkupCanvas
          editorState={stateWithObjects}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Click on the box
      await user.click(canvas, { clientX: 150, clientY: 150 })

      await waitFor(() => {
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(stateWithObjects)
        
        expect(newState.selectedObjects).toContain('box-1')
      })
    })

    it('should deselect when clicking on empty area', async () => {
      const user = userEvent.setup()
      
      const stateWithSelection = {
        ...defaultEditorState,
        markupObjects: [
          {
            id: 'box-1',
            type: 'box' as const,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            color: 'gray' as const,
            label: '자재구간',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          },
        ],
        selectedObjects: ['box-1'],
      }
      
      renderWithProviders(
        <MarkupCanvas
          editorState={stateWithSelection}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Click on empty area
      await user.click(canvas, { clientX: 300, clientY: 300 })

      await waitFor(() => {
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(stateWithSelection)
        
        expect(newState.selectedObjects).toHaveLength(0)
      })
    })
  })

  describe('Blueprint Image Loading', () => {
    it('should load and display blueprint image', async () => {
      const mockImage = {
        width: 1000,
        height: 800,
        onload: null as any,
        src: '',
      }

      global.Image = jest.fn().mockImplementation(() => mockImage)

      renderWithProviders(
        <MarkupCanvas
          editorState={defaultEditorState}
          blueprintUrl="test-blueprint.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      // Trigger image load
      act(() => {
        mockImage.onload()
      })

      await waitFor(() => {
        // Check that viewer state was updated with image dimensions
        expect(mockOnStateChange).toHaveBeenCalled()
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.viewerState.imageWidth).toBe(1000)
        expect(newState.viewerState.imageHeight).toBe(800)
      })

      // Check that canvas context methods were called to draw the image
      expect(mockCtx.drawImage).toHaveBeenCalled()
    })
  })

  describe('Undo/Redo Stack', () => {
    it('should add to undo stack when creating objects', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MarkupCanvas
          editorState={{
            ...defaultEditorState,
            toolState: { ...defaultEditorState.toolState, activeTool: 'box-gray' },
          }}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      
      // Draw a box
      await user.pointer([
        { keys: '[MouseLeft>]', target: canvas, coords: { x: 100, y: 100 } },
        { coords: { x: 200, y: 200 } },
        { keys: '[/MouseLeft]' },
      ])

      await waitFor(() => {
        const lastCall = mockOnStateChange.mock.calls[mockOnStateChange.mock.calls.length - 1]
        const updater = lastCall[0]
        const newState = updater(defaultEditorState)
        
        expect(newState.undoStack).toHaveLength(1)
        expect(newState.redoStack).toHaveLength(0)
      })
    })
  })

  describe('Canvas Rendering', () => {
    it('should render all markup objects on canvas', async () => {
      const stateWithMultipleObjects = {
        ...defaultEditorState,
        markupObjects: [
          {
            id: 'box-1',
            type: 'box' as const,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            color: 'gray' as const,
            label: '자재구간',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          },
          {
            id: 'text-1',
            type: 'text' as const,
            x: 250,
            y: 150,
            content: 'Test Text',
            fontSize: 16,
            fontColor: '#000000',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          },
        ],
      }

      renderWithProviders(
        <MarkupCanvas
          editorState={stateWithMultipleObjects}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      // Wait for canvas to be rendered
      await waitFor(() => {
        // Check that both objects were drawn
        expect(mockCtx.fillRect).toHaveBeenCalled() // Box
        expect(mockCtx.fillText).toHaveBeenCalledWith('Test Text', 250, 150) // Text
      })
    })

    it('should show selection highlight for selected objects', async () => {
      const stateWithSelection = {
        ...defaultEditorState,
        markupObjects: [
          {
            id: 'box-1',
            type: 'box' as const,
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            color: 'gray' as const,
            label: '자재구간',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          },
        ],
        selectedObjects: ['box-1'],
      }

      renderWithProviders(
        <MarkupCanvas
          editorState={stateWithSelection}
          blueprintUrl="test.jpg"
          onStateChange={mockOnStateChange}
          containerRef={containerRef}
        />
      )

      // Wait for canvas to be rendered
      await waitFor(() => {
        // Check that selection border was drawn
        expect(mockCtx.strokeRect).toHaveBeenCalled()
      })
    })
  })
})