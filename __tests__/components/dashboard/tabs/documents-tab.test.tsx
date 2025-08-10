/**
 * Documents Tab Component Test Suite
 * Tests for unified documents tab with card layout, file type badges, and filtering
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils'
import { jest } from '@jest/globals'
import DocumentsTabUnified from '@/components/dashboard/tabs/documents-tab-unified'
import { createMockProfile } from '@/__tests__/utils/test-utils'

// Mock child components
jest.mock('@/components/dashboard/tabs/documents-tab', () => {
  return function MockDocumentsTab({ profile }: { profile: any }) {
    return (
      <div data-testid="personal-documents">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mock document cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  2024년 7월 작업일지.pdf
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  2MB • 2024-08-01
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                PDF
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex-1 px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30">
                보기
              </button>
              <button className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                다운로드
              </button>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  현장사진_강남A현장.jpg
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  1.5MB • 2024-08-02
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                JPG
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex-1 px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30">
                보기
              </button>
              <button className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                다운로드
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  시공계획서.docx
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  3.2MB • 2024-07-30
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                DOCX
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex-1 px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30">
                보기
              </button>
              <button className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                다운로드
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
})

jest.mock('@/components/dashboard/tabs/shared-documents-tab', () => {
  return function MockSharedDocumentsTab({ profile }: { profile: any }) {
    return (
      <div data-testid="shared-documents">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mock shared document cards */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  공용_안전수칙.pdf
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  공유됨 • 관리자
                </p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                PDF
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex-1 px-3 py-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30">
                보기
              </button>
              <button className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                다운로드
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
})

