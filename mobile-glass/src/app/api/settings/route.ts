import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/settings - 설정 조회
export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    
    // key-value 형태로 변환
    const settingsMap: Record<string, string> = {}
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value
    }
    
    return NextResponse.json({
      settings: settingsMap,
      // 구조화된 형태로도 제공
      company: {
        name: settingsMap['company.name'] || '',
        bizNo: settingsMap['company.bizNo'] || '',
        owner: settingsMap['company.owner'] || '',
        phone: settingsMap['company.phone'] || '',
        email: settingsMap['company.email'] || '',
        address: settingsMap['company.address'] || '',
      },
      order: {
        prefix: settingsMap['order.prefix'] || 'ORD',
        autoConfirmDays: parseInt(settingsMap['order.autoConfirmDays'] || '3'),
        minAmount: parseInt(settingsMap['order.minAmount'] || '0'),
      },
      notification: {
        push: settingsMap['notification.push'] === 'true',
        email: settingsMap['notification.email'] === 'true',
      },
    })
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ error: '설정을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PUT /api/settings - 설정 저장
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { settings } = body
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: '설정 데이터가 필요합니다' }, { status: 400 })
    }
    
    // 각 설정 업데이트
    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 })
  }
}
