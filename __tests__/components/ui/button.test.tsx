import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'

describe('Button Component', () => {
  it('should render with default props', () => {
    const { getByRole } = render(<Button>Click me</Button>)
    const button = getByRole('button')
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click me')
    expect(button).toHaveClass('bg-blue-600') // primary variant
    expect(button).toHaveClass('min-h-[48px]') // standard size
  })

  describe('Variants', () => {
    it('should render primary variant', () => {
      const { getByRole } = render(<Button variant="primary">Primary</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('bg-blue-600', 'hover:bg-blue-700', 'text-white')
    })

    it('should render secondary variant', () => {
      const { getByRole } = render(<Button variant="secondary">Secondary</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('bg-gray-100', 'text-gray-900')
    })

    it('should render danger variant', () => {
      const { getByRole } = render(<Button variant="danger">Danger</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('bg-red-600', 'hover:bg-red-700', 'text-white')
    })

    it('should render ghost variant', () => {
      const { getByRole } = render(<Button variant="ghost">Ghost</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('hover:bg-gray-100', 'text-gray-700')
    })

    it('should render outline variant', () => {
      const { getByRole } = render(<Button variant="outline">Outline</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('border-2', 'bg-transparent', 'border-gray-300')
    })
  })

  describe('Sizes', () => {
    it('should render compact size', () => {
      const { getByRole } = render(<Button size="compact">Compact</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm', 'min-h-[40px]')
    })

    it('should render standard size', () => {
      const { getByRole } = render(<Button size="standard">Standard</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('px-4', 'py-2', 'text-base', 'min-h-[48px]')
    })

    it('should render field size for construction conditions', () => {
      const { getByRole } = render(<Button size="field">Field</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('px-6', 'py-3', 'text-base', 'min-h-[60px]')
    })

    it('should render critical size for safety actions', () => {
      const { getByRole } = render(<Button size="critical">Critical</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('px-8', 'py-4', 'text-lg', 'min-h-[64px]')
    })

    it('should render full width size', () => {
      const { getByRole } = render(<Button size="full">Full Width</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('w-full', 'px-6', 'py-3', 'text-base', 'min-h-[48px]')
    })
  })

  describe('Touch Modes', () => {
    it('should render normal touch mode', () => {
      const { getByRole } = render(<Button touchMode="normal">Normal</Button>)
      const button = getByRole('button')
      
      // Normal mode has no additional classes
      expect(button).not.toHaveClass('min-h-[56px]')
      expect(button).not.toHaveClass('min-h-[44px]')
    })

    it('should render glove touch mode', () => {
      const { getByRole } = render(<Button touchMode="glove">Glove Mode</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('min-h-[56px]', 'px-6')
    })

    it('should render precision touch mode', () => {
      const { getByRole } = render(<Button touchMode="precision">Precision</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('min-h-[44px]', 'px-3')
    })
  })

  describe('Interactions', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn()
      const { getByRole } = render(<Button onClick={handleClick}>Click me</Button>)
      const button = getByRole('button')
      
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when disabled prop is true', () => {
      const handleClick = jest.fn()
      const { getByRole } = render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      )
      const button = getByRole('button')
      
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
      
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('should have active scale effect', () => {
      const { getByRole } = render(<Button>Active</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('active:scale-95')
    })

    it('should have focus styles', () => {
      const { getByRole } = render(<Button>Focus</Button>)
      const button = getByRole('button')
      
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-offset-2')
    })
  })

  describe('Custom props', () => {
    it('should accept custom className', () => {
      const { getByRole } = render(
        <Button className="custom-class">Custom</Button>
      )
      const button = getByRole('button')
      
      expect(button).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Button ref={ref}>Ref Button</Button>)
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })

    it('should accept HTML button attributes', () => {
      const { getByRole } = render(
        <Button type="submit" aria-label="Submit form">
          Submit
        </Button>
      )
      const button = getByRole('button')
      
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('aria-label', 'Submit form')
    })

    it('should render as span when asChild is true', () => {
      const { container } = render(
        <Button asChild>
          <a href="/link">Link Button</a>
        </Button>
      )
      
      const span = container.querySelector('span')
      expect(span).toBeInTheDocument()
      expect(span).toHaveClass('bg-blue-600') // Styles are applied
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { getByRole } = render(
        <Button aria-pressed="true" aria-describedby="description">
          Accessible
        </Button>
      )
      const button = getByRole('button')
      
      expect(button).toHaveAttribute('aria-pressed', 'true')
      expect(button).toHaveAttribute('aria-describedby', 'description')
    })

    it('should be keyboard accessible', () => {
      const handleClick = jest.fn()
      const { getByRole } = render(<Button onClick={handleClick}>Keyboard</Button>)
      const button = getByRole('button')
      
      // Focus the button
      button.focus()
      expect(document.activeElement).toBe(button)
      
      // Simulate Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('buttonVariants utility', () => {
    it('should generate correct classes', () => {
      const classes = buttonVariants({
        variant: 'danger',
        size: 'field',
        touchMode: 'glove'
      })
      
      expect(classes).toContain('bg-red-600')
      expect(classes).toContain('min-h-[60px]')
      expect(classes).toContain('min-h-[56px]')
    })
  })
})