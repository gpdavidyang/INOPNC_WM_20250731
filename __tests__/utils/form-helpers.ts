/**
 * Form testing utilities with proper act() integration
 * Provides helpers for testing form components and validation
 */

import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { actAsync, waitForStateUpdate } from './async-helpers'

/**
 * Helper to fill out form fields with proper async handling
 */
export const fillForm = async (formData: Record<string, string>) => {
  const user = userEvent.setup()
  
  for (const [fieldName, value] of Object.entries(formData)) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i')) || 
                  screen.getByPlaceholderText(new RegExp(fieldName, 'i')) ||
                  screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') })
    
    await act(async () => {
      await user.clear(field)
      await user.type(field, value)
    })
  }
  
  await waitForStateUpdate()
}

/**
 * Helper to select options from dropdowns
 */
export const selectFormOptions = async (selections: Record<string, string | string[]>) => {
  const user = userEvent.setup()
  
  for (const [fieldName, options] of Object.entries(selections)) {
    const select = screen.getByLabelText(new RegExp(fieldName, 'i')) ||
                   screen.getByRole('combobox', { name: new RegExp(fieldName, 'i') })
    
    await act(async () => {
      await user.selectOptions(select, options)
    })
  }
  
  await waitForStateUpdate()
}

/**
 * Helper to submit form and wait for completion
 */
export const submitFormAndWait = async (submitButtonText = /submit|save|create|update/i) => {
  const user = userEvent.setup()
  const submitButton = screen.getByRole('button', { name: submitButtonText })
  
  await act(async () => {
    await user.click(submitButton)
  })
  
  await waitForStateUpdate()
}

/**
 * Helper to test form validation
 */
export const testFormValidation = {
  async expectFieldError(fieldName: string, errorMessage?: string) {
    await waitFor(() => {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'))
      expect(field).toBeInvalid()
      
      if (errorMessage) {
        expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument()
      }
    })
  },

  async expectNoFieldError(fieldName: string) {
    await waitFor(() => {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i'))
      expect(field).toBeValid()
    })
  },

  async expectFormSubmitDisabled() {
    const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i })
    expect(submitButton).toBeDisabled()
  },

  async expectFormSubmitEnabled() {
    const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i })
    expect(submitButton).toBeEnabled()
  },

  async triggerValidation(fieldName: string) {
    const user = userEvent.setup()
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'))
    
    await act(async () => {
      await user.click(field)
      await user.tab()
    })
    
    await waitForStateUpdate()
  },
}

/**
 * Helper to test file upload forms
 */
export const testFileUpload = async (
  inputSelector: string,
  files: File | File[],
  expectSuccess = true
) => {
  const user = userEvent.setup()
  const fileInput = screen.getByLabelText(new RegExp(inputSelector, 'i')) as HTMLInputElement
  
  await act(async () => {
    await user.upload(fileInput, files)
  })
  
  await waitForStateUpdate()
  
  if (expectSuccess) {
    const fileArray = Array.isArray(files) ? files : [files]
    expect(fileInput.files).toHaveLength(fileArray.length)
    
    fileArray.forEach((file, index) => {
      expect(fileInput.files![index]).toBe(file)
    })
  }
}

/**
 * Helper to create test files for upload testing
 */
export const createTestFile = (
  name: string = 'test-file.txt',
  content: string = 'test content',
  type: string = 'text/plain'
) => {
  return new File([content], name, { type })
}

/**
 * Helper to create test image files
 */
export const createTestImageFile = (
  name: string = 'test-image.png',
  width: number = 100,
  height: number = 100
) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], name, { type: 'image/png' }))
    }, 'image/png')
  })
}

/**
 * Helper to test form with complex validation scenarios
 */
