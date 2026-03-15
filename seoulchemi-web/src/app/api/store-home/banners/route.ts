import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'

// POST: 배너 이미지 업로드
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: '이미지를 선택해주세요' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다' }, { status: 400 })
    }

    // 4MB 제한
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 4MB 이하만 가능합니다' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `store-banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
    })

    return NextResponse.json({ imageUrl: blob.url })
  } catch (error) {
    console.error('Banner image upload failed:', error)
    return NextResponse.json({ error: '이미지 업로드에 실패했습니다' }, { status: 500 })
  }
}

// DELETE: 배너 이미지 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (imageUrl && imageUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(imageUrl)
      } catch (e) {
        console.log('Failed to delete banner image from blob:', e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Banner image delete failed:', error)
    return NextResponse.json({ error: '이미지 삭제에 실패했습니다' }, { status: 500 })
  }
}
