'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ==========================================
// MATERIAL CATEGORY ACTIONS
// ==========================================

export async function getMaterialCategories() {
  try {
    // TODO: Implement when material_categories table is created
    // NPC-1000 Standard Hierarchical Categories
    const mockCategories = [
      { 
        id: '01', 
        name: '시멘트류',
        code: 'NPC-01',
        description: 'NPC-1000 표준 시멘트류',
        level: 1,
        parent_id: null,
        is_active: true
      },
      {
        id: '01-01',
        name: '포틀랜드 시멘트',
        code: 'NPC-01-01',
        description: '1종 포틀랜드 시멘트',
        level: 2,
        parent_id: '01',
        is_active: true
      },
      {
        id: '01-02',
        name: '혼합 시멘트',
        code: 'NPC-01-02', 
        description: '플라이애쉬 혼합 시멘트',
        level: 2,
        parent_id: '01',
        is_active: true
      },
      { 
        id: '02', 
        name: '골재류',
        code: 'NPC-02',
        description: 'NPC-1000 표준 골재류',
        level: 1,
        parent_id: null,
        is_active: true
      },
      {
        id: '02-01',
        name: '잔골재',
        code: 'NPC-02-01',
        description: '모래, 잔자갈',
        level: 2,
        parent_id: '02',
        is_active: true
      },
      {
        id: '02-02',
        name: '굵은골재',
        code: 'NPC-02-02',
        description: '자갈, 쇄석',
        level: 2,
        parent_id: '02',
        is_active: true
      },
      { 
        id: '03', 
        name: '철강재',
        code: 'NPC-03',
        description: 'NPC-1000 표준 철강재',
        level: 1,
        parent_id: null,
        is_active: true
      },
      {
        id: '03-01',
        name: '철근',
        code: 'NPC-03-01',
        description: '이형철근, 원형철근',
        level: 2,
        parent_id: '03',
        is_active: true
      },
      {
        id: '03-02',
        name: '형강',
        code: 'NPC-03-02',
        description: 'H형강, I형강, 앵글',
        level: 2,
        parent_id: '03',
        is_active: true
      }
    ]

    return { success: true, data: mockCategories }
  } catch (error) {
    console.error('Error in getMaterialCategories:', error)
    return { success: false, error: 'Failed to fetch material categories' }
  }
}

// TODO: Implement when material_categories table is created
// export async function createMaterialCategory(data: {
//   name: string
//   description?: string
// }) {
//   try {
//     const supabase = createClient()
    
//     const { data: category, error } = await supabase
//       .from('material_categories')
//       .insert(data)
//       .select()
//       .single()

//     if (error) {
//       console.error('Error creating material category:', error)
//       return { success: false, error: error.message }
//     }

//     revalidatePath('/dashboard/materials')
//     return { success: true, data: category }
//   } catch (error) {
//     console.error('Error in createMaterialCategory:', error)
//     return { success: false, error: 'Failed to create material category' }
//   }
// }

// ==========================================
// MATERIAL ACTIONS
// ==========================================

