'use server'

import { createClient } from '@/lib/supabase/server'
import { Document, DocumentType, FileAttachment } from '@/types'
import { revalidatePath } from 'next/cache'

// ==========================================
// DOCUMENT ACTIONS
// ==========================================

export async function uploadDocument(formData: FormData) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const document_type = formData.get('document_type') as DocumentType
    const folder_path = formData.get('folder_path') as string
    const site_id = formData.get('site_id') as string
    const is_public = formData.get('is_public') === 'true'

    if (!file || !title) {
      return { success: false, error: 'File and title are required' }
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { success: false, error: 'Failed to upload file' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // Create document record
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        title,
        description,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        document_type,
        folder_path,
        owner_id: user.id,
        is_public,
        site_id
      })
      .select()
      .single()

    if (documentError) {
      console.error('Error creating document record:', documentError)
      // Try to delete uploaded file
      await supabase.storage.from('documents').remove([fileName])
      return { success: false, error: documentError.message }
    }

    revalidatePath('/dashboard/documents')
    return { success: true, data: document }
  } catch (error) {
    console.error('Error in uploadDocument:', error)
    return { success: false, error: 'Failed to upload document' }
  }
}

export async function uploadFileAttachment(formData: FormData) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const file = formData.get('file') as File
    const entity_type = formData.get('entity_type') as string
    const entity_id = formData.get('entity_id') as string

    if (!file || !entity_type || !entity_id) {
      return { success: false, error: 'Missing required fields' }
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `attachments/${entity_type}/${entity_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading attachment:', uploadError)
      return { success: false, error: 'Failed to upload attachment' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(fileName)

    // Create attachment record
    const { data: attachment, error: attachmentError } = await supabase
      .from('file_attachments')
      .insert({
        entity_type,
        entity_id,
        file_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (attachmentError) {
      console.error('Error creating attachment record:', attachmentError)
      // Try to delete uploaded file
      await supabase.storage.from('attachments').remove([fileName])
      return { success: false, error: attachmentError.message }
    }

    return { success: true, data: attachment }
  } catch (error) {
    console.error('Error in uploadFileAttachment:', error)
    return { success: false, error: 'Failed to upload attachment' }
  }
}

export async function getDocuments(filters: {
  document_type?: DocumentType
  folder_path?: string
  site_id?: string
  owner_id?: string
  is_public?: boolean
  search?: string
  limit?: number
  offset?: number
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('documents')
      .select(`
        *,
        owner:profiles!documents_owner_id_fkey(full_name, email),
        site:sites(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters.document_type) {
      query = query.eq('document_type', filters.document_type)
    }
    if (filters.folder_path) {
      query = query.eq('folder_path', filters.folder_path)
    }
    if (filters.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters.owner_id) {
      query = query.eq('owner_id', filters.owner_id)
    }
    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data, count }
  } catch (error) {
    console.error('Error in getDocuments:', error)
    return { success: false, error: 'Failed to fetch documents' }
  }
}

export async function getMyDocuments() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        site:sites(name)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching my documents:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getMyDocuments:', error)
    return { success: false, error: 'Failed to fetch documents' }
  }
}

export async function updateDocument(
  id: string,
  data: Partial<Document>
) {
  try {
    const supabase = createClient()
    
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating document:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/documents')
    return { success: true, data: document }
  } catch (error) {
    console.error('Error in updateDocument:', error)
    return { success: false, error: 'Failed to update document' }
  }
}

export async function deleteDocument(id: string) {
  try {
    const supabase = createClient()
    
    // Get document details first
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_url, owner_id')
      .eq('id', id)
      .single()

    if (fetchError || !document) {
      return { success: false, error: 'Document not found' }
    }

    // Check ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (document.owner_id !== user?.id) {
      return { success: false, error: 'Unauthorized to delete this document' }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // Try to delete from storage (extract file path from URL)
    try {
      const urlParts = document.file_url.split('/storage/v1/object/public/documents/')
      if (urlParts.length > 1) {
        await supabase.storage.from('documents').remove([urlParts[1]])
      }
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Don't fail the operation if storage deletion fails
    }

    revalidatePath('/dashboard/documents')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteDocument:', error)
    return { success: false, error: 'Failed to delete document' }
  }
}

export async function getFileAttachments(
  entity_type: string,
  entity_id: string
) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('file_attachments')
      .select(`
        *,
        uploader:profiles!file_attachments_uploaded_by_fkey(full_name)
      `)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching attachments:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error in getFileAttachments:', error)
    return { success: false, error: 'Failed to fetch attachments' }
  }
}

export async function deleteFileAttachment(id: string) {
  try {
    const supabase = createClient()
    
    // Get attachment details first
    const { data: attachment, error: fetchError } = await supabase
      .from('file_attachments')
      .select('file_path')
      .eq('id', id)
      .single()

    if (fetchError || !attachment) {
      return { success: false, error: 'Attachment not found' }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('file_attachments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting attachment:', deleteError)
      return { success: false, error: deleteError.message }
    }

    // Try to delete from storage
    try {
      const urlParts = attachment.file_path.split('/storage/v1/object/public/attachments/')
      if (urlParts.length > 1) {
        await supabase.storage.from('attachments').remove([urlParts[1]])
      }
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteFileAttachment:', error)
    return { success: false, error: 'Failed to delete attachment' }
  }
}

export async function logDocumentAccess(
  document_id: string,
  access_type: 'view' | 'download' | 'print' | 'edit'
) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('document_access_logs')
      .insert({
        document_id,
        accessed_by: user.id,
        access_type,
        ip_address: null, // Would need to get from request
        user_agent: null  // Would need to get from request
      })

    if (error) {
      console.error('Error logging document access:', error)
      // Don't fail the main operation
    }

    return { success: true }
  } catch (error) {
    console.error('Error in logDocumentAccess:', error)
    return { success: false, error: 'Failed to log access' }
  }
}