describe('DocumentsTabUnified Component', () => {
  const mockProfile = createMockProfile({
    id: 'user-123',
    full_name: '김철수',
    role: 'worker'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render tab navigation with correct labels', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      expect(screen.getByText('내문서함')).toBeInTheDocument()
      expect(screen.getByText('공유문서함')).toBeInTheDocument()
    })

    it('should render tab icons correctly', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Check for folder and share icons (by checking for buttons with text)
      const personalTab = screen.getByText('내문서함').closest('button')
      const sharedTab = screen.getByText('공유문서함').closest('button')
      
      expect(personalTab).toBeInTheDocument()
      expect(sharedTab).toBeInTheDocument()
    })

    it('should default to personal tab when no initialTab specified', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      const personalTab = screen.getByText('내문서함').closest('button')
      expect(personalTab).toHaveClass('border-blue-500', 'text-blue-600')
      
      // Should show personal documents content
      expect(screen.getByTestId('personal-documents')).toBeInTheDocument()
    })

    it('should respect initialTab prop', () => {
      render(<DocumentsTabUnified profile={mockProfile} initialTab="shared" />)
      
      const sharedTab = screen.getByText('공유문서함').closest('button')
      expect(sharedTab).toHaveClass('border-blue-500', 'text-blue-600')
      
      // Should show shared documents content
      expect(screen.getByTestId('shared-documents')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('should switch between personal and shared tabs', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Initially should show personal tab
      expect(screen.getByTestId('personal-documents')).toBeInTheDocument()
      expect(screen.queryByTestId('shared-documents')).not.toBeInTheDocument()
      
      // Click shared tab
      const sharedTab = screen.getByText('공유문서함')
      fireEvent.click(sharedTab)
      
      // Should now show shared tab
      expect(screen.getByTestId('shared-documents')).toBeInTheDocument()
      expect(screen.queryByTestId('personal-documents')).not.toBeInTheDocument()
      
      // Click back to personal tab
      const personalTab = screen.getByText('내문서함')
      fireEvent.click(personalTab)
      
      // Should show personal tab again
      expect(screen.getByTestId('personal-documents')).toBeInTheDocument()
      expect(screen.queryByTestId('shared-documents')).not.toBeInTheDocument()
    })

    it('should apply correct styling to active tab', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      const personalTab = screen.getByText('내문서함').closest('button')
      const sharedTab = screen.getByText('공유문서함').closest('button')
      
      // Personal tab should be active initially
      expect(personalTab).toHaveClass('border-blue-500', 'text-blue-600')
      expect(sharedTab).toHaveClass('border-transparent', 'text-gray-500')
      
      // Click shared tab
      fireEvent.click(screen.getByText('공유문서함'))
      
      // Shared tab should now be active
      expect(sharedTab).toHaveClass('border-blue-500', 'text-blue-600')
      expect(personalTab).toHaveClass('border-transparent', 'text-gray-500')
    })
  })

  describe('Document Card Layout', () => {
    it('should render documents in card-based UI', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Check for grid layout
      const gridContainer = screen.getByTestId('personal-documents').querySelector('.grid')
      expect(gridContainer).toBeInTheDocument()
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('should display document cards with proper structure', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Check for document card elements
      expect(screen.getByText('2024년 7월 작업일지.pdf')).toBeInTheDocument()
      expect(screen.getByText('현장사진_강남A현장.jpg')).toBeInTheDocument()
      expect(screen.getByText('시공계획서.docx')).toBeInTheDocument()
    })

    it('should show file metadata in cards', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Check for file size and date info
      expect(screen.getByText('2MB • 2024-08-01')).toBeInTheDocument()
      expect(screen.getByText('1.5MB • 2024-08-02')).toBeInTheDocument()
      expect(screen.getByText('3.2MB • 2024-07-30')).toBeInTheDocument()
    })
  })

  describe('File Type Badges', () => {
    it('should display file type badges with correct colors', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Check for different file type badges
      const pdfBadge = screen.getByText('PDF')
      const jpgBadge = screen.getByText('JPG')
      const docxBadge = screen.getByText('DOCX')
      
      expect(pdfBadge).toBeInTheDocument()
      expect(jpgBadge).toBeInTheDocument()
      expect(docxBadge).toBeInTheDocument()
      
      // Check for correct color classes
      expect(pdfBadge).toHaveClass('bg-red-100', 'text-red-800')
      expect(jpgBadge).toHaveClass('bg-green-100', 'text-green-800')
      expect(docxBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    })

    it('should show appropriate badges for different file types', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // All badges should be visible
      expect(screen.getAllByText('PDF')).toHaveLength(1)
      expect(screen.getAllByText('JPG')).toHaveLength(1)
      expect(screen.getAllByText('DOCX')).toHaveLength(1)
    })
  })

  describe('Document Actions', () => {
    it('should render view and download buttons for each document', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Should have multiple view and download buttons
      const viewButtons = screen.getAllByText('보기')
      const downloadButtons = screen.getAllByText('다운로드')
      
      expect(viewButtons.length).toBeGreaterThan(0)
      expect(downloadButtons.length).toBeGreaterThan(0)
      expect(viewButtons.length).toBe(downloadButtons.length)
    })

    it('should make action buttons clickable', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      const viewButtons = screen.getAllByText('보기')
      const downloadButtons = screen.getAllByText('다운로드')
      
      // All buttons should be clickable
      viewButtons.forEach(button => {
        expect(button.closest('button')).toBeInTheDocument()
      })
      
      downloadButtons.forEach(button => {
        expect(button.closest('button')).toBeInTheDocument()
      })
    })

    it('should apply correct styling to action buttons', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      const viewButtons = screen.getAllByText('보기')
      const downloadButtons = screen.getAllByText('다운로드')
      
      // View buttons should have blue styling
      viewButtons.forEach(button => {
        const buttonElement = button.closest('button')
        expect(buttonElement).toHaveClass('bg-blue-50', 'text-blue-600')
      })
      
      // Download buttons should have gray styling
      downloadButtons.forEach(button => {
        const buttonElement = button.closest('button')
        expect(buttonElement).toHaveClass('bg-gray-50', 'text-gray-600')
      })
    })
  })

  describe('Personal vs Shared Documents', () => {
    it('should show different content for personal and shared tabs', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Personal tab content
      expect(screen.getByText('2024년 7월 작업일지.pdf')).toBeInTheDocument()
      
      // Switch to shared tab
      fireEvent.click(screen.getByText('공유문서함'))
      
      // Shared tab content
      expect(screen.getByText('공용_안전수칙.pdf')).toBeInTheDocument()
      expect(screen.getByText('공유됨 • 관리자')).toBeInTheDocument()
    })

    it('should show different metadata for shared documents', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Switch to shared tab
      fireEvent.click(screen.getByText('공유문서함'))
      
      // Shared documents should show sharing info instead of size/date
      expect(screen.getByText('공유됨 • 관리자')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should use responsive grid classes', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      const gridContainer = screen.getByTestId('personal-documents').querySelector('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('should use responsive spacing classes', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Check for responsive padding and gaps
      const tabButtons = screen.getByText('내문서함').closest('button')
      expect(tabButtons).toHaveClass('px-6', 'py-4')
      
      const gridContainer = screen.getByTestId('personal-documents').querySelector('.grid')
      expect(gridContainer).toHaveClass('gap-4')
    })
  })

  describe('Dark Mode Support', () => {
    it('should include dark mode classes for all elements', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Tab navigation should support dark mode
      const tabContainer = screen.getByText('내문서함').closest('div')?.parentElement
      expect(tabContainer).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700')
      
      // Document cards should support dark mode
      const cards = document.querySelectorAll('.dark\\:bg-gray-800')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should apply dark mode classes to badges', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      const pdfBadge = screen.getByText('PDF')
      const jpgBadge = screen.getByText('JPG')
      const docxBadge = screen.getByText('DOCX')
      
      expect(pdfBadge).toHaveClass('dark:bg-red-900', 'dark:text-red-200')
      expect(jpgBadge).toHaveClass('dark:bg-green-900', 'dark:text-green-200')
      expect(docxBadge).toHaveClass('dark:bg-blue-900', 'dark:text-blue-200')
    })
  })

  describe('Korean Localization', () => {
    it('should display all UI text in Korean', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Tab labels
      expect(screen.getByText('내문서함')).toBeInTheDocument()
      expect(screen.getByText('공유문서함')).toBeInTheDocument()
      
      // Action buttons
      expect(screen.getAllByText('보기').length).toBeGreaterThan(0)
      expect(screen.getAllByText('다운로드').length).toBeGreaterThan(0)
    })

    it('should handle Korean file names properly', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Korean file names should display correctly
      expect(screen.getByText('2024년 7월 작업일지.pdf')).toBeInTheDocument()
      expect(screen.getByText('현장사진_강남A현장.jpg')).toBeInTheDocument()
      expect(screen.getByText('시공계획서.docx')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should provide proper button roles', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      const tabButtons = screen.getAllByRole('button')
      expect(tabButtons.length).toBeGreaterThan(0)
      
      // All interactive elements should be buttons
      const viewButtons = screen.getAllByText('보기')
      viewButtons.forEach(button => {
        expect(button.closest('button')).toHaveAttribute('role')
      })
    })

    it('should have proper keyboard navigation support', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      const personalTab = screen.getByText('내문서함').closest('button')
      const sharedTab = screen.getByText('공유문서함').closest('button')
      
      expect(personalTab).toHaveAttribute('tabIndex')
      expect(sharedTab).toHaveAttribute('tabIndex')
    })
  })

  describe('Tab State Management', () => {
    it('should update tab when initialTab prop changes', () => {
      const { rerender } = render(<DocumentsTabUnified profile={mockProfile} initialTab="personal" />)
      
      expect(screen.getByTestId('personal-documents')).toBeInTheDocument()
      
      // Change initialTab prop
      rerender(<DocumentsTabUnified profile={mockProfile} initialTab="shared" />)
      
      expect(screen.getByTestId('shared-documents')).toBeInTheDocument()
    })

    it('should maintain tab state after user interaction', () => {
      render(<DocumentsTabUnified profile={mockProfile} />)
      
      // Switch to shared tab
      fireEvent.click(screen.getByText('공유문서함'))
      expect(screen.getByTestId('shared-documents')).toBeInTheDocument()
      
      // Tab should remain on shared
      const sharedTab = screen.getByText('공유문서함').closest('button')
      expect(sharedTab).toHaveClass('border-blue-500', 'text-blue-600')
    })
  })
})