export async function getMaterials(filters: {
  category_id?: string
  is_active?: boolean
  search?: string
}) {
  try {
    // TODO: Implement when materials table is created
    // For now, return mock materials data with NPC-1000 standard items
    const mockMaterials = [
      // 시멘트류 - 포틀랜드 시멘트
      {
        id: 'MAT-01-001',
        category_id: '01-01',
        name: '1종 포틀랜드 시멘트',
        description: 'KS L 5201 규격 1종 포틀랜드 시멘트',
        material_code: 'NPC-01-01-001',
        unit: 'ton',
        unit_price: 150000,
        supplier: '삼표시멘트',
        minimum_stock: 10,
        maximum_stock: 100,
        current_stock: 45,
        is_active: true,
        category: { name: '포틀랜드 시멘트' }
      },
      {
        id: 'MAT-01-002', 
        category_id: '01-01',
        name: '2종 포틀랜드 시멘트',
        description: 'KS L 5201 규격 2종 포틀랜드 시멘트',
        material_code: 'NPC-01-01-002',
        unit: 'ton',
        unit_price: 145000,
        supplier: '한라시멘트',
        minimum_stock: 5,
        maximum_stock: 50,
        current_stock: 12,
        is_active: true,
        category: { name: '포틀랜드 시멘트' }
      },
      // 시멘트류 - 혼합 시멘트
      {
        id: 'MAT-01-003',
        category_id: '01-02',
        name: '플라이애쉬 시멘트',
        description: '플라이애쉬 20% 혼합 시멘트',
        material_code: 'NPC-01-02-001',
        unit: 'ton',
        unit_price: 140000,
        supplier: '아세아시멘트',
        minimum_stock: 8,
        maximum_stock: 80,
        current_stock: 28,
        is_active: true,
        category: { name: '혼합 시멘트' }
      },
      // 골재류 - 잔골재
      {
        id: 'MAT-02-001',
        category_id: '02-01',
        name: '세척사',
        description: '콘크리트용 세척 강모래',
        material_code: 'NPC-02-01-001',
        unit: 'm³',
        unit_price: 25000,
        supplier: '한강골재',
        minimum_stock: 50,
        maximum_stock: 500,
        current_stock: 125,
        is_active: true,
        category: { name: '잔골재' }
      },
      {
        id: 'MAT-02-002',
        category_id: '02-01',
        name: '부순모래',
        description: '콘크리트용 부순 모래',
        material_code: 'NPC-02-01-002',
        unit: 'm³',
        unit_price: 28000,
        supplier: '영남골재',
        minimum_stock: 30,
        maximum_stock: 300,
        current_stock: 85,
        is_active: true,
        category: { name: '잔골재' }
      },
      // 골재류 - 굵은골재
      {
        id: 'MAT-02-003',
        category_id: '02-02',
        name: '부순돌 25mm',
        description: '콘크리트용 부순돌 25mm',
        material_code: 'NPC-02-02-001',
        unit: 'm³',
        unit_price: 22000,
        supplier: '대한골재',
        minimum_stock: 40,
        maximum_stock: 400,
        current_stock: 156,
        is_active: true,
        category: { name: '굵은골재' }
      },
      {
        id: 'MAT-02-004',
        category_id: '02-02',
        name: '부순돌 40mm',
        description: '콘크리트용 부순돌 40mm',
        material_code: 'NPC-02-02-002',
        unit: 'm³',
        unit_price: 20000,
        supplier: '대한골재',
        minimum_stock: 30,
        maximum_stock: 300,
        current_stock: 92,
        is_active: true,
        category: { name: '굵은골재' }
      },
      // 철강재 - 철근
      {
        id: 'MAT-03-001',
        category_id: '03-01',
        name: 'D13 이형철근',
        description: 'SD400 D13 이형철근',
        material_code: 'NPC-03-01-001',
        unit: 'ton',
        unit_price: 850000,
        supplier: '현대제철',
        minimum_stock: 5,
        maximum_stock: 50,
        current_stock: 18,
        is_active: true,
        category: { name: '철근' }
      },
      {
        id: 'MAT-03-002',
        category_id: '03-01',
        name: 'D16 이형철근',
        description: 'SD400 D16 이형철근',
        material_code: 'NPC-03-01-002',
        unit: 'ton',
        unit_price: 850000,
        supplier: '현대제철',
        minimum_stock: 8,
        maximum_stock: 80,
        current_stock: 24,
        is_active: true,
        category: { name: '철근' }
      },
      {
        id: 'MAT-03-003',
        category_id: '03-01',
        name: 'D19 이형철근',
        description: 'SD400 D19 이형철근',
        material_code: 'NPC-03-01-003',
        unit: 'ton',
        unit_price: 850000,
        supplier: '포스코',
        minimum_stock: 6,
        maximum_stock: 60,
        current_stock: 15,
        is_active: true,
        category: { name: '철근' }
      },
      // 철강재 - 형강
      {
        id: 'MAT-03-004',
        category_id: '03-02',
        name: 'H-200×100×5.5×8',
        description: 'H형강 200×100×5.5×8',
        material_code: 'NPC-03-02-001',
        unit: 'ton',
        unit_price: 950000,
        supplier: '포스코',
        minimum_stock: 3,
        maximum_stock: 30,
        current_stock: 8,
        is_active: true,
        category: { name: '형강' }
      },
      {
        id: 'MAT-03-005',
        category_id: '03-02',
        name: 'ㄱ-50×50×5',
        description: '앵글 50×50×5',
        material_code: 'NPC-03-02-002',
        unit: 'ton',
        unit_price: 920000,
        supplier: '동국제강',
        minimum_stock: 2,
        maximum_stock: 20,
        current_stock: 5,
        is_active: true,
        category: { name: '형강' }
      }
    ]

    // Apply filters to mock data
    let filteredMaterials = mockMaterials

    if (filters.category_id) {
      filteredMaterials = filteredMaterials.filter(m => m.category_id === filters.category_id)
    }
    if (filters.is_active !== undefined) {
      filteredMaterials = filteredMaterials.filter(m => m.is_active === filters.is_active)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredMaterials = filteredMaterials.filter(m =>
        m.name.toLowerCase().includes(searchLower) ||
        m.material_code.toLowerCase().includes(searchLower) ||
        m.description.toLowerCase().includes(searchLower)
      )
    }

    return { success: true, data: filteredMaterials }
  } catch (error) {
    console.error('Error in getMaterials:', error)
    return { success: false, error: 'Failed to fetch materials' }
  }
}

// TODO: Implement when materials table is created
export async function createMaterial(data: {
  category_id: string
  name: string
  description?: string
  unit: string
  unit_price?: number
  supplier?: string
  material_code: string
  is_active?: boolean
}) {
  try {
    // For now, just return success with mock data
    const newMaterial = {
      id: `MAT-${Date.now()}`,
      ...data,
      category: { name: 'Mock Category' }
    }
    
    return { success: true, data: newMaterial }
  } catch (error) {
    console.error('Error in createMaterial:', error)
    return { success: false, error: 'Failed to create material' }
  }
}

