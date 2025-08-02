import { renderHook, act } from '@testing-library/react'
import { useKeyboardNavigation, useFocusTrap, useRovingTabIndex } from '@/hooks/use-keyboard-navigation'

// Mock DOM methods
const mockAddEventListener = jest.fn()
const mockRemoveEventListener = jest.fn()
const mockFocus = jest.fn()
const mockQuerySelectorAll = jest.fn()

// Store original methods
const originalAddEventListener = document.addEventListener
const originalRemoveEventListener = document.removeEventListener

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.addEventListener = mockAddEventListener
    document.removeEventListener = mockRemoveEventListener
  })

  afterEach(() => {
    document.addEventListener = originalAddEventListener
    document.removeEventListener = originalRemoveEventListener
  })

  it('should add keydown event listener when enabled', () => {
    renderHook(() => useKeyboardNavigation({ enabled: true }))
    
    expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should not add event listener when disabled', () => {
    renderHook(() => useKeyboardNavigation({ enabled: false }))
    
    expect(mockAddEventListener).not.toHaveBeenCalled()
  })

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardNavigation({ enabled: true }))
    
    unmount()
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  describe('keyboard event handling', () => {
    let keydownHandler: (e: KeyboardEvent) => void

    beforeEach(() => {
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'keydown') {
          keydownHandler = handler
        }
      })
    })

    it('should call onEscape when Escape key is pressed', () => {
      const onEscape = jest.fn()
      renderHook(() => useKeyboardNavigation({ onEscape }))

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
      
      act(() => {
        keydownHandler(event)
      })

      expect(onEscape).toHaveBeenCalled()
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should call onEnter when Enter key is pressed on non-interactive element', () => {
      const onEnter = jest.fn()
      renderHook(() => useKeyboardNavigation({ onEnter }))

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      Object.defineProperty(event, 'target', { 
        value: { tagName: 'DIV' } 
      })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
      
      act(() => {
        keydownHandler(event)
      })

      expect(onEnter).toHaveBeenCalled()
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should not call onEnter when Enter key is pressed on interactive element', () => {
      const onEnter = jest.fn()
      renderHook(() => useKeyboardNavigation({ onEnter }))

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      Object.defineProperty(event, 'target', { 
        value: { tagName: 'BUTTON' } 
      })
      
      act(() => {
        keydownHandler(event)
      })

      expect(onEnter).not.toHaveBeenCalled()
    })

    it('should call arrow key handlers', () => {
      const onArrowUp = jest.fn()
      const onArrowDown = jest.fn()
      const onArrowLeft = jest.fn()
      const onArrowRight = jest.fn()

      renderHook(() => useKeyboardNavigation({ 
        onArrowUp, 
        onArrowDown, 
        onArrowLeft, 
        onArrowRight 
      }))

      const arrowEvents = [
        { key: 'ArrowUp', handler: onArrowUp },
        { key: 'ArrowDown', handler: onArrowDown },
        { key: 'ArrowLeft', handler: onArrowLeft },
        { key: 'ArrowRight', handler: onArrowRight }
      ]

      arrowEvents.forEach(({ key, handler }) => {
        const event = new KeyboardEvent('keydown', { key })
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
        
        act(() => {
          keydownHandler(event)
        })

        expect(handler).toHaveBeenCalled()
        expect(preventDefaultSpy).toHaveBeenCalled()
      })
    })

    it('should handle Tab and Shift+Tab', () => {
      const onTab = jest.fn()
      const onShiftTab = jest.fn()

      renderHook(() => useKeyboardNavigation({ onTab, onShiftTab }))

      // Test Tab
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' })
      act(() => {
        keydownHandler(tabEvent)
      })
      expect(onTab).toHaveBeenCalledWith(tabEvent)

      // Test Shift+Tab
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      act(() => {
        keydownHandler(shiftTabEvent)
      })
      expect(onShiftTab).toHaveBeenCalledWith(shiftTabEvent)
    })

    it('should not handle events when disabled', () => {
      const onEscape = jest.fn()
      renderHook(() => useKeyboardNavigation({ onEscape, enabled: false }))

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      
      act(() => {
        keydownHandler(event)
      })

      expect(onEscape).not.toHaveBeenCalled()
    })
  })
})

