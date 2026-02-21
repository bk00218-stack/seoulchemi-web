import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: 재고 옵션 목록 (대량 재고 조정용)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { isActive: true }

    if (brandId) {
      where.product = { brandId: parseInt(brandId) }
    }

    if (search) {
      where.OR = [
        { product: { name: { contains: search } } },
        { sph: { contains: search } },
        { cyl: { contains: search } },
      ]
    }

    const options = await prisma.productOption.findMany({
      where,
      include: {
        product: {
          include: { brand: true }
        }
      },
      orderBy: [
        { product: { name: 'asc' } },
        { sph: 'asc' },
        { cyl: 'asc' },
      ],
      take: 200,
    })

    // 브랜드 목록
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ options, brands })
  } catch (error) {
    console.error('Stock GET error:', error)
    return NextResponse.json({ error: '재고 목록 조회 실패' }, { status: 500 })
  }
}

// POST: 대량 재고 조정
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { adjustments, reason } = body
    // adjustments: [{ optionId: number, newStock: number }]

    if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
      return NextResponse.json({ error: '조정 항목이 없습니다' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: '조정 사유를 입력해주세요' }, { status: 400 })
    }

    const results = []

    for (const adj of adjustments) {
      const option = await prisma.productOption.findUnique({
        where: { id: adj.optionId }
      })

      if (!option) continue

      const beforeStock = option.stock
      const afterStock = adj.newStock

      if (beforeStock === afterStock) continue

      // 재고 업데이트
      await prisma.productOption.update({
        where: { id: adj.optionId },
        data: { stock: afterStock }
      })

      // 재고 변동 기록
      await prisma.inventoryTransaction.create({
        data: {
          productId: option.productId,
          productOptionId: option.id,
          type: 'adjust',
          reason,
          quantity: afterStock - beforeStock,
          beforeStock,
          afterStock,
          memo: `대량 조정: ${reason}`,
        }
      })

      results.push({ optionId: adj.optionId, before: beforeStock, after: afterStock })
    }

    return NextResponse.json({ success: true, adjusted: results.length, results })
  } catch (error) {
    console.error('Stock POST error:', error)
    return NextResponse.json({ error: '재고 조정 실패' }, { status: 500 })
  }
}
