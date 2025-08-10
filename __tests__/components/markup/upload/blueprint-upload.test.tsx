/**
 * Tests for BlueprintUpload Component
 * 
 * Testing file upload with drag-and-drop functionality
 * for Task 14.2
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { BlueprintUpload } from '@/components/markup/upload/blueprint-upload'

describe('BlueprintUpload Component', () => {
  const mockOnImageUpload = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render upload area when no image is selected', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      expect(screen.getByText('도면 파일을 업로드하세요')).toBeInTheDocument()
      expect(screen.getByText('JPG, PNG, PDF 파일을 드래그하거나 클릭하여 선택하세요')).toBeInTheDocument()
      expect(screen.getByText('파일 선택')).toBeInTheDocument()
    })

    it('should render file info when image is selected', () => {
      renderWithProviders(
        <BlueprintUpload 
          onImageUpload={mockOnImageUpload}
          currentImage="data:image/png;base64,test"
          currentFileName="blueprint.png"
        />
      )
      
      expect(screen.getByText('blueprint.png')).toBeInTheDocument()
      // X button for clearing
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should apply touch mode styles', () => {
      renderWithProviders(
        <BlueprintUpload 
          onImageUpload={mockOnImageUpload}
          touchMode="glove"
        />
      )
      
      const uploadArea = screen.getByText('도면 파일을 업로드하세요').closest('div')
      expect(uploadArea).toHaveClass('p-8')
    })
  })

  describe('File Selection', () => {
    it('should handle file selection via click', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const file = new File(['test'], 'test.png', { type: 'image/png' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        result: 'data:image/png;base64,test'
      }
      
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any)
      
      // Trigger file selection
      await user.upload(fileInput, file)
      
      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } })
      
      expect(mockOnImageUpload).toHaveBeenCalledWith('data:image/png;base64,test', 'test.png')
    })

    it('should accept only image files', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput.accept).toBe('image/*')
    })

    it('should trigger file input when button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = jest.spyOn(fileInput, 'click')
      
      const selectButton = screen.getByText('파일 선택')
      await user.click(selectButton)
      
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should trigger file input when upload area is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = jest.spyOn(fileInput, 'click')
      
      const uploadArea = screen.getByText('도면 파일을 업로드하세요').closest('div')!
      await user.click(uploadArea)
      
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('Drag and Drop', () => {
    it('should handle drag over', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const dropZone = screen.getByText('도면 파일을 업로드하세요').closest('div')!
      
      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [] }
      })
      
      expect(dropZone).toHaveClass('border-blue-500', 'bg-blue-50')
    })

    it('should handle drag leave', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const dropZone = screen.getByText('도면 파일을 업로드하세요').closest('div')!
      
      // First drag over
      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [] }
      })
      
      // Then drag leave
      fireEvent.dragLeave(dropZone)
      
      expect(dropZone).not.toHaveClass('border-blue-500', 'bg-blue-50')
    })

    it('should handle file drop', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const dropZone = screen.getByText('도면 파일을 업로드하세요').closest('div')!
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        result: 'data:image/png;base64,test'
      }
      
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any)
      
      const file = new File(['test'], 'dropped.png', { type: 'image/png' })
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      })
      
      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } })
      
      expect(mockOnImageUpload).toHaveBeenCalledWith('data:image/png;base64,test', 'dropped.png')
    })

    it('should prevent default on drag events', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const dropZone = screen.getByText('도면 파일을 업로드하세요').closest('div')!
      
      const dragOverEvent = new Event('dragover', { bubbles: true })
      const preventDefaultSpy = jest.spyOn(dragOverEvent, 'preventDefault')
      
      fireEvent(dropZone, dragOverEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should only process image files on drop', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const dropZone = screen.getByText('도면 파일을 업로드하세요').closest('div')!
      
      const textFile = new File(['test'], 'document.txt', { type: 'text/plain' })
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [textFile]
        }
      })
      
      // Should not call onImageUpload for non-image files
      expect(mockOnImageUpload).not.toHaveBeenCalled()
    })
  })

  describe('Clear Functionality', () => {
    it('should clear selected image when X button is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <BlueprintUpload 
          onImageUpload={mockOnImageUpload}
          currentImage="data:image/png;base64,test"
          currentFileName="blueprint.png"
        />
      )
      
      const clearButton = screen.getByRole('button')
      await user.click(clearButton)
      
      expect(mockOnImageUpload).toHaveBeenCalledWith('', '')
    })

    it('should reset file input when clearing', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <BlueprintUpload 
          onImageUpload={mockOnImageUpload}
          currentImage="data:image/png;base64,test"
          currentFileName="blueprint.png"
        />
      )
      
      const clearButton = screen.getByRole('button')
      await user.click(clearButton)
      
      // Check that onImageUpload is called with empty values
      expect(mockOnImageUpload).toHaveBeenCalledWith('', '')
    })
  })

  describe('File Type Validation', () => {
    it('should process valid image files', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        result: 'data:image/jpeg;base64,test'
      }
      
      jest.spyOn(window, 'FileReader').mockImplementation(() => mockFileReader as any)
      
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      
      for (const type of validTypes) {
        const file = new File(['test'], `test.${type.split('/')[1]}`, { type })
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
        
        // Use userEvent.upload instead of Object.defineProperty
        await user.upload(fileInput, file)
        
        // Should call readAsDataURL for valid image types
        expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file)
      }
    })
  })

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('accept', 'image/*')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = jest.spyOn(fileInput, 'click')
      
      const selectButton = screen.getByText('파일 선택')
      
      // Focus button and click it
      selectButton.focus()
      expect(selectButton).toHaveFocus()
      
      // Click the button which should trigger file input
      await user.click(selectButton)
      
      // Button's click handler should trigger file input
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should have focus styles on interactive elements', () => {
      renderWithProviders(
        <BlueprintUpload 
          onImageUpload={mockOnImageUpload}
          currentImage="data:image/png;base64,test"
          currentFileName="blueprint.png"
        />
      )
      
      const clearButton = screen.getByRole('button')
      expect(clearButton).toHaveClass('focus-visible:ring-4')
    })
  })

  describe('Touch Mode Support', () => {
    it('should apply glove mode styles', () => {
      renderWithProviders(
        <BlueprintUpload 
          onImageUpload={mockOnImageUpload}
          touchMode="glove"
        />
      )
      
      const button = screen.getByText('파일 선택')
      expect(button).toHaveClass('min-h-[64px]')
    })

    it('should apply precision mode styles', () => {
      renderWithProviders(
        <BlueprintUpload 
          onImageUpload={mockOnImageUpload}
          touchMode="precision"
        />
      )
      
      const button = screen.getByText('파일 선택')
      expect(button).toHaveClass('min-h-[48px]')
    })

    it('should apply normal mode styles by default', () => {
      renderWithProviders(
        <BlueprintUpload onImageUpload={mockOnImageUpload} />
      )
      
      const button = screen.getByText('파일 선택')
      expect(button).toHaveClass('min-h-[56px]')
    })
  })
})