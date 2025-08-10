'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { 
  Package, 
  TrendingUp, 
  Calendar,
  ArrowDown,
  ArrowUp,
  Archive,
  Plus,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { createClient } from '@/lib/supabase/client'

interface DailyStatus {
  incoming: number
  used: number
  inventory: number
}

interface CumulativeStatus {
  totalIncoming: number
  totalUsed: number
  totalInventory: number
}

interface InventoryMovement {
  date: string
  incoming: number
  used: number
  inventory: number
}

interface Site {
  id: string
  name: string
}

interface Props {
  currentSiteId?: string
  currentSiteName?: string
}

export default function NPC1000DailyDashboard({ currentSiteId, currentSiteName }: Props) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [loading, setLoading] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string>(currentSiteId || '')
  const [availableSites, setAvailableSites] = useState<Site[]>([])
  const [dailyStatus, setDailyStatus] = useState<DailyStatus>({ incoming: 0, used: 0, inventory: 0 })
  const [cumulativeStatus, setCumulativeStatus] = useState<CumulativeStatus>({ totalIncoming: 0, totalUsed: 0, totalInventory: 0 })
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [sortField, setSortField] = useState<'date' | 'incoming' | 'used' | 'inventory'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Touch-responsive sizing
  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field'
    if (touchMode === 'precision') return 'compact'
    return 'standard'
  }

  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  // Load available sites
  useEffect(() => {
    const loadSites = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')
      
      if (data) {
        setAvailableSites(data)
        if (!selectedSiteId && data.length > 0) {
          setSelectedSiteId(data[0].id)
        }
      }
    }
    loadSites()
  }, [])

  // Update selected site when currentSiteId changes
  useEffect(() => {
    if (currentSiteId && currentSiteId !== selectedSiteId) {
      setSelectedSiteId(currentSiteId)
    }
  }, [currentSiteId])

  // Load NPC-1000 data for selected site
  useEffect(() => {
    if (selectedSiteId) {
      loadNPCData()
    }
  }, [selectedSiteId])

  const loadNPCData = async () => {
    if (!selectedSiteId) return
    
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // Get today's date for daily status
      const today = new Date().toISOString().split('T')[0]
      
      // Get daily records for the site
      const { data: records } = await supabase
        .from('npc1000_daily_records')
        .select(`
          incoming_quantity,
          used_quantity,
          remaining_quantity,
          daily_reports!inner(
            work_date,
            site_id
          )
        `)
        .eq('daily_reports.site_id', selectedSiteId)
      
      if (records) {
        // Calculate today's status
        const todayRecords = records.filter(r => r.daily_reports.work_date === today)
        const todayStatus = {
          incoming: todayRecords.reduce((sum, r) => sum + (r.incoming_quantity || 0), 0),
          used: todayRecords.reduce((sum, r) => sum + (r.used_quantity || 0), 0),
          inventory: todayRecords.reduce((sum, r) => sum + (r.remaining_quantity || 0), 0)
        }
        setDailyStatus(todayStatus)
        
        // Calculate cumulative status
        const cumulativeStatus = {
          totalIncoming: records.reduce((sum, r) => sum + (r.incoming_quantity || 0), 0),
          totalUsed: records.reduce((sum, r) => sum + (r.used_quantity || 0), 0),
          totalInventory: records.reduce((sum, r) => sum + (r.remaining_quantity || 0), 0)
        }
        setCumulativeStatus(cumulativeStatus)
        
        // Group by date for movements table
        const movementsByDate = new Map<string, { incoming: number, used: number, inventory: number }>()
        records.forEach(r => {
          const date = r.daily_reports.work_date
          const existing = movementsByDate.get(date) || { incoming: 0, used: 0, inventory: 0 }
          movementsByDate.set(date, {
            incoming: existing.incoming + (r.incoming_quantity || 0),
            used: existing.used + (r.used_quantity || 0),
            inventory: existing.inventory + (r.remaining_quantity || 0)
          })
        })
        
        const movementsData = Array.from(movementsByDate.entries()).map(([date, data]) => ({
          date,
          ...data
        }))
        setMovements(movementsData)
      }
      
    } catch (error) {
      console.error('Error loading NPC-1000 data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle sorting
  const handleSort = (field: 'date' | 'incoming' | 'used' | 'inventory') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedMovements = [...movements].sort((a, b) => {
    let valueA: any, valueB: any
    
    switch (sortField) {
      case 'date':
        valueA = new Date(a.date)
        valueB = new Date(b.date)
        break
      case 'incoming':
        valueA = a.incoming
        valueB = b.incoming
        break
      case 'used':
        valueA = a.used
        valueB = b.used
        break
      case 'inventory':
        valueA = a.inventory
        valueB = b.inventory
        break
      default:
        return 0
    }
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
  
  return (
    <div className="space-y-3">
      {/* NPC-1000 Management Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className={`${getIconSize()} text-blue-600 dark:text-blue-400`} />
          <h1 className={`${getFullTypographyClass('heading', isLargeFont ? 'lg' : 'md', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>
            NPC-1000 관리
          </h1>
        </div>
        {currentSiteName && (
          <div className="mb-2">
            <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>
              현재 현장: <span className="font-medium text-gray-900 dark:text-gray-100">{currentSiteName}</span>
            </span>
          </div>
        )}
      </div>

      {/* Today's Status */}
      <div>
        <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100 mb-2`}>
          금일 현황
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <ArrowDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400 mb-0.5`}>
                입고
              </p>
              <p className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>
                {dailyStatus.incoming}
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <ArrowUp className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400 mb-0.5`}>
                사용
              </p>
              <p className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>
                {dailyStatus.used}
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Archive className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400 mb-0.5`}>
                재고
              </p>
              <p className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-blue-600 dark:text-blue-400`}>
                {dailyStatus.inventory}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Cumulative Status */}
      <div>
        <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100 mb-2`}>
          누적 현황
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <ArrowDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400 mb-0.5`}>
                총입고
              </p>
              <p className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>
                {cumulativeStatus.totalIncoming}
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <ArrowUp className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400 mb-0.5`}>
                총사용
              </p>
              <p className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>
                {cumulativeStatus.totalUsed}
              </p>
            </div>
          </Card>
          
          <Card>
            <div className="p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Archive className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400 mb-0.5`}>
                현재고
              </p>
              <p className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-green-600 dark:text-green-400`}>
                {cumulativeStatus.totalInventory}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Inventory Movement Table */}
      <Card>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th 
                    className="text-left py-3 px-2 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      날짜
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('incoming')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      입고
                      {sortField === 'incoming' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('used')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      사용
                      {sortField === 'used' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-2 font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    onClick={() => handleSort('inventory')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      재고
                      {sortField === 'inventory' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center">
                      <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                        NPC-1000 자재 기록이 없습니다.
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedMovements.map((movement, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {new Date(movement.date).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {movement.incoming}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {movement.used}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {movement.inventory}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          size={getButtonSize()}
          className="flex-1 gap-2"
          variant="outline"
        >
          <Plus className={getIconSize()} />
          요청
        </Button>
        <Button 
          size={getButtonSize()}
          className="flex-1 gap-2"
          variant="outline"
        >
          <FileText className={getIconSize()} />
          입출고 기록
        </Button>
      </div>
    </div>
  )
}