/**
 * Tests for WeatherResistantButton Component
 * 
 * Testing the weather-resistant button UI component
 * for Task 14
 */

import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { WeatherResistantButton } from '@/components/ui/weather-resistant-button'

describe('WeatherResistantButton Component', () => {
  describe('Rendering', () => {
    it('should render button with children', () => {
      render(<WeatherResistantButton>Click Me</WeatherResistantButton>)
      
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument()
    })
    
    it('should render with default primary variant', () => {
      render(<WeatherResistantButton>Primary Button</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-700')
    })
    
    it('should render weather-resistant overlay by default', () => {
      const { container } = render(<WeatherResistantButton>Button</WeatherResistantButton>)
      
      const overlay = container.querySelector('[aria-hidden="true"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('bg-gradient-to-b', 'from-white/10', 'to-transparent')
    })
  })
  
  describe('Variants', () => {
    it('should apply primary variant styles', () => {
      render(<WeatherResistantButton variant="primary">Primary</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-700', 'border-blue-800', 'text-white')
    })
    
    it('should apply secondary variant styles', () => {
      render(<WeatherResistantButton variant="secondary">Secondary</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gray-200', 'border-gray-400', 'text-gray-900')
    })
    
    it('should apply danger variant styles', () => {
      render(<WeatherResistantButton variant="danger">Danger</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-700', 'border-red-800', 'text-white')
    })
    
    it('should apply success variant styles', () => {
      render(<WeatherResistantButton variant="success">Success</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-green-700', 'border-green-800', 'text-white')
    })
  })
  
  describe('Sizes', () => {
    it('should apply small size with weather-resistant minimum', () => {
      render(<WeatherResistantButton size="sm">Small</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[52px]', 'min-w-[52px]', 'text-sm')
    })
    
    it('should apply medium size with weather-resistant minimum', () => {
      render(<WeatherResistantButton size="md">Medium</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[56px]', 'min-w-[56px]', 'text-base')
    })
    
    it('should apply large size with weather-resistant minimum', () => {
      render(<WeatherResistantButton size="lg">Large</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[64px]', 'min-w-[64px]', 'text-lg')
    })
    
    it('should apply extra large size with weather-resistant minimum', () => {
      render(<WeatherResistantButton size="xl">Extra Large</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[72px]', 'min-w-[72px]', 'text-xl')
    })
  })
  
  describe('Weather Mode', () => {
    it('should apply weather-resistant styles when enabled', () => {
      render(<WeatherResistantButton isWeatherMode={true}>Weather Mode</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-2', 'shadow-lg', 'select-none')
      expect(button).toHaveClass('ring-4', 'ring-blue-500/20')
    })
    
    it('should apply normal styles when weather mode disabled', () => {
      render(<WeatherResistantButton isWeatherMode={false}>Normal Mode</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-blue-600') // Normal primary color
      expect(button).not.toHaveClass('ring-4')
      
      // Check no overlay
      const { container } = render(<WeatherResistantButton isWeatherMode={false}>Normal</WeatherResistantButton>)
      const overlay = container.querySelector('[aria-hidden="true"]')
      expect(overlay).not.toBeInTheDocument()
    })
    
    it('should have smaller touch targets without weather mode', () => {
      render(<WeatherResistantButton isWeatherMode={false} size="sm">Small Normal</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]') // Smaller than weather mode
    })
  })
  
  describe('Interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<WeatherResistantButton onClick={handleClick}>Click Me</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
    
    it('should apply active scale transform', () => {
      render(<WeatherResistantButton>Active Button</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('active:scale-95')
    })
    
    it('should be keyboard focusable', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <button>First</button>
          <WeatherResistantButton>Weather Button</WeatherResistantButton>
        </div>
      )
      
      await user.tab()
      await user.tab()
      
      const weatherButton = screen.getByRole('button', { name: 'Weather Button' })
      expect(weatherButton).toHaveFocus()
    })
    
    it('should show focus ring', () => {
      render(<WeatherResistantButton>Focus Me</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-offset-2')
    })
  })
  
  describe('Disabled State', () => {
    it('should handle disabled state', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(
        <WeatherResistantButton disabled onClick={handleClick}>
          Disabled Button
        </WeatherResistantButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
      
      await user.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })
  
  describe('Custom Props', () => {
    it('should accept custom className', () => {
      render(
        <WeatherResistantButton className="custom-class">
          Custom Class
        </WeatherResistantButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
    
    it('should forward refs', () => {
      const ref = React.createRef<HTMLButtonElement>()
      
      render(<WeatherResistantButton ref={ref}>Ref Button</WeatherResistantButton>)
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current?.textContent).toBe('Ref Button')
    })
    
    it('should pass through HTML button attributes', () => {
      render(
        <WeatherResistantButton 
          type="submit"
          form="test-form"
          aria-label="Submit Form"
        >
          Submit
        </WeatherResistantButton>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('form', 'test-form')
      expect(button).toHaveAttribute('aria-label', 'Submit Form')
    })
  })
  
  describe('Icon Support', () => {
    it('should support icons alongside text', () => {
      render(
        <WeatherResistantButton>
          <svg className="w-5 h-5" />
          <span>With Icon</span>
        </WeatherResistantButton>
      )
      
      const button = screen.getByRole('button')
      const innerSpan = button.querySelector('.flex.items-center.justify-center.gap-2')
      expect(innerSpan).toBeInTheDocument()
    })
  })
  
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<WeatherResistantButton>Accessible Button</WeatherResistantButton>)
      
      const button = screen.getByRole('button')
      expect(button).toBeAccessible()
    })
    
    it('should hide decorative overlay from screen readers', () => {
      const { container } = render(<WeatherResistantButton>Button</WeatherResistantButton>)
      
      const overlay = container.querySelector('[aria-hidden="true"]')
      expect(overlay).toHaveAttribute('aria-hidden', 'true')
    })
  })
})