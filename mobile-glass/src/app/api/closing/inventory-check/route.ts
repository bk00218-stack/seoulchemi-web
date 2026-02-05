// 재고 실사 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 실사 대상 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const productId = searchParams.get('productId')

    const where: any = { isActive: true }
    if (brandId) where.product = { brandId: parseInt(brandId) }
    if (productId) where.productId = parseInt(productId)

    const options = await prisma.productOption.findMany({
      where,
      orderBy: [
        { product: { brand: { name: 'asc' } } },
        { product: { name: 'asc' } },
        { sph: 'asc' },
        { cyl: 'asc' }
      ],
      include: {
        product: {
          include: { brand: true }
        }
      }
    })

    return NextResponse.json({ options })
  } catch (error) {
    console.error('Failed to fetch inventory check:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory check' }, { status: 500 })
  }
}

// 실사 결과 저장 (일괄)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, memo } = body
    // items: [{ optionId, actualStock }]

    if (!items || items.length === 0) {
      return NextResponse.json({ error: '실사 데이터가 없습니다' }, { status: 400 })
    }

    let adjusted = 0
    let unchanged = 0

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const option = await tx.productOption.findUnique({
          where: { id: item.optionId }
        })

        if (!option) continue

        const diff = item.actualStock - option.stock

        if (diff !== 0) {
          // 재고 이력 기록
          await tx.inventoryTransaction.create({
            data: {
              productId: option.productId,
              productOptionId: option.id,
              type: 'adjust',
              reason: 'adjust',
              quantity: diff,
              beforeStock: option.stock,
              afterStock: item.actualStock,
              memo: memo || '재고 실사 조정'
            }
          })

          // 재고 업데이트
          await tx.productOption.update({
            where: { id: item.optionId },
            data: { stock: item.actualStock }
          })

          adjusted++
        } else {
          unchanged++
        }
      }

      // 작업 로그
      await tx.workLog.create({
        data: {
          workType: 'inventory_check',
          targetType: 'inventory',
          description: `재고 실사 완료 - ${items.length}개 항목`,
          details: JSON.stringify({ adjusted, unchanged, total: items.length })
        }
      })
    })

    return NextResponse.json({
      message: '재고 실사 완료',
      results: {
        total: items.length,
        adjusted,
        unchanged
      }
    })
  } catch (error) {
    console.error('Failed to save inventory check:', error)
    return NextResponse.json({ error: 'Failed to save inventory check' }, { status: 500 })
  }
}
