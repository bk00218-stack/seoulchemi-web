import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// POST /api/products/bulk-price - 가격 일괄 수정
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserName(request)
    const { productIds, priceType, method, value } = await request.json()

    if (!productIds || productIds.length === 0) {
      return NextResponse.json({ error: '상품을 선택해주세요.' }, { status: 400 })
    }
    if (!priceType || !['purchasePrice', 'sellingPrice', 'retailPrice'].includes(priceType)) {
      return NextResponse.json({ error: '가격 유형을 선택해주세요.' }, { status: 400 })
    }
    if (!method || !['set', 'percent', 'add'].includes(method)) {
      return NextResponse.json({ error: '수정 방법을 선택해주세요.' }, { status: 400 })
    }
    if (value === undefined || value === null) {
      return NextResponse.json({ error: '값을 입력해주세요.' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      if (method === 'set') {
        // 고정값 설정
        const updated = await tx.product.updateMany({
          where: { id: { in: productIds } },
          data: { [priceType]: Math.round(value) },
        })
        return updated.count
      }

      // percent/add: 개별 업데이트 필요
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, [priceType]: true },
      })

      let count = 0
      for (const p of products) {
        const currentPrice = (p as Record<string, number>)[priceType] || 0
        let newPrice: number

        if (method === 'percent') {
          newPrice = Math.round(currentPrice * (1 + value / 100))
        } else {
          // add
          newPrice = Math.round(currentPrice + value)
        }

        await tx.product.update({
          where: { id: p.id },
          data: { [priceType]: Math.max(0, newPrice) },
        })
        count++
      }

      await tx.workLog.create({
        data: {
          workType: 'product_bulk_price',
          targetType: 'product',
          targetId: 0,
          description: `가격 일괄수정: ${count}개 (${priceType}, ${method}, ${value})`,
          details: JSON.stringify({ productIds, priceType, method, value, count }),
          userName: currentUser,
          pcName: 'WEB',
        }
      })

      return count
    }, { timeout: 15000 })

    const priceLabel = { purchasePrice: '매입가', sellingPrice: '도매가', retailPrice: '소매가' }[priceType]
    const methodLabel = { set: '설정', percent: '%조정', add: '가감' }[method]

    return NextResponse.json({
      success: true,
      message: `${result}개 상품 ${priceLabel} ${methodLabel} 완료`,
      count: result,
    })
  } catch (error: any) {
    console.error('Bulk price update failed:', error)
    return NextResponse.json({ error: error?.message || '가격 수정에 실패했습니다.' }, { status: 500 })
  }
}
