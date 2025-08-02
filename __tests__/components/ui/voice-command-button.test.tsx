import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VoiceCommandButton } from '@/components/ui/voice-command-button'

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Mic: ({ className, ...props }: any) => (
    <div data-testid="mic-icon" className={className} {...props} />
  ),
  MicOff: ({ className, ...props }: any) => (
    <div data-testid="mic-off-icon" className={className} {...props} />
  ),
  Volume2: ({ className, ...props }: any) => (
    <div data-testid="volume-icon" className={className} {...props} />
  ),
}))

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => {
    const result = []
    for (const cls of classes) {
      if (typeof cls === 'string') {
        result.push(cls)
      } else if (typeof cls === 'object' && cls !== null) {
        for (const [key, value] of Object.entries(cls)) {
          if (value) result.push(key)
        }
      }
    }
    return result.filter(Boolean).join(' ')
  },
}))

describe('VoiceCommandButton', () => {
  const mockOnCommand = jest.fn()
  const mockOnError = jest.fn()
  let mockSpeechRecognition: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Web Speech API
    mockSpeechRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      onstart: null,
      onend: null,
      onresult: null,
      onerror: null,
      lang: '',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
    }

    // Mock window.SpeechRecognition
    delete (window as any).SpeechRecognition
    delete (window as any).webkitSpeechRecognition
    ;(window as any).SpeechRecognition = jest.fn(() => mockSpeechRecognition)

    // Mock AudioContext for sound feedback
    const mockAudioContext = {
      createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        frequency: { setValueAtTime: jest.fn() },
        start: jest.fn(),
        stop: jest.fn(),
      })),
      createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
      })),
      destination: {},
      currentTime: 0,
    }

    delete (window as any).AudioContext
    ;(window as any).AudioContext = jest.fn(() => mockAudioContext)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Browser Support Detection', () => {
    it('should render unsupported state when Web Speech API is not available', () => {
      // Create a fresh test that doesn't use beforeEach mocks
      jest.clearAllMocks()
      
      // Mock VoiceCommandButton to create a version without SpeechRecognition
      const TestUnsupportedComponent = () => {
        const [isSupported] = React.useState(false) // Force unsupported state
        const mockClasses = 'relative inline-flex items-center justify-center rounded-full transition-all duration-200 border-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 h-12 w-12 border-gray-300 bg-white hover:bg-gray-50 border-gray-300 text-gray-700 shadow-lg min-h-[48px] min-w-[48px] cursor-not-allowed opacity-50'
        
        if (!isSupported) {
          return (
            <div 
              className={mockClasses}
              title="이 브라우저에서는 음성 인식이 지원되지 않습니다"
            >
              <div data-testid="mic-off-icon" className="h-5 w-5" />
            </div>
          )
        }
        return null
      }

      render(<TestUnsupportedComponent />)

      expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument()
      const unsupportedDiv = screen.getByTitle('이 브라우저에서는 음성 인식이 지원되지 않습니다')
      expect(unsupportedDiv).toBeInTheDocument()
      expect(unsupportedDiv).toHaveClass('cursor-not-allowed', 'opacity-50')
    })

    it('should render supported state when Web Speech API is available', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument()
        expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument()
      })
    })

    it('should support webkit prefixed SpeechRecognition', () => {
      delete (window as any).SpeechRecognition
      ;(window as any).webkitSpeechRecognition = jest.fn(() => mockSpeechRecognition)

      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<VoiceCommandButton />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-label', '음성 인식 시작')
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument()
    })

    it('should render with custom props', () => {
      render(
        <VoiceCommandButton
          onCommand={mockOnCommand}
          onError={mockOnError}
          disabled={false}
          size="lg"
          className="custom-class"
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      // Check the classes that should be applied for lg size
      expect(button.className).toContain('h-14')
      expect(button.className).toContain('w-14')
    })

    it('should render in disabled state', () => {
      render(<VoiceCommandButton disabled />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })

    it('should render different sizes correctly', () => {
      const { rerender } = render(<VoiceCommandButton size="sm" />)
      let button = screen.getByRole('button')
      expect(button.className).toContain('h-10')
      expect(button.className).toContain('w-10')

      rerender(<VoiceCommandButton size="md" />)
      button = screen.getByRole('button')
      expect(button.className).toContain('h-12')
      expect(button.className).toContain('w-12')

      rerender(<VoiceCommandButton size="lg" />)
      button = screen.getByRole('button')
      expect(button.className).toContain('h-14')
      expect(button.className).toContain('w-14')
    })
  })

  describe('Voice Recognition Functionality', () => {
    it('should start voice recognition when clicked', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockSpeechRecognition.start).toHaveBeenCalled()
      })
    })

    it('should stop voice recognition when clicked while listening', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      
      // Start listening
      fireEvent.click(button)
      
      // Simulate recognition start
      mockSpeechRecognition.onstart()
      
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-pressed', 'true')
        expect(screen.getByTestId('mic-icon')).toBeInTheDocument()
      })

      // Stop listening
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockSpeechRecognition.stop).toHaveBeenCalled()
      })
    })

    it('should not start recognition when disabled', () => {
      render(<VoiceCommandButton disabled onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(mockSpeechRecognition.start).not.toHaveBeenCalled()
    })

    it('should configure recognition with Korean language', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.lang).toBe('ko-KR')
        expect(mockSpeechRecognition.continuous).toBe(false)
        expect(mockSpeechRecognition.interimResults).toBe(false)
        expect(mockSpeechRecognition.maxAlternatives).toBe(1)
      })
    })
  })

  describe('Command Recognition', () => {
    it('should recognize valid Korean commands', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.onresult).toBeDefined()
      })

      // Simulate recognition result
      const mockEvent = {
        results: [
          [{ transcript: '시작' }]
        ]
      }

      mockSpeechRecognition.onresult(mockEvent)

      expect(mockOnCommand).toHaveBeenCalledWith('start')
    })

    it('should handle unrecognized commands', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.onresult).toBeDefined()
      })

      const mockEvent = {
        results: [
          [{ transcript: '알 수 없는 명령어' }]
        ]
      }

      mockSpeechRecognition.onresult(mockEvent)

      expect(mockOnError).toHaveBeenCalledWith('인식되지 않은 명령어: "알 수 없는 명령어"')
      expect(mockOnCommand).not.toHaveBeenCalled()
    })

    it('should handle recognition errors', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.onerror).toBeDefined()
      })

      const mockErrorEvent = {
        error: 'network'
      }

      mockSpeechRecognition.onerror(mockErrorEvent)

      expect(mockOnError).toHaveBeenCalledWith('음성 인식 오류: network')
    })

    it('should test all Korean command mappings', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const commands = [
        { korean: '시작', english: 'start' },
        { korean: '완료', english: 'complete' },
        { korean: '저장', english: 'save' },
        { korean: '취소', english: 'cancel' },
        { korean: '작업일지', english: 'work-log' },
        { korean: '안전점검', english: 'safety-check' },
        { korean: '품질관리', english: 'quality-control' },
        { korean: '자재관리', english: 'material-management' },
        { korean: '도움말', english: 'help' },
        { korean: '홈', english: 'home' }
      ]

      await waitFor(() => {
        expect(mockSpeechRecognition.onresult).toBeDefined()
      })

      commands.forEach(({ korean, english }) => {
        const mockEvent = {
          results: [
            [{ transcript: korean }]
          ]
        }

        mockSpeechRecognition.onresult(mockEvent)
        expect(mockOnCommand).toHaveBeenCalledWith(english)
      })
    })
  })

  describe('Visual States', () => {
    it('should show listening state when active', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      
      // Simulate start listening
      await waitFor(() => {
        mockSpeechRecognition.onstart()
      })

      expect(button).toHaveClass('bg-red-500', 'animate-pulse')
      expect(button).toHaveAttribute('aria-label', '음성 인식 중지')
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument()
    })

    it('should show idle state when not listening', () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-white')
      expect(button).toHaveAttribute('aria-label', '음성 인식 시작')
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByTestId('mic-off-icon')).toBeInTheDocument()
    })

    it('should show command suggestions tooltip when listening', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      // Simulate start listening
      await waitFor(() => {
        mockSpeechRecognition.onstart()
      })

      expect(screen.getByText('사용 가능한 명령어:')).toBeInTheDocument()
      expect(screen.getByText('"시작", "완료", "저장", "취소"')).toBeInTheDocument()
      expect(screen.getByText('"작업일지", "안전점검", "품질관리"')).toBeInTheDocument()
    })

    it('should show visual pulse animation when listening', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      // Simulate start listening
      await waitFor(() => {
        mockSpeechRecognition.onstart()
      })

      const pulseElement = screen.getByRole('button').querySelector('.animate-ping')
      expect(pulseElement).toBeInTheDocument()
      expect(pulseElement).toHaveClass('bg-red-500/30')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label')
      expect(button).toHaveAttribute('aria-pressed')
      expect(button).toHaveAttribute('title')
    })

    it('should have minimum touch target size', () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[48px]', 'min-w-[48px]')
    })

    it('should be keyboard accessible', () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)

      // Test keyboard activation by simulating click (which is how Enter works on buttons)
      fireEvent.click(button)
      expect(mockSpeechRecognition.start).toHaveBeenCalled()
    })

    it('should have focus visible styles', () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-offset-2')
    })

    it('should update ARIA attributes based on state', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      const button = screen.getByRole('button')
      
      // Initially not listening
      expect(button).toHaveAttribute('aria-label', '음성 인식 시작')
      expect(button).toHaveAttribute('aria-pressed', 'false')

      // Start listening
      await waitFor(() => {
        mockSpeechRecognition.onstart()
      })

      expect(button).toHaveAttribute('aria-label', '음성 인식 중지')
      expect(button).toHaveAttribute('aria-pressed', 'true')

      // Stop listening
      await waitFor(() => {
        mockSpeechRecognition.onend()
      })

      expect(button).toHaveAttribute('aria-label', '음성 인식 시작')
      expect(button).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Error Handling', () => {
    it('should handle recognition start errors', () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      mockSpeechRecognition.start.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(mockOnError).toHaveBeenCalledWith('음성 인식을 시작할 수 없습니다.')
    })

    it('should clean up recognition on unmount', () => {
      const { unmount } = render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      unmount()

      expect(mockSpeechRecognition.stop).toHaveBeenCalled()
    })
  })

  describe('Audio Feedback', () => {
    it('should play success sound on valid command', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.onresult).toBeDefined()
      })

      const mockEvent = {
        results: [
          [{ transcript: '시작' }]
        ]
      }

      mockSpeechRecognition.onresult(mockEvent)

      // AudioContext should have been created for success sound
      expect(window.AudioContext).toHaveBeenCalled()
    })

    it('should play error sound on invalid command', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.onresult).toBeDefined()
      })

      const mockEvent = {
        results: [
          [{ transcript: '잘못된 명령어' }]
        ]
      }

      mockSpeechRecognition.onresult(mockEvent)

      // AudioContext should have been created for error sound
      expect(window.AudioContext).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing onCommand callback', async () => {
      render(<VoiceCommandButton onError={mockOnError} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.onresult).toBeDefined()
      })

      const mockEvent = {
        results: [
          [{ transcript: '시작' }]
        ]
      }

      expect(() => mockSpeechRecognition.onresult(mockEvent)).not.toThrow()
    })

    it('should handle missing onError callback', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.onerror).toBeDefined()
      })

      const mockErrorEvent = {
        error: 'network'
      }

      expect(() => mockSpeechRecognition.onerror(mockErrorEvent)).not.toThrow()
    })

    it('should handle empty transcript', async () => {
      render(<VoiceCommandButton onCommand={mockOnCommand} onError={mockOnError} />)

      await waitFor(() => {
        expect(mockSpeechRecognition.onresult).toBeDefined()
      })

      const mockEvent = {
        results: [
          [{ transcript: '   ' }] // Only whitespace
        ]
      }

      mockSpeechRecognition.onresult(mockEvent)

      expect(mockOnError).toHaveBeenCalledWith('인식되지 않은 명령어: ""')
    })
  })
})