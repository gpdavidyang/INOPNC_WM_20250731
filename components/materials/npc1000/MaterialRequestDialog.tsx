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
import { createClient } from '@/lib/supabase/client'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Package, Plus, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createMaterialRequest } from '@/app/actions/materials'

interface MaterialRequestItem {
  id: string
  materialId: string
  materialName: string
  category: string
  unit: string
  requestedQuantity: number
  urgencyLevel: 'normal' | 'urgent' | 'emergency'
  notes?: string
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

export default function MaterialRequestDialog({ 
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
  const [requestItems, setRequestItems] = useState<MaterialRequestItem[]>([])
  const [requestTitle, setRequestTitle] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [quantity, setQuantity] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal')
  const [itemNotes, setItemNotes] = useState('')

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
      // Reset form when dialog opens
      setRequestItems([])
      setRequestTitle('')
      setRequestNotes('')
      setSelectedMaterial('')
      setQuantity('')
      setUrgency('normal')
      setItemNotes('')
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

  const addRequestItem = () => {
    if (!selectedMaterial || !quantity) {
      toast.error('자재와 수량을 입력해주세요.')
      return
    }

    const material = materials.find(m => m.id === selectedMaterial)
    if (!material) return

    const quantityNum = parseFloat(quantity)
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error('올바른 수량을 입력해주세요.')
      return
    }

    const newItem: MaterialRequestItem = {
      id: Date.now().toString(),
      materialId: material.id,
      materialName: material.material_name,
      category: material.category,
      unit: material.unit,
      requestedQuantity: quantityNum,
      urgencyLevel: urgency,
      notes: itemNotes
    }

    setRequestItems(prev => [...prev, newItem])
    
    // Reset item form
    setSelectedMaterial('')
    setQuantity('')
    setUrgency('normal')
    setItemNotes('')
    
    toast.success('요청 항목이 추가되었습니다.')
  }

  const removeRequestItem = (itemId: string) => {
    setRequestItems(prev => prev.filter(item => item.id !== itemId))
    toast.success('항목이 제거되었습니다.')
  }

  const submitRequest = async () => {
    if (requestItems.length === 0) {
      toast.error('최소 하나 이상의 자재를 요청해야 합니다.')
      return
    }

    if (!requestTitle.trim()) {
      toast.error('요청 제목을 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      // Create material request
      const requestData = {
        site_id: siteId,
        title: requestTitle.trim(),
        description: requestNotes.trim() || null,
        status: 'pending',
        priority: requestItems.some(item => item.urgencyLevel === 'emergency') ? 'high' : 
                 requestItems.some(item => item.urgencyLevel === 'urgent') ? 'medium' : 'normal',
        requested_by: user.id,
        requested_at: new Date().toISOString(),
        items: requestItems.map(item => ({
          material_id: item.materialId,
          material_name: item.materialName,
          category: item.category,
          unit: item.unit,
          requested_quantity: item.requestedQuantity,
          urgency_level: item.urgencyLevel,
          notes: item.notes || null
        }))
      }

      // Insert request using server action
      const result = await createMaterialRequest({
        site_id: siteId,
        priority: urgencyLevel as 'low' | 'normal' | 'high' | 'urgent',
        needed_by: neededBy,
        notes: notes || undefined,
        items: items.map(item => ({
          material_id: item.materialId,
          requested_quantity: item.requestedQuantity,
          notes: item.notes || undefined
        }))
      })

      if (result.success) {
        toast.success('자재 요청이 성공적으로 제출되었습니다.')
        onSuccess?.()
        onOpenChange(false)
        setItems([])
        setNotes('')
        setNeededBy('')
        setUrgencyLevel('normal')
      } else {
        throw new Error(result.error || '요청 제출에 실패했습니다.')
      }
      
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('요청 제출에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const getUrgencyBadgeColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'urgent': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  const getUrgencyText = (level: string) => {
    switch (level) {
      case 'emergency': return '긴급'
      case 'urgent': return '급함'
      default: return '보통'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={getFullTypographyClass('heading', 'lg', isLargeFont)}>
            자재 요청
          </DialogTitle>
          {siteName && (
            <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-muted-foreground`}>
              현장: {siteName}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                요청 제목 *
              </Label>
              <Input
                id="title"
                placeholder="예: 콘크리트 자재 긴급 요청"
                value={requestTitle}
                onChange={(e) => setRequestTitle(e.target.value)}
                className={getFullTypographyClass('body', 'sm', isLargeFont)}
              />
            </div>
            
            <div>
              <Label htmlFor="notes" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                요청 사유 및 특이사항
              </Label>
              <Textarea
                id="notes"
                placeholder="요청 배경이나 특별한 요구사항을 입력하세요"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                rows={3}
                className={getFullTypographyClass('body', 'sm', isLargeFont)}
              />
            </div>
          </div>

          {/* Add Material Section */}
          <Card className="p-4">
            <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium mb-4`}>
              자재 추가
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>자재</Label>
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
                <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>수량</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div>
                <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>긴급도</Label>
                <Select value={urgency} onValueChange={(value: 'normal' | 'urgent' | 'emergency') => setUrgency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">보통</SelectItem>
                    <SelectItem value="urgent">급함</SelectItem>
                    <SelectItem value="emergency">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  type="button"
                  onClick={addRequestItem}
                  size={getButtonSize()}
                  disabled={!selectedMaterial || !quantity}
                  className="w-full"
                >
                  <Plus className={getIconSize()} />
                  추가
                </Button>
              </div>
            </div>

            <div>
              <Label className={getFullTypographyClass('body', 'sm', isLargeFont)}>비고</Label>
              <Input
                placeholder="추가 요청사항이나 특이사항"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>
          </Card>

          {/* Request Items List */}
          {requestItems.length > 0 && (
            <div className="space-y-3">
              <h3 className={`${getFullTypographyClass('heading', 'sm', isLargeFont)} font-medium`}>
                요청 항목 ({requestItems.length}개)
              </h3>
              
              <div className="space-y-2">
                {requestItems.map((item, index) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>
                                {item.materialName}
                              </span>
                              <Badge className={getUrgencyBadgeColor(item.urgencyLevel)}>
                                {getUrgencyText(item.urgencyLevel)}
                              </Badge>
                            </div>
                            <div className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-muted-foreground mb-1`}>
                              {item.category} • 요청량: {item.requestedQuantity.toLocaleString()}{item.unit}
                            </div>
                            {item.notes && (
                              <div className={`${getFullTypographyClass('body', 'xs', isLargeFont)} text-muted-foreground`}>
                                비고: {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRequestItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {requestItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                요청할 자재를 추가해주세요
              </p>
            </div>
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
            onClick={submitRequest}
            disabled={saving || requestItems.length === 0 || !requestTitle.trim()}
            size={getButtonSize()}
          >
            {saving ? '제출 중...' : '요청 제출'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}