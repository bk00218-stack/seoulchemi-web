import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()
    const { options } = body // [{ sph, cyl }, ...]

    if (!options || !Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: 'No options provided' }, { status: 400 })
    }

    // 기존 옵션 조회 (중복 방지)
    const existingOptions = await prisma.productOption.findMany({
      where: { productId },
      select: { sph: true, cyl: true }
    })

    const existingSet = new Set(
      existingOptions.map(o => `${o.sph}|${o.cyl}`)
    )

    // 새로운 옵션만 필터링
    const newOptions = options.filter(
      (o: { sph: string; cyl: string; priceAdjustment?: number }) => !existingSet.has(`${o.sph}|${o.cyl}`)
    )

    if (newOptions.length === 0) {
      return NextResponse.json({ created: 0, message: '모든 옵션이 이미 존재합니다.' })
    }

    // 일괄 생성
    const result = await prisma.productOption.createMany({
      data: newOptions.map((o: { sph: string; cyl: string; priceAdjustment?: number }) => ({
        productId,
        sph: o.sph,
        cyl: o.cyl,
        stock: 0,
        isActive: true,
        priceAdjustment: o.priceAdjustment || 0,
      }))
    })

    return NextResponse.json({ 
      created: result.count,
      skipped: options.length - result.count,
      message: `${result.count}개의 옵션이 생성되었습니다.`
    })
  } catch (error) {
    console.error('Error bulk creating options:', error)
    return NextResponse.json({ error: 'Failed to create options' }, { status: 500 })
  }
}
