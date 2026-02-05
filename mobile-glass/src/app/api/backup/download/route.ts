import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: '파일명이 필요합니다.' }, { status: 400 })
    }

    // 경로 검증 (보안)
    if (filename.includes('..') || !filename.endsWith('.json')) {
      return NextResponse.json({ error: '잘못된 파일명입니다.' }, { status: 400 })
    }

    const filepath = path.join(BACKUP_DIR, filename)
    const content = await fs.readFile(filepath, 'utf-8')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Failed to download backup:', error)
    return NextResponse.json({ error: '다운로드에 실패했습니다.' }, { status: 500 })
  }
}
