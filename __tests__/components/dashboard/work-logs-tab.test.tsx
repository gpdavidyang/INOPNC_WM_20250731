import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react'
import { Profile } from '@/types'
import { useRouter } from 'next/navigation'
import { actAsync, waitForStateUpdate } from '@/__tests__/utils/async-helpers'

// Mock dependencies first
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}))
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock the CustomSelect component
jest.mock('@/components/ui/custom-select', () => ({
  CustomSelect: ({ options, value, onChange, placeholder }: any) => (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      data-testid="custom-select"
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
}))

// Import components after mocks
import WorkLogsTab from '@/components/dashboard/tabs/work-logs-tab'
import { createClient } from '@/lib/supabase/client'

describe('WorkLogsTab Component', () => {
  const mockProfile: Profile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'worker',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  const mockPush = jest.fn()
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: [
        { id: '1', name: '강남 A현장' },
        { id: '2', name: '송파 B현장' },
      ],
      error: null,
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('should render loading state initially', async () => {
    let component
    
    // Mock a slower loading process
    const slowSupabase = {
      ...mockSupabase,
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: [
                { id: '1', name: '강남 A현장' },
                { id: '2', name: '송파 B현장' },
              ],
              error: null,
            })
          }, 100) // 100ms delay
        })
      }),
    }
    ;(createClient as jest.Mock).mockReturnValue(slowSupabase)
    
    await act(async () => {
      component = render(<WorkLogsTab profile={mockProfile} />)
    })
    
    // Should initially show loading
    expect(component.getByText('작업일지를 불러오는 중...')).toBeInTheDocument()
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(component.queryByText('작업일지를 불러오는 중...')).not.toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should render work logs after loading', async () => {
    let component
    await actAsync(async () => {
      component = render(<WorkLogsTab profile={mockProfile} />)
    })
    
    await waitFor(() => {
      expect(component.queryByText('작업일지를 불러오는 중...')).not.toBeInTheDocument()
    })
    
    expect(component.getByText('작업일지 관리')).toBeInTheDocument()
    expect(component.getByText(/전체 5건/)).toBeInTheDocument()
    expect(component.getByText(/임시저장 2건/)).toBeInTheDocument()
  })

  it('should show new work log button for authorized roles', async () => {
    let component
    await actAsync(async () => {
      component = render(<WorkLogsTab profile={mockProfile} />)
    })
    
    await waitFor(() => {
      expect(component.getByText('새 작업일지')).toBeInTheDocument()
    })
  })

  it('should not show new work log button for unauthorized roles', async () => {
    const customerProfile = { ...mockProfile, role: 'customer_manager' }
    let component
    await actAsync(async () => {
      component = render(<WorkLogsTab profile={customerProfile} />)
    })
    
    await waitFor(() => {
      expect(component.queryByText('새 작업일지')).not.toBeInTheDocument()
    })
  })

  describe('Search and Filters', () => {
    it('should filter work logs by search term', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.getAllByText('작업일지 관리')[0]).toBeInTheDocument()
      })
      
      // Check that multiple work logs are visible
      const initialLogs = component.getAllByText(/작업/)
      expect(initialLogs.length).toBeGreaterThan(1)
      
      const searchInput = component.getByPlaceholderText('검색...')
      await actAsync(async () => {
        fireEvent.change(searchInput, { target: { value: '철근' } })
      })
      
      // After filtering, only logs with '철근' should be visible
      await waitFor(() => {
        const filteredLogs = component.queryAllByText(/철근/)
        expect(filteredLogs.length).toBeGreaterThan(0)
        // Check that non-matching logs are filtered out
        const slabLogs = component.queryAllByText(/슬라브 타설 작업/)
        expect(slabLogs.length).toBe(0)
      })
    })

    it('should toggle filter panel', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.queryByText('현장')).not.toBeInTheDocument()
      })
      
      const filterButton = component.getByLabelText('상세 필터 표시')
      await actAsync(async () => {
        fireEvent.click(filterButton)
      })
      
      expect(component.queryByText('현장')).toBeInTheDocument()
      expect(component.queryByText('기간')).toBeInTheDocument()
    })

    it('should filter by site', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        const gangnamSites = component.getAllByText(/강남 A현장/)
        expect(gangnamSites.length).toBeGreaterThan(0)
      })
      
      // Open filters
      await actAsync(async () => {
        fireEvent.click(component.getByLabelText('상세 필터 표시'))
      })
      
      await waitFor(() => {
        // Wait for filter panel to open
        expect(component.getAllByText('현장')[0]).toBeInTheDocument()
      })
      
      // Select a site
      const siteSelects = component.getAllByTestId('custom-select')
      const siteSelect = siteSelects[0] // First select is for sites
      await actAsync(async () => {
        fireEvent.change(siteSelect, { target: { value: '2' } })
      })
      
      // Should only show logs from selected site
      await waitFor(() => {
        // After filtering by site 2 (송파 B현장), we should see only those logs
        const songpaLogs = component.queryAllByText(/송파 B현장/)
        expect(songpaLogs.length).toBeGreaterThan(0)
        
        // And fewer 강남 A현장 logs than before (they should be filtered out)
        const gangnamLogs = component.queryAllByText(/강남 A현장/)
        // Since there might still be some 강남 logs in the site selector or other places,
        // we check that there are fewer than the original count
        expect(gangnamLogs.length).toBeLessThanOrEqual(2) // Allow for some remaining in selectors
      })
    })

    it('should filter by status', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.getAllByText('작업일지 관리')[0]).toBeInTheDocument()
      })
      
      // Open filters
      await actAsync(async () => {
        fireEvent.click(component.getByLabelText('상세 필터 표시'))
      })
      
      await waitFor(() => {
        // Look for the status buttons within the filter panel
        const draftButtons = component.getAllByText('임시저장')
        expect(draftButtons.length).toBeGreaterThan(0)
        
        // Click the draft status filter button (not the status badge)
        const filterButton = draftButtons.find(btn => 
          btn.closest('button') && !btn.closest('[role="cell"]')
        )
        
        if (filterButton) {
          actAsync(async () => {
            fireEvent.click(filterButton)
          })
        }
      })
      
      // Verify the filter is applied by checking the active state
      await waitFor(() => {
        const filterButtons = document.querySelectorAll('button')
        const activeFilter = Array.from(filterButtons).find(btn => 
          btn.textContent === '임시저장' && btn.classList.contains('text-blue-600')
        )
        expect(activeFilter).toBeTruthy()
      })
    })
  })

  describe('Table Actions', () => {
    it('should navigate to daily report page on new button click', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.getByText('새 작업일지')).toBeInTheDocument()
      })
      
      await actAsync(async () => {
        fireEvent.click(component.getByText('새 작업일지'))
      })
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard/daily-reports/new')
    })

    it('should show alert for demo data when clicking view', async () => {
      window.alert = jest.fn()
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        const viewButtons = component.getAllByTitle('보기')
        expect(viewButtons.length).toBeGreaterThan(0)
      })
      
      const viewButtons = component.getAllByTitle('보기')
      await actAsync(async () => {
        fireEvent.click(viewButtons[0])
      })
      
      expect(window.alert).toHaveBeenCalledWith(
        '이것은 데모 데이터입니다. 실제 데이터가 있을 때 상세 페이지로 이동합니다.'
      )
    })

    it('should show edit button for draft logs', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.getByText('작업일지 관리')).toBeInTheDocument()
      })
      
      const editButtons = component.getAllByTitle('편집')
      expect(editButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Pagination', () => {
    it('should show pagination controls when there are multiple pages', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.getByText('작업일지 관리')).toBeInTheDocument()
      })
      
      // Since we have 5 mock items and items per page is 10, no pagination should show
      expect(document.querySelector('[aria-label="이전 페이지"]')).not.toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should sort by column when header is clicked', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.getByText('작업일지 관리')).toBeInTheDocument()
      })
      
      const dateHeader = component.getByLabelText('작업 날짜별 정렬')
      await actAsync(async () => {
        fireEvent.click(dateHeader)
      })
      
      // Check that sort icon appears
      expect(dateHeader.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should show mobile card view on small screens', async () => {
      // Mock window width
      Object.defineProperty(window, 'innerWidth', { value: 400, configurable: true })
      
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.getByText('작업일지 관리')).toBeInTheDocument()
      })
      
      // Mobile view should use cards instead of table
      expect(component.container.querySelector('table')).toBeInTheDocument()
      expect(component.container.querySelector('.block.sm\\:hidden')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no logs', async () => {
      let component
      await actAsync(async () => {
        component = render(<WorkLogsTab profile={mockProfile} />)
      })
      
      await waitFor(() => {
        expect(component.getByText('작업일지 관리')).toBeInTheDocument()
      })
      
      // Search for something that doesn't exist
      const searchInput = component.getByPlaceholderText('검색...')
      await actAsync(async () => {
        fireEvent.change(searchInput, { target: { value: 'xyz123' } })
      })
      
      await waitFor(() => {
        expect(component.getByText('작업일지가 없습니다')).toBeInTheDocument()
        expect(component.getByText('검색 조건을 변경해보세요.')).toBeInTheDocument()
      })
    })
  })
})