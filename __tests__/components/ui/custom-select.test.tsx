import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { CustomSelect } from '@/components/ui/custom-select'
import { Building2 } from 'lucide-react'

describe('CustomSelect Component', () => {
  const mockOptions = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3' },
  ]

  const defaultProps = {
    options: mockOptions,
    value: '',
    onChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render with default props', () => {
    const { getByRole } = render(<CustomSelect {...defaultProps} />)
    const button = getByRole('button')
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('선택하세요')
    expect(button).toHaveAttribute('aria-haspopup', 'listbox')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('should render with custom placeholder', () => {
    const { getByText } = render(
      <CustomSelect {...defaultProps} placeholder="Choose an option" />
    )
    
    expect(getByText('Choose an option')).toBeInTheDocument()
  })

  it('should render selected option label', () => {
    const { getByText } = render(
      <CustomSelect {...defaultProps} value="opt2" />
    )
    
    expect(getByText('Option 2')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    const { container } = render(
      <CustomSelect {...defaultProps} icon={<Building2 className="h-4 w-4" />} />
    )
    
    const icon = container.querySelector('.lucide-building2')
    expect(icon).toBeInTheDocument()
  })

  describe('Dropdown Behavior', () => {
    it('should open dropdown on click', () => {
      const { getByRole, queryAllByRole } = render(<CustomSelect {...defaultProps} />)
      const button = getByRole('button')
      
      expect(queryAllByRole('option')).toHaveLength(0)
      
      fireEvent.click(button)
      
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(queryAllByRole('option')).toHaveLength(3)
    })

    it('should close dropdown on second click', () => {
      const { getByRole, queryAllByRole } = render(<CustomSelect {...defaultProps} />)
      const button = getByRole('button')
      
      fireEvent.click(button)
      expect(queryAllByRole('option')).toHaveLength(3)
      
      fireEvent.click(button)
      expect(queryAllByRole('option')).toHaveLength(0)
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('should close dropdown when clicking outside', async () => {
      const { getByRole, queryAllByRole } = render(
        <div>
          <CustomSelect {...defaultProps} />
          <button>Outside button</button>
        </div>
      )
      const selectButton = getByRole('button', { name: /선택하세요/i })
      
      fireEvent.click(selectButton)
      expect(queryAllByRole('option')).toHaveLength(3)
      
      fireEvent.mouseDown(document.body)
      
      await waitFor(() => {
        expect(queryAllByRole('option')).toHaveLength(0)
      })
    })

    it('should not close when clicking inside dropdown', () => {
      const { getByRole, queryAllByRole, container } = render(
        <CustomSelect {...defaultProps} />
      )
      const button = getByRole('button')
      
      fireEvent.click(button)
      const dropdown = container.querySelector('.absolute')
      
      fireEvent.mouseDown(dropdown!)
      
      expect(queryAllByRole('option')).toHaveLength(3)
    })
  })

  describe('Option Selection', () => {
    it('should call onChange when option is selected', () => {
      const handleChange = jest.fn()
      const { getByRole, getByText } = render(
        <CustomSelect {...defaultProps} onChange={handleChange} />
      )
      
      fireEvent.click(getByRole('button'))
      fireEvent.click(getByText('Option 2'))
      
      expect(handleChange).toHaveBeenCalledWith('opt2')
    })

    it('should close dropdown after selection', async () => {
      const { getByRole, getByText, queryAllByRole } = render(
        <CustomSelect {...defaultProps} />
      )
      
      fireEvent.click(getByRole('button'))
      fireEvent.click(getByText('Option 2'))
      
      await waitFor(() => {
        expect(queryAllByRole('option')).toHaveLength(0)
      })
    })

    it('should highlight selected option', () => {
      const { getByRole, getAllByRole } = render(
        <CustomSelect {...defaultProps} value="opt2" />
      )
      
      fireEvent.click(getByRole('button'))
      const options = getAllByRole('option')
      
      expect(options[1]).toHaveAttribute('aria-selected', 'true')
      expect(options[1]).toHaveClass('bg-blue-50', 'text-blue-600')
      expect(options[0]).toHaveAttribute('aria-selected', 'false')
      expect(options[2]).toHaveAttribute('aria-selected', 'false')
    })

    it('should show check icon for selected option', () => {
      const { getByRole, container } = render(
        <CustomSelect {...defaultProps} value="opt2" />
      )
      
      fireEvent.click(getByRole('button'))
      const checkIcon = container.querySelector('.lucide-check')
      
      expect(checkIcon).toBeInTheDocument()
      expect(checkIcon?.closest('button')).toHaveTextContent('Option 2')
    })
  })

  describe('Visual States', () => {
    it('should rotate chevron when open', () => {
      const { getByRole, container } = render(<CustomSelect {...defaultProps} />)
      const chevron = container.querySelector('.lucide-chevron-down')
      
      expect(chevron).not.toHaveClass('rotate-180')
      
      fireEvent.click(getByRole('button'))
      
      expect(chevron).toHaveClass('rotate-180')
    })

    it('should apply hover styles to options', () => {
      const { getByRole, getAllByRole } = render(<CustomSelect {...defaultProps} />)
      
      fireEvent.click(getByRole('button'))
      const options = getAllByRole('option')
      
      expect(options[0]).toHaveClass('hover:bg-gray-50')
    })

    it('should apply custom className', () => {
      const { container } = render(
        <CustomSelect {...defaultProps} className="custom-select-class" />
      )
      
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('custom-select-class')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { getByRole, getAllByRole } = render(<CustomSelect {...defaultProps} />)
      const button = getByRole('button')
      
      expect(button).toHaveAttribute('aria-haspopup', 'listbox')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      
      fireEvent.click(button)
      
      expect(button).toHaveAttribute('aria-expanded', 'true')
      
      const options = getAllByRole('option')
      options.forEach((option, index) => {
        expect(option).toHaveAttribute('role', 'option')
        expect(option).toHaveAttribute('aria-selected', 'false')
      })
    })

    it('should be keyboard accessible', () => {
      const { getByRole } = render(<CustomSelect {...defaultProps} />)
      const button = getByRole('button')
      
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })

  describe('Dark Mode', () => {
    it('should have dark mode classes', () => {
      const { getByRole } = render(<CustomSelect {...defaultProps} />)
      const button = getByRole('button')
      
      expect(button).toHaveClass(
        'dark:bg-gray-700',
        'dark:border-gray-600',
        'dark:hover:border-gray-500'
      )
    })

    it('should apply dark mode styles to dropdown', () => {
      const { getByRole, container } = render(<CustomSelect {...defaultProps} />)
      
      fireEvent.click(getByRole('button'))
      const dropdown = container.querySelector('.absolute')
      
      expect(dropdown).toHaveClass('dark:bg-gray-700', 'dark:border-gray-600')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const { getByRole } = render(
        <CustomSelect {...defaultProps} options={[]} />
      )
      const button = getByRole('button')
      
      fireEvent.click(button)
      
      const dropdown = document.querySelector('.absolute')
      expect(dropdown).toBeInTheDocument()
      expect(dropdown).toBeEmptyDOMElement()
    })

    it('should handle invalid value gracefully', () => {
      const { getByText } = render(
        <CustomSelect {...defaultProps} value="invalid" />
      )
      
      expect(getByText('선택하세요')).toBeInTheDocument()
    })

    it('should cleanup event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { unmount } = render(<CustomSelect {...defaultProps} />)
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
  })
})