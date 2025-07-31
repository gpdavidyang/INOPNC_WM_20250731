'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Edit2,
  MoreVertical,
  Package,
  DollarSign,
  Building,
  Hash,
  ChevronRight,
  FolderOpen
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createMaterial, updateMaterial } from '@/app/actions/materials'
import { toast } from '@/components/ui/use-toast'

interface MaterialCatalogProps {
  materials: any[]
  categories: any[]
  searchQuery: string
}

export function MaterialCatalog({ materials, categories, searchQuery }: MaterialCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    unit: 'ea',
    unit_price: '',
    supplier: '',
    material_code: '',
    is_active: true
  })

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchQuery || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.material_code?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || material.category_id === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Group materials by category
  const materialsByCategory = filteredMaterials.reduce((acc, material) => {
    const categoryName = material.category?.name || '미분류'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(material)
    return acc
  }, {} as Record<string, any[]>)

  const handleSubmit = async () => {
    try {
      if (editingMaterial) {
        const result = await updateMaterial(editingMaterial.id, {
          ...formData,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined
        })
        if (result.success) {
          toast({
            title: '자재 수정 완료',
            description: '자재 정보가 성공적으로 수정되었습니다.'
          })
          setEditingMaterial(null)
          setShowAddDialog(false)
        } else {
          toast({
            title: '자재 수정 실패',
            description: result.error,
            variant: 'destructive'
          })
        }
      } else {
        const result = await createMaterial({
          ...formData,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined
        })
        if (result.success) {
          toast({
            title: '자재 추가 완료',
            description: '새 자재가 성공적으로 추가되었습니다.'
          })
          setShowAddDialog(false)
          resetForm()
        } else {
          toast({
            title: '자재 추가 실패',
            description: result.error,
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '자재 처리 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      description: '',
      unit: 'ea',
      unit_price: '',
      supplier: '',
      material_code: '',
      is_active: true
    })
  }

  const handleEdit = (material: any) => {
    setEditingMaterial(material)
    setFormData({
      category_id: material.category_id || '',
      name: material.name,
      description: material.description || '',
      unit: material.unit,
      unit_price: material.unit_price?.toString() || '',
      supplier: material.supplier || '',
      material_code: material.material_code || '',
      is_active: material.is_active
    })
    setShowAddDialog(true)
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!selectedCategory ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          전체
        </Button>
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Add Material Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => {
            resetForm()
            setEditingMaterial(null)
            setShowAddDialog(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          자재 추가
        </Button>
      </div>

      {/* Materials by Category */}
      <div className="space-y-6">
        {Object.entries(materialsByCategory).map(([categoryName, categoryMaterials]) => (
          <div key={categoryName} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FolderOpen className="h-4 w-4" />
              {categoryName}
              <Badge variant="secondary" className="ml-2">
                {categoryMaterials.length}개
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryMaterials.map(material => (
                <Card key={material.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{material.name}</h3>
                      {material.description && (
                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(material)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Hash className="h-3.5 w-3.5" />
                      <span>코드: {material.material_code || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="h-3.5 w-3.5" />
                      <span>단위: {material.unit}</span>
                    </div>
                    {material.unit_price && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>단가: {material.unit_price.toLocaleString()}원</span>
                      </div>
                    )}
                    {material.supplier && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="h-3.5 w-3.5" />
                        <span>공급업체: {material.supplier}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant={material.is_active ? 'default' : 'secondary'}>
                      {material.is_active ? '사용중' : '사용안함'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Material Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? '자재 수정' : '새 자재 추가'}
            </DialogTitle>
            <DialogDescription>
              NPC-1000 표준에 따른 자재 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full mt-1.5 h-10 px-3 rounded-md border border-gray-300 bg-white"
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="name">자재명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: NPC-1000 표준 콘크리트"
                required
              />
            </div>

            <div>
              <Label htmlFor="material_code">자재 코드 *</Label>
              <Input
                id="material_code"
                value={formData.material_code}
                onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                placeholder="예: NPC-1000-001"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">단위 *</Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full mt-1.5 h-10 px-3 rounded-md border border-gray-300 bg-white"
                  required
                >
                  <option value="ea">개</option>
                  <option value="kg">kg</option>
                  <option value="ton">톤</option>
                  <option value="m">m</option>
                  <option value="m²">m²</option>
                  <option value="m³">m³</option>
                  <option value="L">리터</option>
                  <option value="box">박스</option>
                  <option value="set">세트</option>
                </select>
              </div>

              <div>
                <Label htmlFor="unit_price">단가 (원)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="supplier">공급업체</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="공급업체명"
              />
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="자재에 대한 추가 설명"
                rows={3}
                className="w-full mt-1.5 px-3 py-2 rounded-md border border-gray-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="font-normal cursor-pointer">
                즉시 사용 가능
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>
              {editingMaterial ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}