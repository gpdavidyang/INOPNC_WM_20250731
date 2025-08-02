import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

// Mock Radix UI Dialog components
jest.mock('@radix-ui/react-dialog', () => {
  const React = require('react')
  
  // Context to share state between components
  const DialogContext = React.createContext<any>({ isOpen: false, setIsOpen: () => {} })
  
  return {
    Root: ({ children, open, onOpenChange }: any) => {
      const [isOpen, setIsOpen] = React.useState(open || false)
      
      React.useEffect(() => {
        if (open !== undefined) setIsOpen(open)
      }, [open])
      
      const handleSetIsOpen = React.useCallback((newOpen: boolean) => {
        setIsOpen(newOpen)
        onOpenChange?.(newOpen)
      }, [onOpenChange])
      
      return (
        <DialogContext.Provider value={{ isOpen, setIsOpen: handleSetIsOpen }}>
          <div data-state={isOpen ? 'open' : 'closed'}>
            {children}
          </div>
        </DialogContext.Provider>
      )
    },
    Trigger: ({ children }: any) => {
      const { setIsOpen } = React.useContext(DialogContext)
      return (
        <button onClick={() => setIsOpen(true)} type="button">
          {children}
        </button>
      )
    },
    Portal: ({ children }: any) => children,
    Overlay: React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
      <div ref={ref} className={className} {...props} />
    )),
    Content: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => {
      const { isOpen } = React.useContext(DialogContext)
      return isOpen ? (
        <div ref={ref} className={className} data-state="open" {...props}>
          {children}
        </div>
      ) : null
    }),
    Close: ({ children, className }: any) => {
      const { setIsOpen } = React.useContext(DialogContext)
      return (
        <button className={className} onClick={() => setIsOpen(false)} type="button">
          {children}
        </button>
      )
    },
    Title: React.forwardRef<HTMLHeadingElement, any>(({ className, ...props }, ref) => (
      <h2 ref={ref} className={className} {...props} />
    )),
    Description: React.forwardRef<HTMLParagraphElement, any>(({ className, ...props }, ref) => (
      <p ref={ref} className={className} {...props} />
    )),
  }
})

describe('Dialog Component', () => {
  it('should render dialog trigger', () => {
    const { getByText } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    
    expect(getByText('Open Dialog')).toBeInTheDocument()
  })

  it('should open dialog when trigger is clicked', async () => {
    const { getByText, queryByText } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>This is a test dialog</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    
    expect(queryByText('Test Dialog')).not.toBeInTheDocument()
    
    fireEvent.click(getByText('Open Dialog'))
    
    await waitFor(() => {
      expect(getByText('Test Dialog')).toBeInTheDocument()
      expect(getByText('This is a test dialog')).toBeInTheDocument()
    })
  })

  it('should render with controlled open state', () => {
    const { getByText } = render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    
    expect(getByText('Controlled Dialog')).toBeInTheDocument()
  })

  it('should call onOpenChange when state changes', async () => {
    const handleOpenChange = jest.fn()
    const { getByText } = render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Test</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    
    fireEvent.click(getByText('Open'))
    
    await waitFor(() => {
      expect(handleOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('DialogContent', () => {
    it('should render close button', async () => {
      const { getByText, container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const closeButton = container.querySelector('.lucide-x')
      expect(closeButton).toBeInTheDocument()
      
      const srText = container.querySelector('.sr-only')
      expect(srText).toHaveTextContent('Close')
    })

    it('should have proper styles', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent className="custom-class">
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const content = container.querySelector('[data-state="open"]')
      // The first [data-state="open"] is the Root, the second is the Content
      const actualContent = content?.querySelector('[data-state="open"]') || content
      expect(actualContent).toHaveClass('custom-class')
      expect(actualContent).toHaveClass('fixed', 'left-[50%]', 'top-[50%]', 'z-50')
    })

    it('should render children', () => {
      const { getByText } = render(
        <Dialog open={true}>
          <DialogContent>
            <div>Custom content</div>
          </DialogContent>
        </Dialog>
      )
      
      expect(getByText('Custom content')).toBeInTheDocument()
    })
  })

  describe('DialogHeader', () => {
    it('should render header with proper styles', () => {
      const { getByText } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader className="custom-header">
              <DialogTitle>Header Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
      
      const header = getByText('Header Title').parentElement
      expect(header).toHaveClass('custom-header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5')
    })
  })

  describe('DialogFooter', () => {
    it('should render footer with proper styles', () => {
      const { getByText } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter className="custom-footer">
              <button>Cancel</button>
              <button>Save</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
      
      const footer = getByText('Cancel').parentElement
      expect(footer).toHaveClass('custom-footer')
      expect(footer).toHaveClass('flex', 'flex-col-reverse', 'sm:flex-row', 'sm:justify-end')
    })
  })

  describe('DialogTitle', () => {
    it('should render title with proper styles', () => {
      const { getByText } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle className="custom-title">Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const title = getByText('Dialog Title')
      expect(title).toHaveClass('custom-title')
      expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-none')
      expect(title.tagName).toBe('H2')
    })
  })

  describe('DialogDescription', () => {
    it('should render description with proper styles', () => {
      const { getByText } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription className="custom-description">
              This is a description
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      const description = getByText('This is a description')
      expect(description).toHaveClass('custom-description')
      expect(description).toHaveClass('text-sm', 'text-gray-500')
      expect(description.tagName).toBe('P')
    })
  })

  describe('Accessibility', () => {
    it('should have proper overlay styles', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
          </DialogContent>
        </Dialog>
      )
      
      const overlay = container.querySelector('.fixed.inset-0.z-50.bg-black\\/50')
      expect(overlay).toBeInTheDocument()
    })

    it('should support forwarding refs', () => {
      const titleRef = React.createRef<HTMLHeadingElement>()
      const descriptionRef = React.createRef<HTMLParagraphElement>()
      
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle ref={titleRef}>Title</DialogTitle>
            <DialogDescription ref={descriptionRef}>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )
      
      expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement)
      expect(descriptionRef.current).toBeInstanceOf(HTMLParagraphElement)
    })
  })

  describe('Complex Dialog Example', () => {
    it('should work with complete dialog structure', async () => {
      const handleSave = jest.fn()
      const handleCancel = jest.fn()
      
      const { getByText, queryByText } = render(
        <Dialog>
          <DialogTrigger>Open Profile</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div>
              <label>Name</label>
              <input type="text" defaultValue="John Doe" />
            </div>
            <DialogFooter>
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleSave}>Save changes</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
      
      // Initially closed
      expect(queryByText('Edit Profile')).not.toBeInTheDocument()
      
      // Open dialog
      fireEvent.click(getByText('Open Profile'))
      
      await waitFor(() => {
        expect(getByText('Edit Profile')).toBeInTheDocument()
        expect(getByText('Make changes to your profile here. Click save when you\'re done.')).toBeInTheDocument()
        expect(getByText('Save changes')).toBeInTheDocument()
      })
      
      // Test footer actions
      fireEvent.click(getByText('Save changes'))
      expect(handleSave).toHaveBeenCalled()
    })
  })
})