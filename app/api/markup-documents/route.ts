import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MarkupDocument } from '@/types'

// GET /api/markup-documents - 마킹 도면 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 쿼리 파라미터
    const location = searchParams.get('location') || 'personal'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const site = searchParams.get('site')
    const offset = (page - 1) * limit
    
    // 기본 쿼리 생성
    let query = supabase
      .from('markup_documents')
      .select('*, created_by_profile:profiles!markup_documents_created_by_fkey(full_name)', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    
    // location 필터
    if (location === 'personal') {
      query = query.eq('created_by', user.id).eq('location', 'personal')
    } else if (location === 'shared') {
      query = query.eq('location', 'shared')
    }
    
    // 검색어 필터
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }
    
    // 현장 필터 (site 파라미터가 'all'이 아닌 경우에만 적용)
    if (site && site !== 'all') {
      query = query.eq('site_id', site)
    }
    
    // 페이지네이션
    query = query.range(offset, offset + limit - 1)
    
    const { data: documents, error, count } = await query
    
    if (error) {
      console.error('Error fetching markup documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }
    
    // 프로필 정보를 평면화
    const formattedDocuments = documents?.map((doc: any) => ({
      ...doc,
      created_by_name: doc.created_by_profile?.full_name || 'Unknown'
    })) || []
    
    const totalPages = Math.ceil((count || 0) / limit)
    
    return NextResponse.json({
      success: true,
      data: formattedDocuments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/markup-documents - 새 마킹 도면 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, site_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      original_blueprint_url,
      original_blueprint_filename,
      markup_data,
      location = 'personal',
      preview_image_url
    } = body

    // 필수 필드 검증
    if (!title || !original_blueprint_url || !original_blueprint_filename) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, original_blueprint_url, original_blueprint_filename' 
      }, { status: 400 })
    }

    // 마킹 개수 계산
    const markup_count = Array.isArray(markup_data) ? markup_data.length : 0

    // 문서 생성
    const { data: document, error } = await supabase
      .from('markup_documents' as any)
      .insert({
        title,
        description,
        original_blueprint_url,
        original_blueprint_filename,
        markup_data: markup_data || [],
        location,
        preview_image_url,
        created_by: user.id,
        site_id: (profile as any).site_id,
        markup_count,
        file_size: 0 // TODO: 실제 파일 크기 계산
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating markup document:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}