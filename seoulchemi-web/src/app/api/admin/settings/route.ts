import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: 설정 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const group = searchParams.get('group') // 'main', 'product-detail', 'general' 등

    const where: Record<string, unknown> = {}
    if (group) {
      where.key = { startsWith: `${group}.` }
    }

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' }
    })

    // key-value 맵으로 변환
    const settingsMap: Record<string, string> = {}
    for (const s of settings) {
      settingsMap[s.key] = s.value
    }

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: '설정 조회 실패' }, { status: 500 })
  }
}

// POST: 설정 저장 (bulk upsert)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { settings } = body // { key: value, ... }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: '설정 데이터가 필요합니다' }, { status: 400 })
    }

    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: '설정 저장 실패' }, { status: 500 })
  }
}
