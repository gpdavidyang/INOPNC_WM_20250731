'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
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
}

export function MaterialManagement({ materials, categories }: MaterialManagementProps) {
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
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">총 자재</p>
              <p className="text-2xl font-bold text-blue-900">{totalMaterials}</p>
              <p className="text-xs text-blue-600 mt-1">{activeMaterials} 활성</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">재고 부족</p>
              <p className="text-2xl font-bold text-amber-900">{lowStockItems}</p>
              <p className="text-xs text-amber-600 mt-1">즉시 보충 필요</p>
            </div>
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">대기중 요청</p>
              <p className="text-2xl font-bold text-green-900">{pendingRequests}</p>
              <p className="text-xs text-green-600 mt-1">승인 대기중</p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">금일 거래</p>
              <p className="text-2xl font-bold text-purple-900">0</p>
              <p className="text-xs text-purple-600 mt-1">입/출고 거래</p>
            </div>
            <Truck className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="자재명, 자재코드로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          필터
        </Button>
        <Button variant="outline" className="gap-2">
          <ArrowUpDown className="h-4 w-4" />
          정렬
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="catalog" className="gap-2">
            <Package2 className="h-4 w-4" />
            자재 카탈로그
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Building2 className="h-4 w-4" />
            재고 관리
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <FileText className="h-4 w-4" />
            자재 요청
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Truck className="h-4 w-4" />
            입출고 내역
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
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <MaterialRequests 
            materials={materials}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <MaterialTransactions 
            materials={materials}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}