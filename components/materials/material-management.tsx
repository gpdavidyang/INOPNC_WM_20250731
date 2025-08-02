'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useFontSize, getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  ArrowUpDown,
  Building2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Package2,
  FileText,
  Truck
} from 'lucide-react'
import { MaterialCatalog } from './material-catalog'
import { MaterialInventory } from './material-inventory'
import { MaterialRequests } from './material-requests'
import { MaterialTransactions } from './material-transactions'

interface MaterialManagementProps {
  materials: any[]
  categories: any[]
  initialInventory: any[]
  currentUser: any
  currentSite?: any
}

export function MaterialManagement({ materials, categories, initialInventory, currentUser, currentSite }: MaterialManagementProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [activeTab, setActiveTab] = useState('catalog')
  const [searchQuery, setSearchQuery] = useState('')

  // Calculate statistics
  const totalMaterials = materials.length
  const activeMaterials = materials.filter(m => m.is_active).length
  const lowStockItems = materials.filter(m => 
    m.current_stock !== undefined && 
    m.minimum_stock !== undefined && 
    m.current_stock <= m.minimum_stock
  ).length
  const pendingRequests = 3 // Mock pending requests

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-4' : 'p-5'
        } bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-blue-600`}>총 자재</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-blue-900`}>{totalMaterials}</p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-blue-600 mt-1`}>{activeMaterials} 활성</p>
            </div>
            <Package className={`${
              touchMode === 'glove' ? 'h-10 w-10' : touchMode === 'precision' ? 'h-6 w-6' : 'h-8 w-8'
            } text-blue-600`} />
          </div>
        </Card>

        <Card className={`${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-4' : 'p-5'
        } bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-amber-600`}>재고 부족</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-amber-900`}>{lowStockItems}</p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-amber-600 mt-1`}>즉시 보충 필요</p>
            </div>
            <AlertCircle className={`${
              touchMode === 'glove' ? 'h-10 w-10' : touchMode === 'precision' ? 'h-6 w-6' : 'h-8 w-8'
            } text-amber-600`} />
          </div>
        </Card>

        <Card className={`${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-4' : 'p-5'
        } bg-gradient-to-br from-green-50 to-green-100 border-green-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-green-600`}>대기중 요청</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-green-900`}>{pendingRequests}</p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-green-600 mt-1`}>승인 대기중</p>
            </div>
            <FileText className={`${
              touchMode === 'glove' ? 'h-10 w-10' : touchMode === 'precision' ? 'h-6 w-6' : 'h-8 w-8'
            } text-green-600`} />
          </div>
        </Card>

        <Card className={`${
          touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-4' : 'p-5'
        } bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-purple-600`}>금일 거래</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-purple-900`}>0</p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-purple-600 mt-1`}>입/출고 거래</p>
            </div>
            <Truck className={`${
              touchMode === 'glove' ? 'h-10 w-10' : touchMode === 'precision' ? 'h-6 w-6' : 'h-8 w-8'
            } text-purple-600`} />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            touchMode === 'glove' ? 'h-5 w-5' : touchMode === 'precision' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          } text-gray-400`} />
          <Input
            type="text"
            placeholder="자재명, 자재코드로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className={`gap-2 ${
          touchMode === 'glove' ? 'min-h-[56px] px-5' : touchMode === 'precision' ? 'min-h-[44px] px-3' : 'min-h-[48px] px-4'
        }`}>
          <Filter className={`${
            touchMode === 'glove' ? 'h-5 w-5' : touchMode === 'precision' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          }`} />
          <span className={getFullTypographyClass('body', 'base', isLargeFont)}>필터</span>
        </Button>
        <Button variant="outline" className={`gap-2 ${
          touchMode === 'glove' ? 'min-h-[56px] px-5' : touchMode === 'precision' ? 'min-h-[44px] px-3' : 'min-h-[48px] px-4'
        }`}>
          <ArrowUpDown className={`${
            touchMode === 'glove' ? 'h-5 w-5' : touchMode === 'precision' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          }`} />
          <span className={getFullTypographyClass('body', 'base', isLargeFont)}>정렬</span>
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog" className={`gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px] py-4' : touchMode === 'precision' ? 'min-h-[44px] py-2' : 'min-h-[48px] py-3'
          }`}>
            <Package2 className={`${
              touchMode === 'glove' ? 'h-5 w-5' : touchMode === 'precision' ? 'h-3.5 w-3.5' : 'h-4 w-4'
            }`} />
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>자재 카탈로그</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className={`gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px] py-4' : touchMode === 'precision' ? 'min-h-[44px] py-2' : 'min-h-[48px] py-3'
          }`}>
            <Building2 className={`${
              touchMode === 'glove' ? 'h-5 w-5' : touchMode === 'precision' ? 'h-3.5 w-3.5' : 'h-4 w-4'
            }`} />
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>재고 관리</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className={`gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px] py-4' : touchMode === 'precision' ? 'min-h-[44px] py-2' : 'min-h-[48px] py-3'
          }`}>
            <FileText className={`${
              touchMode === 'glove' ? 'h-5 w-5' : touchMode === 'precision' ? 'h-3.5 w-3.5' : 'h-4 w-4'
            }`} />
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>자재 요청</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className={`gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px] py-4' : touchMode === 'precision' ? 'min-h-[44px] py-2' : 'min-h-[48px] py-3'
          }`}>
            <Truck className={`${
              touchMode === 'glove' ? 'h-5 w-5' : touchMode === 'precision' ? 'h-3.5 w-3.5' : 'h-4 w-4'
            }`} />
            <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>입출고 내역</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <MaterialCatalog 
            materials={materials} 
            categories={categories}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <MaterialInventory 
            materials={materials}
            initialInventory={initialInventory}
            currentUser={currentUser}
            currentSite={currentSite}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <MaterialRequests 
            materials={materials}
            currentUser={currentUser}
            currentSite={currentSite}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <MaterialTransactions 
            materials={materials}
            currentUser={currentUser}
            currentSite={currentSite}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}