export const testComplexFormValidation = async (testCases: Array<{
  description: string
  formData: Record<string, string>
  expectedErrors?: string[]
  expectedSuccess?: boolean
}>) => {
  for (const testCase of testCases) {
    // Fill form with test data
    await fillForm(testCase.formData)
    
    // Try to submit
    await submitFormAndWait()
    
    if (testCase.expectedErrors) {
      // Check for expected validation errors
      for (const error of testCase.expectedErrors) {
        await waitFor(() => {
          expect(screen.getByText(new RegExp(error, 'i'))).toBeInTheDocument()
        })
      }
    }
    
    if (testCase.expectedSuccess) {
      // Check for success indicators
      await waitFor(() => {
        const errorMessages = screen.queryAllByRole('alert')
        errorMessages.forEach(error => {
          expect(error).not.toHaveTextContent(/error|invalid|required/i)
        })
      })
    }
    
    // Clear form for next test case
    await act(async () => {
      const form = screen.getByRole('form') || document.querySelector('form')
      if (form) {
        (form as HTMLFormElement).reset()
      }
    })
    
    await waitForStateUpdate()
  }
}

/**
 * Helper to test form persistence (draft saving)
 */
export const testFormPersistence = async (
  formData: Record<string, string>,
  storageKey: string
) => {
  // Fill form
  await fillForm(formData)
  
  // Wait for potential auto-save
  await waitForStateUpdate()
  
  // Check if data was saved to localStorage
  const savedData = localStorage.getItem(storageKey)
  if (savedData) {
    const parsedData = JSON.parse(savedData)
    Object.entries(formData).forEach(([key, value]) => {
      expect(parsedData[key]).toBe(value)
    })
  }
}

/**
 * Helper to test conditional form fields
 */
export const testConditionalFields = async (
  triggerField: string,
  triggerValue: string,
  conditionalFields: string[]
) => {
  const user = userEvent.setup()
  
  // Initially, conditional fields should not be visible
  conditionalFields.forEach(field => {
    expect(screen.queryByLabelText(new RegExp(field, 'i'))).not.toBeInTheDocument()
  })
  
  // Trigger the conditional display
  const trigger = screen.getByLabelText(new RegExp(triggerField, 'i'))
  
  await act(async () => {
    if (trigger.tagName === 'SELECT') {
      await user.selectOptions(trigger, triggerValue)
    } else if (trigger.type === 'checkbox' || trigger.type === 'radio') {
      await user.click(trigger)
    } else {
      await user.clear(trigger)
      await user.type(trigger, triggerValue)
    }
  })
  
  await waitForStateUpdate()
  
  // Now conditional fields should be visible
  await waitFor(() => {
    conditionalFields.forEach(field => {
      expect(screen.getByLabelText(new RegExp(field, 'i'))).toBeInTheDocument()
    })
  })
}

/**
 * Helper to test form field focus management
 */
export const testFormFocus = async () => {
  const user = userEvent.setup()
  const formElements = screen.getAllByRole('textbox')
    .concat(screen.getAllByRole('combobox'))
    .concat(screen.getAllByRole('checkbox'))
    .concat(screen.getAllByRole('radio'))
  
  // Test tab navigation
  for (let i = 0; i < formElements.length; i++) {
    await act(async () => {
      await user.tab()
    })
    
    await waitFor(() => {
      expect(formElements[i]).toHaveFocus()
    })
  }
}

/**
 * Helper to test form accessibility
 */
export const testFormAccessibility = async () => {
  // Check that all form controls have labels
  const inputs = screen.getAllByRole('textbox')
    .concat(screen.getAllByRole('combobox'))
    .concat(screen.getAllByRole('checkbox'))
    .concat(screen.getAllByRole('radio'))
  
  inputs.forEach(input => {
    const label = screen.getByLabelText((content, element) => {
      return element === input
    })
    expect(label).toBeInTheDocument()
  })
  
  // Check that error messages are properly associated
  const errorMessages = screen.queryAllByRole('alert')
  errorMessages.forEach(error => {
    expect(error).toHaveAttribute('aria-live', 'polite')
  })
}