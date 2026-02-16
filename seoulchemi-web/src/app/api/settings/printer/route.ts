import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/settings/printer - 프린터 설정 조회
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'printer' }
    })

    if (!setting) {
      return NextResponse.json({
        shippingSlipEnabled: true,
        shippingSlipForm: 'default',
        shippingSlipPrinter: '',
        invoiceEnabled: true,
        invoiceForm: 'default',
        invoicePrinter: '',
        autoPrintOnOrder: true,
      })
    }

    return NextResponse.json(JSON.parse(setting.value))
  } catch (error: any) {
    console.error('Failed to get printer settings:', error)
    return NextResponse.json({
      shippingSlipEnabled: true,
      shippingSlipForm: 'default',
      shippingSlipPrinter: '',
      invoiceEnabled: true,
      invoiceForm: 'default',
      invoicePrinter: '',
      autoPrintOnOrder: true,
    })
  }
}

// POST /api/settings/printer - 프린터 설정 저장
export async function POST(request: Request) {
  try {
    const body = await request.json()

    await prisma.setting.upsert({
      where: { key: 'printer' },
      update: { value: JSON.stringify(body) },
      create: { key: 'printer', value: JSON.stringify(body) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to save printer settings:', error)
    return NextResponse.json({ error: '설정 저장 실패' }, { status: 500 })
  }
}