// TODO: Implement when materials table is created
export async function updateMaterial(
  id: string,
  data: Partial<{
    category_id: string
    name: string
    description: string
    unit: string
    unit_price: number
    supplier: string
    material_code: string
    is_active: boolean
  }>
) {
  try {
    // For now, just return success with mock data
    const updatedMaterial = {
      id,
      ...data,
      category: { name: 'Mock Category' }
    }
    
    return { success: true, data: updatedMaterial }
  } catch (error) {
    console.error('Error in updateMaterial:', error)
    return { success: false, error: 'Failed to update material' }
  }
}

// ==========================================
// MATERIAL INVENTORY ACTIONS
// ==========================================

// TODO: Implement when material_inventory table is created
export async function getMaterialInventory(site_id: string) {
  try {
    // Return mock inventory data
    const mockInventory = [
      {
        id: 'inv-1',
        site_id,
        material_id: 'MAT-01-001',
        current_stock: 45,
        minimum_stock: 10,
        maximum_stock: 100,
        material: {
          id: 'MAT-01-001',
          name: '1종 포틀랜드 시멘트',
          unit: 'ton',
          material_code: 'NPC-01-01-001',
          category: { name: '포틀랜드 시멘트' }
        }
      }
    ]

    return { success: true, data: mockInventory }
  } catch (error) {
    console.error('Error in getMaterialInventory:', error)
    return { success: false, error: 'Failed to fetch material inventory' }
  }
}

// TODO: Implement when material_inventory table is created
export async function updateMaterialStock(
  site_id: string,
  material_id: string,
  data: {
    current_stock: number
    minimum_stock?: number
    maximum_stock?: number
  }
) {
  try {
    // Mock implementation
    const mockResult = {
      id: `inv-${material_id}`,
      site_id,
      material_id,
      ...data,
      updated_at: new Date().toISOString()
    }

    return { success: true, data: mockResult }
  } catch (error) {
    console.error('Error in updateMaterialStock:', error)
    return { success: false, error: 'Failed to update material stock' }
  }
}

// ==========================================
// MATERIAL REQUEST ACTIONS
// ==========================================

// TODO: Implement when material_requests table is created
export async function createMaterialRequest(data: {
  site_id: string
  requested_by: string
  required_date: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  notes?: string
  items: Array<{
    material_id: string
    requested_quantity: number
    notes?: string
  }>
}) {
  try {
    // Mock implementation
    const mockRequest = {
      id: `req-${Date.now()}`,
      site_id: data.site_id,
      requested_by: data.requested_by,
      required_date: data.required_date,
      priority: data.priority,
      notes: data.notes,
      status: 'pending' as const,
      created_at: new Date().toISOString()
    }

    return { success: true, data: mockRequest }
  } catch (error) {
    console.error('Error in createMaterialRequest:', error)
    return { success: false, error: 'Failed to create material request' }
  }
}

// TODO: Implement when material_requests table is created
export async function getMaterialRequests(filters: {
  site_id?: string
  status?: string
  priority?: string
  requested_by?: string
}) {
  try {
    // Mock implementation
    const mockRequests: any[] = []
    return { success: true, data: mockRequests }
  } catch (error) {
    console.error('Error in getMaterialRequests:', error)
    return { success: false, error: 'Failed to fetch material requests' }
  }
}

// TODO: Implement when material_requests table is created
export async function updateMaterialRequestStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'delivered',
  notes?: string
) {
  try {
    // Mock implementation
    const mockUpdatedRequest = {
      id,
      status,
      updated_at: new Date().toISOString()
    }
    
    return { success: true, data: mockUpdatedRequest }
  } catch (error) {
    console.error('Error in updateMaterialRequestStatus:', error)
    return { success: false, error: 'Failed to update request status' }
  }
}

// ==========================================
// MATERIAL TRANSACTION ACTIONS
// ==========================================

// TODO: Implement when material_transactions table is created
export async function createMaterialTransaction(data: {
  site_id: string
  material_id: string
  transaction_type: 'in' | 'out' | 'return' | 'waste' | 'adjustment'
  quantity: number
  reference_type?: string
  reference_id?: string
  notes?: string
}) {
  try {
    // Mock implementation
    const mockTransaction = {
      id: `txn-${Date.now()}`,
      ...data,
      performed_by: 'mock-user-id',
      created_at: new Date().toISOString()
    }

    return { success: true, data: mockTransaction }
  } catch (error) {
    console.error('Error in createMaterialTransaction:', error)
    return { success: false, error: 'Failed to create material transaction' }
  }
}

// TODO: Implement when material_transactions table is created
export async function getMaterialTransactions(filters: {
  site_id?: string
  material_id?: string
  transaction_type?: string
  date_from?: string
  date_to?: string
}) {
  try {
    // Mock implementation
    const mockTransactions: any[] = []
    return { success: true, data: mockTransactions }
  } catch (error) {
    console.error('Error in getMaterialTransactions:', error)
    return { success: false, error: 'Failed to fetch material transactions' }
  }
}