'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ==========================================
// MATERIAL CATEGORY ACTIONS
// ==========================================

export async function getMaterialCategories() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('material_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching material categories:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getMaterialCategories:', error)
    return { success: false, error: 'Failed to fetch material categories' }
  }
}

export async function createMaterialCategory(data: {
  name: string
  description?: string
}) {
  try {
    const supabase = createClient()
    
    const { data: category, error } = await supabase
      .from('material_categories')
      .insert(data)
      .select()
      .single()

    if (error) {
      console.error('Error creating material category:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/materials')
    return { success: true, data: category }
  } catch (error) {
    console.error('Error in createMaterialCategory:', error)
    return { success: false, error: 'Failed to create material category' }
  }
}

// ==========================================
// MATERIAL ACTIONS
// ==========================================

export async function getMaterials(filters: {
  category_id?: string
  is_active?: boolean
  search?: string
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('materials')
      .select(`
        *,
        category:material_categories(name)
      `)
      .order('name', { ascending: true })

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,material_code.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching materials:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getMaterials:', error)
    return { success: false, error: 'Failed to fetch materials' }
  }
}

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
    const supabase = createClient()
    
    const { data: material, error } = await supabase
      .from('materials')
      .insert(data)
      .select(`
        *,
        category:material_categories(name)
      `)
      .single()

    if (error) {
      console.error('Error creating material:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/materials')
    return { success: true, data: material }
  } catch (error) {
    console.error('Error in createMaterial:', error)
    return { success: false, error: 'Failed to create material' }
  }
}

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
    const supabase = createClient()
    
    const { data: material, error } = await supabase
      .from('materials')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        category:material_categories(name)
      `)
      .single()

    if (error) {
      console.error('Error updating material:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/materials')
    return { success: true, data: material }
  } catch (error) {
    console.error('Error in updateMaterial:', error)
    return { success: false, error: 'Failed to update material' }
  }
}

// ==========================================
// MATERIAL INVENTORY ACTIONS
// ==========================================

export async function getMaterialInventory(site_id: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('material_inventory')
      .select(`
        *,
        material:materials(
          id,
          name,
          unit,
          material_code,
          category:material_categories(name)
        )
      `)
      .eq('site_id', site_id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching material inventory:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getMaterialInventory:', error)
    return { success: false, error: 'Failed to fetch material inventory' }
  }
}

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
    const supabase = createClient()
    
    // Check if inventory record exists
    const { data: existing } = await supabase
      .from('material_inventory')
      .select('id')
      .eq('site_id', site_id)
      .eq('material_id', material_id)
      .single()

    let result
    if (existing) {
      // Update existing record
      result = await supabase
        .from('material_inventory')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Create new record
      result = await supabase
        .from('material_inventory')
        .insert({
          site_id,
          material_id,
          ...data
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating material stock:', result.error)
      return { success: false, error: result.error.message }
    }

    revalidatePath('/dashboard/materials')
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error in updateMaterialStock:', error)
    return { success: false, error: 'Failed to update material stock' }
  }
}

// ==========================================
// MATERIAL REQUEST ACTIONS
// ==========================================

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
    const supabase = createClient()
    
    // Create the request
    const { data: request, error: requestError } = await supabase
      .from('material_requests')
      .insert({
        site_id: data.site_id,
        requested_by: data.requested_by,
        required_date: data.required_date,
        priority: data.priority,
        notes: data.notes,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating material request:', requestError)
      return { success: false, error: requestError.message }
    }

    // Create request items
    const items = data.items.map(item => ({
      request_id: request.id,
      ...item
    }))

    const { error: itemsError } = await supabase
      .from('material_request_items')
      .insert(items)

    if (itemsError) {
      console.error('Error creating request items:', itemsError)
      // Try to rollback the request
      await supabase.from('material_requests').delete().eq('id', request.id)
      return { success: false, error: itemsError.message }
    }

    revalidatePath('/dashboard/materials')
    return { success: true, data: request }
  } catch (error) {
    console.error('Error in createMaterialRequest:', error)
    return { success: false, error: 'Failed to create material request' }
  }
}

export async function getMaterialRequests(filters: {
  site_id?: string
  status?: string
  priority?: string
  requested_by?: string
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('material_requests')
      .select(`
        *,
        site:sites(name),
        requester:profiles!material_requests_requested_by_fkey(full_name),
        items:material_request_items(
          *,
          material:materials(name, unit, material_code)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    if (filters.requested_by) {
      query = query.eq('requested_by', filters.requested_by)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching material requests:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getMaterialRequests:', error)
    return { success: false, error: 'Failed to fetch material requests' }
  }
}

export async function updateMaterialRequestStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'ordered' | 'delivered',
  notes?: string
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved' || status === 'rejected') {
      updateData.approved_by = user?.id
      updateData.approved_at = new Date().toISOString()
      if (notes) updateData.approval_notes = notes
    }

    const { data, error } = await supabase
      .from('material_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating material request status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/materials')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateMaterialRequestStatus:', error)
    return { success: false, error: 'Failed to update request status' }
  }
}

// ==========================================
// MATERIAL TRANSACTION ACTIONS
// ==========================================

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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('material_transactions')
      .insert({
        ...data,
        performed_by: user?.id
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating material transaction:', transactionError)
      return { success: false, error: transactionError.message }
    }

    // Update inventory
    const { data: inventory } = await supabase
      .from('material_inventory')
      .select('current_stock')
      .eq('site_id', data.site_id)
      .eq('material_id', data.material_id)
      .single()

    let newStock = 0
    if (inventory) {
      newStock = inventory.current_stock
      if (data.transaction_type === 'in') {
        newStock += data.quantity
      } else if (['out', 'waste'].includes(data.transaction_type)) {
        newStock -= data.quantity
      } else if (data.transaction_type === 'adjustment') {
        newStock = data.quantity
      }
    } else if (data.transaction_type === 'in') {
      newStock = data.quantity
    }

    await updateMaterialStock(data.site_id, data.material_id, {
      current_stock: newStock
    })

    revalidatePath('/dashboard/materials')
    return { success: true, data: transaction }
  } catch (error) {
    console.error('Error in createMaterialTransaction:', error)
    return { success: false, error: 'Failed to create material transaction' }
  }
}

export async function getMaterialTransactions(filters: {
  site_id?: string
  material_id?: string
  transaction_type?: string
  date_from?: string
  date_to?: string
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('material_transactions')
      .select(`
        *,
        material:materials(name, unit, material_code),
        site:sites(name),
        performer:profiles!material_transactions_performed_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })

    if (filters.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters.material_id) {
      query = query.eq('material_id', filters.material_id)
    }
    if (filters.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching material transactions:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getMaterialTransactions:', error)
    return { success: false, error: 'Failed to fetch material transactions' }
  }
}