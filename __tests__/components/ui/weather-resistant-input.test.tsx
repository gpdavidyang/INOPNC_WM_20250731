import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { WeatherResistantInput } from '@/components/ui/weather-resistant-input'

describe('WeatherResistantInput Component', () => {
  it('should render with default props', () => {
    const { getByRole } = render(<WeatherResistantInput />)
    const input = getByRole('textbox')
    
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('min-h-[48px]') // weather mode default
    expect(input).toHaveClass('border-2') // weather resistant border
  })

  describe('Variants', () => {
    it('should render default variant without weather mode', () => {
      const { getByRole } = render(
        <WeatherResistantInput isWeatherMode={false} variant="default" />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveClass('px-3', 'py-2', 'text-sm', 'min-h-[40px]')
      expect(input).not.toHaveClass('border-2', 'shadow-inner')
    })

    it('should render large variant', () => {
      const { getByRole } = render(
        <WeatherResistantInput variant="large" />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveClass('px-5', 'py-4', 'text-lg', 'min-h-[56px]')
    })

    it('should render xl variant', () => {
      const { getByRole } = render(
        <WeatherResistantInput variant="xl" />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveClass('px-6', 'py-5', 'text-xl', 'min-h-[64px]')
    })
  })

  describe('Weather Mode', () => {
    it('should apply weather-resistant styles when enabled', () => {
      const { getByRole } = render(<WeatherResistantInput isWeatherMode={true} />)
      const input = getByRole('textbox')
      
      expect(input).toHaveClass('border-2', 'shadow-inner', 'font-medium')
    })

    it('should render weather overlay', () => {
      const { container } = render(<WeatherResistantInput isWeatherMode={true} />)
      const overlay = container.querySelector('.pointer-events-none')
      
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveAttribute('aria-hidden', 'true')
    })

    it('should not render weather overlay when disabled', () => {
      const { container } = render(<WeatherResistantInput isWeatherMode={false} />)
      const overlay = container.querySelector('.pointer-events-none')
      
      expect(overlay).not.toBeInTheDocument()
    })
  })

  describe('Label and Help Text', () => {
    it('should render label', () => {
      const { getByLabelText } = render(
        <WeatherResistantInput label="Username" />
      )
      const input = getByLabelText('Username')
      
      expect(input).toBeInTheDocument()
    })

    it('should render required indicator', () => {
      const { getByText } = render(
        <WeatherResistantInput label="Email" required />
      )
      const asterisk = getByText('*')
      
      expect(asterisk).toBeInTheDocument()
      expect(asterisk).toHaveClass('text-red-500')
      expect(asterisk).toHaveAttribute('aria-label', '필수 입력')
    })

    it('should render help text', () => {
      const { getByText } = render(
        <WeatherResistantInput helpText="Enter your full name" />
      )
      const help = getByText('Enter your full name')
      
      expect(help).toBeInTheDocument()
      expect(help).toHaveClass('text-gray-600')
    })

    it('should associate help text with input', () => {
      const { getByRole, getByText } = render(
        <WeatherResistantInput helpText="Enter your email address" />
      )
      const input = getByRole('textbox')
      const help = getByText('Enter your email address')
      
      expect(help).toHaveAttribute('id')
      expect(input).toHaveAttribute('aria-describedby', help.id)
    })
  })

  describe('Error States', () => {
    it('should render error message', () => {
      const { getByText, getByRole } = render(
        <WeatherResistantInput error="This field is required" />
      )
      const error = getByText('This field is required')
      const input = getByRole('textbox')
      
      expect(error).toBeInTheDocument()
      expect(error).toHaveClass('text-red-600')
      expect(error).toHaveAttribute('role', 'alert')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should style input with error', () => {
      const { getByRole } = render(
        <WeatherResistantInput error="Invalid input" isWeatherMode={false} />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveClass('border-red-500', 'focus:border-red-500')
    })

    it('should style input with error in weather mode', () => {
      const { getByRole } = render(
        <WeatherResistantInput error="Invalid input" isWeatherMode={true} />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveClass('border-red-600', 'border-2')
    })

    it('should hide help text when error is present', () => {
      const { queryByText } = render(
        <WeatherResistantInput 
          helpText="Enter your name" 
          error="Name is required" 
        />
      )
      
      expect(queryByText('Enter your name')).not.toBeInTheDocument()
      expect(queryByText('Name is required')).toBeInTheDocument()
    })

    it('should associate error with input', () => {
      const { getByRole, getByText } = render(
        <WeatherResistantInput error="Invalid email format" />
      )
      const input = getByRole('textbox')
      const error = getByText('Invalid email format')
      
      expect(error).toHaveAttribute('id')
      expect(input.getAttribute('aria-describedby')).toContain(error.id)
    })
  })

  describe('Interactions', () => {
    it('should handle value changes', () => {
      const handleChange = jest.fn()
      const { getByRole } = render(
        <WeatherResistantInput onChange={handleChange} />
      )
      const input = getByRole('textbox')
      
      fireEvent.change(input, { target: { value: 'test value' } })
      expect(handleChange).toHaveBeenCalled()
      expect(handleChange.mock.calls[0][0].target.value).toBe('test value')
    })

    it('should handle focus and blur', () => {
      const handleFocus = jest.fn()
      const handleBlur = jest.fn()
      const { getByRole } = render(
        <WeatherResistantInput onFocus={handleFocus} onBlur={handleBlur} />
      )
      const input = getByRole('textbox')
      
      fireEvent.focus(input)
      expect(handleFocus).toHaveBeenCalled()
      
      fireEvent.blur(input)
      expect(handleBlur).toHaveBeenCalled()
    })

    it('should be disabled when disabled prop is true', () => {
      const { getByRole } = render(
        <WeatherResistantInput disabled />
      )
      const input = getByRole('textbox')
      
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })
  })

  describe('Accessibility', () => {
    it('should generate unique IDs', () => {
      const { container } = render(
        <>
          <WeatherResistantInput label="Input 1" />
          <WeatherResistantInput label="Input 2" />
        </>
      )
      
      const inputs = container.querySelectorAll('input')
      const ids = Array.from(inputs).map(input => input.id)
      
      expect(ids[0]).toBeTruthy()
      expect(ids[1]).toBeTruthy()
      expect(ids[0]).not.toBe(ids[1])
    })

    it('should use provided ID', () => {
      const { getByRole } = render(
        <WeatherResistantInput id="custom-input-id" />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveAttribute('id', 'custom-input-id')
    })

    it('should have proper ARIA attributes', () => {
      const { getByRole } = render(
        <WeatherResistantInput 
          aria-label="Search"
          aria-required="true"
          aria-describedby="external-help"
        />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveAttribute('aria-label', 'Search')
      expect(input).toHaveAttribute('aria-required', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'external-help')
    })
  })

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      const { getByRole } = render(
        <WeatherResistantInput className="custom-class" />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveClass('custom-class')
    })

    it('should forward ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<WeatherResistantInput ref={ref} />)
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('should accept HTML input attributes', () => {
      const { getByRole } = render(
        <WeatherResistantInput 
          type="email"
          placeholder="Enter email"
          autoComplete="email"
          maxLength={100}
        />
      )
      const input = getByRole('textbox')
      
      expect(input).toHaveAttribute('type', 'email')
      expect(input).toHaveAttribute('placeholder', 'Enter email')
      expect(input).toHaveAttribute('autocomplete', 'email')
      expect(input).toHaveAttribute('maxlength', '100')
    })
  })

  describe('Dark Mode', () => {
    it('should have dark mode classes', () => {
      const { getByRole } = render(<WeatherResistantInput />)
      const input = getByRole('textbox')
      
      expect(input).toHaveClass(
        'dark:bg-gray-800',
        'dark:text-gray-100',
        'dark:border-gray-600'
      )
    })
  })
})