describe('useFocusTrap', () => {
  let containerRef: React.RefObject<HTMLElement>
  let mockContainer: HTMLElement

  beforeEach(() => {
    jest.clearAllMocks()
    document.addEventListener = mockAddEventListener
    document.removeEventListener = mockRemoveEventListener
    
    // Create mock container
    mockContainer = {
      querySelectorAll: mockQuerySelectorAll,
      focus: mockFocus
    } as any

    containerRef = { current: mockContainer }
    
    // Mock focusable elements
    const mockButton1 = { focus: jest.fn() } as any
    const mockButton2 = { focus: jest.fn() } as any
    const focusableElements = [mockButton1, mockButton2]
    
    mockQuerySelectorAll.mockReturnValue(focusableElements)
    Object.defineProperty(document, 'activeElement', {
      value: mockButton1,
      configurable: true
    })
  })

  afterEach(() => {
    document.addEventListener = originalAddEventListener
    document.removeEventListener = originalRemoveEventListener
  })

  it('should add keydown event listener when enabled', () => {
    renderHook(() => useFocusTrap(containerRef, true))
    
    expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should not add event listener when disabled', () => {
    renderHook(() => useFocusTrap(containerRef, false))
    
    expect(mockAddEventListener).not.toHaveBeenCalled()
  })

  it('should focus first element when enabled', () => {
    const mockButton1 = { focus: jest.fn() } as any
    const mockButton2 = { focus: jest.fn() } as any
    mockQuerySelectorAll.mockReturnValue([mockButton1, mockButton2])

    renderHook(() => useFocusTrap(containerRef, true))
    
    expect(mockButton1.focus).toHaveBeenCalled()
  })

  describe('tab trapping', () => {
    let keydownHandler: (e: KeyboardEvent) => void

    beforeEach(() => {
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'keydown') {
          keydownHandler = handler
        }
      })
    })

    it('should trap focus from first to last element on Shift+Tab', () => {
      const mockButton1 = { focus: jest.fn() } as any
      const mockButton2 = { focus: jest.fn() } as any
      mockQuerySelectorAll.mockReturnValue([mockButton1, mockButton2])
      
      Object.defineProperty(document, 'activeElement', {
        value: mockButton1,
        configurable: true
      })

      renderHook(() => useFocusTrap(containerRef, true))

      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
      
      act(() => {
        keydownHandler(event)
      })

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(mockButton2.focus).toHaveBeenCalled()
    })

    it('should trap focus from last to first element on Tab', () => {
      const mockButton1 = { focus: jest.fn() } as any
      const mockButton2 = { focus: jest.fn() } as any
      mockQuerySelectorAll.mockReturnValue([mockButton1, mockButton2])
      
      Object.defineProperty(document, 'activeElement', {
        value: mockButton2,
        configurable: true
      })

      renderHook(() => useFocusTrap(containerRef, true))

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
      
      act(() => {
        keydownHandler(event)
      })

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(mockButton1.focus).toHaveBeenCalled()
    })

    it('should not trap focus when container is null', () => {
      const nullRef = { current: null }
      renderHook(() => useFocusTrap(nullRef, true))

      const event = new KeyboardEvent('keydown', { key: 'Tab' })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
      
      act(() => {
        keydownHandler(event)
      })

      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
  })
})

describe('useRovingTabIndex', () => {
  it('should initialize with provided initial index', () => {
    const { result } = renderHook(() => useRovingTabIndex(5, 2))
    
    expect(result.current.focusedIndex).toBe(2)
  })

  it('should initialize with default index 0', () => {
    const { result } = renderHook(() => useRovingTabIndex(5))
    
    expect(result.current.focusedIndex).toBe(0)
  })

  it('should provide getRovingProps function', () => {
    const { result } = renderHook(() => useRovingTabIndex(3))
    
    const props = result.current.getRovingProps(1)
    
    expect(props).toHaveProperty('tabIndex')
    expect(props).toHaveProperty('onKeyDown')
    expect(props).toHaveProperty('onFocus')
  })

  it('should set correct tabIndex for focused and non-focused items', () => {
    const { result } = renderHook(() => useRovingTabIndex(3, 1))
    
    const focusedProps = result.current.getRovingProps(1)
    const nonFocusedProps = result.current.getRovingProps(0)
    
    expect(focusedProps.tabIndex).toBe(0)
    expect(nonFocusedProps.tabIndex).toBe(-1)
  })

  it('should handle ArrowDown to move to next item', () => {
    const { result } = renderHook(() => useRovingTabIndex(3, 0))
    
    const props = result.current.getRovingProps(0)
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    
    act(() => {
      props.onKeyDown(event)
    })
    
    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(result.current.focusedIndex).toBe(1)
  })

  it('should handle ArrowUp to move to previous item', () => {
    const { result } = renderHook(() => useRovingTabIndex(3, 1))
    
    const props = result.current.getRovingProps(1)
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    
    act(() => {
      props.onKeyDown(event)
    })
    
    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(result.current.focusedIndex).toBe(0)
  })

  it('should wrap around when moving past boundaries', () => {
    const { result } = renderHook(() => useRovingTabIndex(3, 2))
    
    const props = result.current.getRovingProps(2)
    
    // Test wrapping from last to first
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    act(() => {
      props.onKeyDown(downEvent)
    })
    expect(result.current.focusedIndex).toBe(0)
    
    // Test wrapping from first to last
    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    act(() => {
      props.onKeyDown(upEvent)
    })
    expect(result.current.focusedIndex).toBe(2)
  })

  it('should handle Home key to go to first item', () => {
    const { result } = renderHook(() => useRovingTabIndex(5, 3))
    
    const props = result.current.getRovingProps(3)
    const event = new KeyboardEvent('keydown', { key: 'Home' })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    
    act(() => {
      props.onKeyDown(event)
    })
    
    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(result.current.focusedIndex).toBe(0)
  })

  it('should handle End key to go to last item', () => {
    const { result } = renderHook(() => useRovingTabIndex(5, 1))
    
    const props = result.current.getRovingProps(1)
    const event = new KeyboardEvent('keydown', { key: 'End' })
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault')
    
    act(() => {
      props.onKeyDown(event)
    })
    
    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(result.current.focusedIndex).toBe(4)
  })

  it('should update focused index on onFocus', () => {
    const { result } = renderHook(() => useRovingTabIndex(3, 0))
    
    const props = result.current.getRovingProps(2)
    
    act(() => {
      props.onFocus()
    })
    
    expect(result.current.focusedIndex).toBe(2)
  })

  it('should allow manual focus index setting', () => {
    const { result } = renderHook(() => useRovingTabIndex(5, 0))
    
    act(() => {
      result.current.setFocusedIndex(3)
    })
    
    expect(result.current.focusedIndex).toBe(3)
  })
})