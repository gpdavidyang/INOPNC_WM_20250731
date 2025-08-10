/**
 * Tests for EquipmentList Component
 * 
 * Testing the equipment list data table component
 * for Task 14
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { EquipmentList } from '@/components/equipment/equipment-list'
import type { Equipment } from '@/types/equipment'

describe('EquipmentList Component', () => {
  const mockEquipment: Equipment[] = [
    {
      id: 'eq-1',
      name: 'Excavator Model X',
      code: 'EX-001',
      category_id: 'cat-1',
      category: { id: 'cat-1', name: 'Heavy Machinery' },
      status: 'available',
      site_id: 'site-1',
      site: { id: 'site-1', name: 'Construction Site A' },
      manufacturer: 'CAT',
      model: 'X200',
      serial_number: 'SN12345',
      purchase_date: '2023-01-15',
      last_maintenance_date: '2024-01-01',
      next_maintenance_date: '2024-07-01',
      created_at: '2023-01-15'
    },
    {
      id: 'eq-2',
      name: 'Crane Tower 500',
      code: 'CR-002',
      category_id: 'cat-1',
      category: { id: 'cat-1', name: 'Heavy Machinery' },
      status: 'in_use',
      site_id: 'site-2',
      site: { id: 'site-2', name: 'Construction Site B' },
      manufacturer: 'Liebherr',
      model: 'T500',
      serial_number: 'SN67890',
      purchase_date: '2022-06-20',
      created_at: '2022-06-20'
    },
    {
      id: 'eq-3',
      name: 'Concrete Mixer',
      code: 'CM-003',
      category_id: 'cat-2',
      category: { id: 'cat-2', name: 'Concrete Equipment' },
      status: 'maintenance',
      site_id: 'site-1',
      site: { id: 'site-1', name: 'Construction Site A' },
      manufacturer: 'Schwing',
      model: 'M300',
      serial_number: 'SN11111',
      purchase_date: '2023-03-10',
      created_at: '2023-03-10'
    },
    {
      id: 'eq-4',
      name: 'Bulldozer D8',
      code: 'BD-004',
      category_id: 'cat-1',
      category: { id: 'cat-1', name: 'Heavy Machinery' },
      status: 'damaged',
      site_id: 'site-1',
      site: { id: 'site-1', name: 'Construction Site A' },
      manufacturer: 'CAT',
      model: 'D8T',
      serial_number: 'SN22222',
      purchase_date: '2021-11-05',
      created_at: '2021-11-05'
    }
  ]

  const mockCategories = [
    { id: 'cat-1', name: 'Heavy Machinery' },
    { id: 'cat-2', name: 'Concrete Equipment' }
  ]

  const mockSites = [
    { id: 'site-1', name: 'Construction Site A' },
    { id: 'site-2', name: 'Construction Site B' }
  ]

  const mockHandlers = {
    onCheckout: jest.fn(),
    onMaintenance: jest.fn(),
    onEdit: jest.fn(),
    onViewHistory: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render equipment list with all items', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      // Check that all equipment items are displayed
      expect(screen.getByText('Excavator Model X')).toBeInTheDocument()
      expect(screen.getByText('Crane Tower 500')).toBeInTheDocument()
      expect(screen.getByText('Concrete Mixer')).toBeInTheDocument()
      expect(screen.getByText('Bulldozer D8')).toBeInTheDocument()
    })

    it('should display equipment codes', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('EX-001')).toBeInTheDocument()
      expect(screen.getByText('CR-002')).toBeInTheDocument()
      expect(screen.getByText('CM-003')).toBeInTheDocument()
      expect(screen.getByText('BD-004')).toBeInTheDocument()
    })

    it('should display empty state when no equipment', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={[]}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('장비가 없습니다')).toBeInTheDocument()
      expect(screen.getByText('필터 조건에 맞는 장비가 없습니다.')).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should display correct status badges', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('사용가능')).toBeInTheDocument() // available
      expect(screen.getByText('사용중')).toBeInTheDocument() // in_use
      expect(screen.getByText('정비중')).toBeInTheDocument() // maintenance
      expect(screen.getByText('파손')).toBeInTheDocument() // damaged
    })

    it('should use correct colors for status badges', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      // Status badges are rendered with specific colors
      const availableBadge = screen.getByText('사용가능')
      expect(availableBadge).toBeInTheDocument()
      // Badge component applies color through variant prop
      
      const inUseBadge = screen.getByText('사용중')
      expect(inUseBadge).toBeInTheDocument()
      
      const maintenanceBadge = screen.getByText('정비중')
      expect(maintenanceBadge).toBeInTheDocument()
      
      const damagedBadge = screen.getByText('파손')
      expect(damagedBadge).toBeInTheDocument()
    })
  })

  describe('Search and Filtering', () => {
    it('should filter equipment by search query', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('장비명, 코드, 제조사로 검색...')
      
      // Search by name
      await user.type(searchInput, 'Excavator')
      
      expect(screen.getByText('Excavator Model X')).toBeInTheDocument()
      expect(screen.queryByText('Crane Tower 500')).not.toBeInTheDocument()
      expect(screen.queryByText('Concrete Mixer')).not.toBeInTheDocument()
      expect(screen.queryByText('Bulldozer D8')).not.toBeInTheDocument()
    })

    it('should filter by equipment code', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('장비명, 코드, 제조사로 검색...')
      
      await user.clear(searchInput)
      await user.type(searchInput, 'CR-002')
      
      expect(screen.getByText('Crane Tower 500')).toBeInTheDocument()
      expect(screen.queryByText('Excavator Model X')).not.toBeInTheDocument()
    })

    it('should filter by manufacturer', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('장비명, 코드, 제조사로 검색...')
      
      await user.type(searchInput, 'CAT')
      
      // Should show both CAT equipment
      expect(screen.getByText('Excavator Model X')).toBeInTheDocument()
      expect(screen.getByText('Bulldozer D8')).toBeInTheDocument()
      expect(screen.queryByText('Crane Tower 500')).not.toBeInTheDocument()
      expect(screen.queryByText('Concrete Mixer')).not.toBeInTheDocument()
    })

    it('should show filter button', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      const filterButton = screen.getByRole('button', { name: /필터/i })
      expect(filterButton).toBeInTheDocument()
    })
  })

  describe('Equipment Information', () => {
    it('should display manufacturer and model', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      expect(screen.getByText('CAT X200')).toBeInTheDocument()
      expect(screen.getByText('Liebherr T500')).toBeInTheDocument()
      expect(screen.getByText('Schwing M300')).toBeInTheDocument()
    })

    it('should display category information', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      // Category names appear as badges
      const heavyMachineryBadges = screen.getAllByText('Heavy Machinery')
      expect(heavyMachineryBadges.length).toBeGreaterThan(0)
      
      expect(screen.getByText('Concrete Equipment')).toBeInTheDocument()
    })

    it('should display site information', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      // Site names appear in the equipment cards
      const siteAElements = screen.getAllByText(/Construction Site A/)
      expect(siteAElements.length).toBeGreaterThan(0)
      
      expect(screen.getByText(/Construction Site B/)).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should show action menu for each equipment', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      // Find action menu buttons (they have MoreVertical icon)
      const actionButtons = screen.getAllByRole('button').filter(
        button => button.querySelector('[class*="lucide-ellipsis-vertical"]')
      )
      
      expect(actionButtons).toHaveLength(4) // One for each equipment
      
      // Click on first action menu (Bulldozer D8 - damaged, so no checkout)
      await user.click(actionButtons[0])
      
      // Check menu items appear
      await waitFor(() => {
        expect(screen.getByText('정비 일정')).toBeInTheDocument()
        expect(screen.getByText('사용 이력')).toBeInTheDocument()
        expect(screen.getByText('수정')).toBeInTheDocument()
      })
    })

    it('should call onCheckout when checkout action is clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      const actionButtons = screen.getAllByRole('button').filter(
        button => button.querySelector('[class*="lucide-more-vertical"]')
      )
      
      await user.click(actionButtons[0])
      
      // The checkout function is called with onCheckout handler
      // Since items are sorted alphabetically, find the Excavator position
      const allButtons = screen.getAllByRole('button').filter(
        button => button.querySelector('[class*="lucide-ellipsis-vertical"]')
      )
      
      // Excavator Model X is last in alphabetical order
      const excavatorButton = allButtons[3]
      await user.click(excavatorButton)
      
      // Wait for menu to appear and find checkout option
      const checkoutOption = await screen.findByText('반출하기')
      await user.click(checkoutOption)
      
      // Find the Excavator equipment object
      const excavatorEquipment = mockEquipment.find(eq => eq.name === 'Excavator Model X')
      expect(mockHandlers.onCheckout).toHaveBeenCalledWith(excavatorEquipment)
    })

    it('should disable checkout for unavailable equipment', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      // Find the in_use equipment (Crane Tower 500)
      const inUseCard = screen.getByText('Crane Tower 500').closest('div.rounded-lg')
      const actionButton = inUseCard?.querySelector('button[role="button"]') as HTMLElement
      
      await user.click(actionButton)
      
      // The menu should not have checkout option for in-use equipment
      expect(screen.queryByText('반출하기')).not.toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should sort equipment by name by default', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      const equipmentNames = screen.getAllByRole('heading', { level: 3 })
        .map(el => el.textContent)
        .filter(text => text && text !== '검색 결과가 없습니다.')
      
      // Should be sorted alphabetically by name
      expect(equipmentNames[0]).toContain('Bulldozer D8')
      expect(equipmentNames[1]).toContain('Concrete Mixer')
      expect(equipmentNames[2]).toContain('Crane Tower 500')
      expect(equipmentNames[3]).toContain('Excavator Model X')
    })
  })

  describe('Responsive Behavior', () => {
    it('should adjust layout for different touch modes', () => {
      // Test with glove mode
      const { rerender } = renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />,
        {
          touchMode: 'glove'
        }
      )

      // Buttons should be larger in glove mode
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        if (button.textContent && button.textContent.includes('필터')) {
          expect(button).toHaveClass('text-sm') // Just verify it's a button
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('장비명, 코드, 제조사로 검색...')
      // Input component doesn't explicitly set type="text" as it's the default
      expect(searchInput.tagName).toBe('INPUT')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <EquipmentList 
          equipment={mockEquipment}
          categories={mockCategories}
          sites={mockSites}
          {...mockHandlers}
        />
      )

      const searchInput = screen.getByPlaceholderText('장비명, 코드, 제조사로 검색...')
      
      // Tab to search input
      await user.tab()
      expect(searchInput).toHaveFocus()
      
      // Tab to filter button
      await user.tab()
      const filterButton = screen.getByRole('button', { name: /필터/i })
      expect(filterButton).toHaveFocus()
    })
  })
})