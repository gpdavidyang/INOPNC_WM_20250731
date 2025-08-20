#!/usr/bin/env node

/**
 * 실제 파일을 Supabase Storage에 업로드하고 문서 레코드 생성
 * 사용법: node scripts/upload-real-files.js [files-directory]
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 지원되는 파일 형식
const SUPPORTED_FORMATS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif']
const STORAGE_BUCKET = 'documents' // Supabase Storage 버킷 이름

async function uploadFilesToStorage(filesDir) {
  try {
    if (!fs.existsSync(filesDir)) {
      throw new Error(`디렉터리를 찾을 수 없습니다: ${filesDir}`)
    }

    console.log(`📁 파일 스캔 중: ${filesDir}`)
    const files = fs.readdirSync(filesDir).filter(file => {
      const ext = path.extname(file).toLowerCase()
      return SUPPORTED_FORMATS.includes(ext)
    })

    if (files.length === 0) {
      console.log('⚠️ 지원되는 파일이 없습니다.')
      return
    }

    console.log(`📄 ${files.length}개 파일 발견:`, files.join(', '))

    // 사용자 정보 조회
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('status', 'active')
      .limit(1)

    if (profilesError || !profiles || profiles.length === 0) {
      throw new Error('활성 사용자를 찾을 수 없습니다.')
    }

    const owner = profiles[0]
    console.log(`👤 업로드 사용자: ${owner.email}`)

    // Storage 버킷 확인/생성
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET)

    if (!bucketExists) {
      console.log('🗂️ Storage 버킷 생성 중...')
      const { error: bucketError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false
      })
      if (bucketError) {
        throw new Error(`버킷 생성 실패: ${bucketError.message}`)
      }
    }

    const uploadedDocs = []

    for (const fileName of files) {
      try {
        console.log(`⬆️ 업로드 중: ${fileName}`)
        
        const filePath = path.join(filesDir, fileName)
        const fileBuffer = fs.readFileSync(filePath)
        const fileStats = fs.statSync(filePath)
        const mimeType = mime.lookup(fileName) || 'application/octet-stream'

        // Supabase Storage에 업로드
        const storagePath = `personal/${owner.id}/${Date.now()}_${fileName}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, fileBuffer, {
            contentType: mimeType,
            cacheControl: '3600'
          })

        if (uploadError) {
          console.error(`❌ 업로드 실패 (${fileName}):`, uploadError.message)
          continue
        }

        // 공개 URL 생성
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(storagePath)

        // 문서 타입 결정
        const getDocumentType = (fileName, mimeType) => {
          const name = fileName.toLowerCase()
          if (name.includes('작업일지') || name.includes('report')) return 'report'
          if (name.includes('도면') || name.includes('blueprint')) return 'blueprint'
          if (name.includes('자격증') || name.includes('certificate') || name.includes('교육')) return 'certificate'
          if (mimeType.startsWith('image/')) return 'other'
          return 'personal'
        }

        // 데이터베이스에 문서 레코드 생성
        const documentRecord = {
          title: fileName,
          description: `업로드된 파일: ${fileName}`,
          file_url: urlData.publicUrl,
          file_name: fileName,
          file_size: fileStats.size,
          mime_type: mimeType,
          document_type: getDocumentType(fileName, mimeType),
          folder_path: `/uploads/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          owner_id: owner.id,
          is_public: false
        }

        const { data: docData, error: docError } = await supabase
          .from('documents')
          .insert(documentRecord)
          .select()
          .single()

        if (docError) {
          console.error(`❌ 문서 레코드 생성 실패 (${fileName}):`, docError.message)
          // 업로드된 파일 삭제
          await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
          continue
        }

        uploadedDocs.push({
          ...docData,
          originalPath: filePath
        })

        console.log(`✅ 업로드 완료: ${fileName} (${(fileStats.size / 1024 / 1024).toFixed(1)}MB)`)

      } catch (error) {
        console.error(`❌ 파일 처리 실패 (${fileName}):`, error.message)
      }
    }

    console.log('\n🎉 업로드 완료!')
    console.log(`📊 성공: ${uploadedDocs.length}/${files.length}`)
    
    if (uploadedDocs.length > 0) {
      console.log('\n📋 업로드된 문서들:')
      uploadedDocs.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.title}`)
        console.log(`     크기: ${(doc.file_size / 1024 / 1024).toFixed(1)}MB`)
        console.log(`     URL: ${doc.file_url}`)
        console.log('')
      })
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
if (require.main === module) {
  const filesDir = process.argv[2] || './sample-files'
  console.log('📁 실제 파일 업로드 시작...')
  uploadFilesToStorage(filesDir)
}

module.exports = { uploadFilesToStorage }