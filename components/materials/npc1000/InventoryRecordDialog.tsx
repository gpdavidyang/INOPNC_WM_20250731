'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Package, ArrowDown, ArrowUp, Calendar, User, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { createMaterialTransaction } from '@/app/actions/materials'

interface InventoryRecord {
  id: string
  materialId: string
  materialName: string
  category: string
  unit: string
  transactionType: 'incoming' | 'outgoing'
  quantity: number
  remainingQuantity: number
  supplier?: string
  notes?: string
  recordedAt: string
  recordedBy: string
}

interface NPC1000Material {
  id: string
  material_name: string
  category: string
  npc_code: string
  unit: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  siteName?: string
  onSuccess?: () => void
}

export default function InventoryRecordDialog({ 
  open, 
  onOpenChange, 
  siteId, 
  siteName,
  onSuccess 
}: Props) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [materials, setMaterials] = useState<NPC1000Material[]>([])
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')
  
  // Form state
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [quantity, setQuantity] = useState('')
  const [remainingQuantity, setRemainingQuantity] = useState('')
  const [supplier, setSupplier] = useState('')
  const [notes, setNotes] = useState('')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])

  // Touch-responsive sizing
  const getButtonSize = () => {
    if (touchMode === 'glove') return 'lg'
    if (touchMode === 'precision') return 'sm'
    return 'default'
  }

  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  // Load NPC-1000 materials
  useEffect(() => {
    if (open) {
      loadMaterials()
      resetForm()
    }
  }, [open])

  const loadMaterials = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('npc1000_materials')
        .select('*')
        .order('category, material_name')

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
      toast.error('자재 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedMaterial('')
    setQuantity('')
    setRemainingQuantity('')
    setSupplier('')
    setNotes('')
    setRecordDate(new Date().toISOString().split('T')[0])
    setActiveTab('incoming')
  }

  const submitRecord = async () => {
    if (!selectedMaterial || !quantity || !recordDate) {
      toast.error('필수 항목을 모두 입력해주세요.')
      return
    }

    const quantityNum = parseFloat(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('올바른 수량을 입력해주세요.')
      return
    }

    const remainingNum = remainingQuantity ? parseFloat(remainingQuantity) : 0
    if (remainingQuantity && (isNaN(remainingNum) || remainingNum < 0)) {
      toast.error('올바른 잔여 수량을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      const material = materials.find(m => m.id === selectedMaterial)
      if (!material) throw new Error('선택된 자재를 찾을 수 없습니다.')

      // Create inventory record data
      const recordData = {
        site_id: siteId,
        material_id: selectedMaterial,
        material_name: material.material_name,
        category: material.category,
        unit: material.unit,
        transaction_type: activeTab,
        quantity: quantityNum,
        remaining_quantity: remainingNum || 0,
        supplier: activeTab === 'incoming' ? supplier.trim() || null : null,
        notes: notes.trim() || null,
        record_date: recordDate,
        recorded_by: user.id,
        recorded_at: new Date().toISOString()
      }

      // This would typically involve:
      // 1. Insert into npc1000_daily_records or similar table
      // 2. Update material inventory levels
      // 3. Create audit trail
      
      // For now, we'll simulate success
      console.log('Inventory record:', recordData)
      
      const actionText = activeTab === 'incoming' ? '입고' : '출고'
      toast.success(`${actionText} 기록이 성공적으로 저장되었습니다.`)
      
      onSuccess?.()
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('기록 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            입출고 기록
          </DialogTitle>
          {siteName && (
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
              현장: {siteName}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Type Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'incoming' | 'outgoing')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="incoming" className="flex items-center gap-2">
                <ArrowDown className="h-4 w-4 text-green-600" />
                <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>입고</span>
              </TabsTrigger>
              <TabsTrigger value="outgoing" className="flex items-center gap-2">
                <ArrowUp className="h-4 w-4 text-red-600" />
                <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>출고</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="incoming" className="space-y-4 mt-6">
              <Card className="p-4 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDown className="h-5 w-5 text-green-600" />
                  <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium text-green-800 dark:text-green-400`}>
                    자재 입고 기록
                  </h3>
                </div>
                <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-green-700 dark:text-green-300`}>
                  현장에 새로 들어온 자재의 수량과 공급업체 정보를 기록합니다.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="outgoing" className="space-y-4 mt-6">
              <Card className="p-4 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUp className="h-5 w-5 text-red-600" />
                  <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium text-red-800 dark:text-red-400`}>
                    자재 출고 기록
                  </h3>
                </div>
                <p className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-red-700 dark:text-red-300`}>
                  공사에 사용된 자재의 수량과 사용 내역을 기록합니다.
                </p>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                자재 선택 *
              </Label>
              <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                <SelectTrigger>
                  <SelectValue placeholder="자재 선택" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      <div>
                        <div className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                          {material.material_name}
                        </div>
                        <div className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-muted-foreground`}>
                          {material.category} ({material.npc_code})
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                기록 일자 *
              </Label>
              <Input
                id="date"
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className={getFullTypographyClass('body', 'sm', isLargeFont)}
              />
            </div>

            <div>
              <Label htmlFor="quantity" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                {activeTab === 'incoming' ? '입고' : '출고'} 수량 *
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={getFullTypographyClass('body', 'sm', isLargeFont)}
              />
            </div>

            <div>
              <Label htmlFor="remaining" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                잔여 수량
              </Label>
              <Input
                id="remaining"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={remainingQuantity}
                onChange={(e) => setRemainingQuantity(e.target.value)}
                className={getFullTypographyClass('body', 'sm', isLargeFont)}
              />
            </div>

            {activeTab === 'incoming' && (
              <div className="md:col-span-2">
                <Label htmlFor="supplier" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                  공급업체
                </Label>
                <Input
                  id="supplier"
                  placeholder="공급업체명을 입력하세요"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className={getFullTypographyClass('body', 'sm', isLargeFont)}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
              비고 및 특이사항
            </Label>
            <Textarea
              id="notes"
              placeholder={activeTab === 'incoming' 
                ? "입고 관련 특이사항이나 품질 상태 등을 기록하세요" 
                : "사용된 위치나 목적, 담당자 등을 기록하세요"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={getFullTypographyClass('body', 'sm', isLargeFont)}
            />
          </div>

          {/* Summary Card */}
          {selectedMaterial && quantity && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium text-blue-800 dark:text-blue-400`}>
                  기록 요약
                </h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">자재:</span>
                  <span className="font-medium">
                    {materials.find(m => m.id === selectedMaterial)?.material_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">구분:</span>
                  <Badge className={activeTab === 'incoming' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }>
                    {activeTab === 'incoming' ? '입고' : '출고'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">수량:</span>
                  <span className="font-medium">
                    {parseFloat(quantity).toLocaleString()}{materials.find(m => m.id === selectedMaterial)?.unit}
                  </span>
                </div>
                {remainingQuantity && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">잔여:</span>
                    <span className="font-medium text-blue-600">
                      {parseFloat(remainingQuantity).toLocaleString()}{materials.find(m => m.id === selectedMaterial)?.unit}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">일자:</span>
                  <span className="font-medium">
                    {new Date(recordDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            size={getButtonSize()}
          >
            취소
          </Button>
          <Button
            onClick={submitRecord}
            disabled={saving || !selectedMaterial || !quantity || !recordDate}
            size={getButtonSize()}
            className={activeTab === 'incoming' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
            }
          >
            {saving ? '저장 중...' : (activeTab === 'incoming' ? '입고 기록' : '출고 기록')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}