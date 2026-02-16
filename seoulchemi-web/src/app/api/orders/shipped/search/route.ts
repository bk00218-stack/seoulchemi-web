import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/shipped/search - 출고 내역 검색
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const brandId = searchParams.get('brandId')
    const productId = searchParams.get('productId')
    const sph = searchParams.get('sph')
    const cyl = searchParams.get('cyl')
    const store = searchParams.get('store')

    // 기본 where 조건: 출고된 주문만
    const where: any = {
      status: 'shipped'
    }

    // 날짜 필터
    if (dateFrom || dateTo) {
      where.shippedAt = {}
      if (dateFrom) {
        where.shippedAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.shippedAt.lte = endDate
      }
    }

    // 가맹점 필터 (상호 또는 전화번호)
    if (store) {
      const storeQuery = store.replace(/-/g, '')
      where.store = {
        OR: [
          { name: { contains: store, mode: 'insensitive' } },
          { phone: { contains: storeQuery } }
        ]
      }
    }

    // 아이템 조건 (브랜드ID, 상품ID, SPH, CYL)
    const itemsWhere: any = {}
    let hasItemFilter = false

    if (brandId) {
      itemsWhere.product = {
        ...itemsWhere.product,
        brandId: parseInt(brandId)
      }
      hasItemFilter = true
    }

    if (productId) {
      itemsWhere.productId = parseInt(productId)
      hasItemFilter = true
    }

    if (sph) {
      itemsWhere.sph = { contains: sph }
      hasItemFilter = true
    }

    if (cyl) {
      itemsWhere.cyl = { contains: cyl }
      hasItemFilter = true
    }

    if (hasItemFilter) {
      where.items = { some: itemsWhere }
    }

    // 주문 조회
    const orders = await prisma.order.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, code: true, phone: true }
        },
        items: {
          where: hasItemFilter ? itemsWhere : undefined,
          include: {
            product: {
              include: {
                brand: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
      orderBy: { shippedAt: 'desc' },
      take: 500 // 최대 500건
    })

    // 결과 플랫화 (아이템 단위로)
    const results = orders.flatMap(order => 
      order.items
        .filter(item => {
          // 아이템 필터 다시 적용
          if (brandId && item.product.brandId !== parseInt(brandId)) return false
          if (productId && item.productId !== parseInt(productId)) return false
          if (sph && item.sph && !item.sph.includes(sph)) return false
          if (cyl && item.cyl && !item.cyl.includes(cyl)) return false
          return true
        })
        .map(item => ({
          id: order.id,
          orderNo: order.orderNo,
          storeName: order.store.name,
          storeCode: order.store.code,
          storePhone: order.store.phone,
          brandName: item.product.brand.name,
          productName: item.product.name,
          sph: item.sph,
          cyl: item.cyl,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          shippedAt: order.shippedAt
        }))
    )

    return NextResponse.json({
      results,
      totalCount: results.length
    })

  } catch (error: any) {
    console.error('Failed to search shipped orders:', error)
    return NextResponse.json({
      error: '출고 내역 검색에 실패했습니다.',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
