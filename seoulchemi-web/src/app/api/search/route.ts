import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase() || ''
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!q || q.length < 2) {
      return NextResponse.json({ products: [], stores: [], orders: [] })
    }

    // 병렬로 검색
    const [products, stores, orders] = await Promise.all([
      // 상품 검색
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { bundleName: { contains: q, mode: 'insensitive' } },
            { erpCode: { contains: q, mode: 'insensitive' } },
          ]
        },
        include: { brand: true },
        take: limit
      }),
      
      // 거래처 검색
      prisma.store.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { ownerName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ]
        },
        take: limit
      }),
      
      // 주문 검색
      prisma.order.findMany({
        where: {
          OR: [
            { orderNo: { contains: q, mode: 'insensitive' } },
            { store: { name: { contains: q, mode: 'insensitive' } } },
          ]
        },
        include: { store: true },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ])

    return NextResponse.json({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand.name,
        type: 'product',
        url: `/admin/products?highlight=${p.id}`
      })),
      stores: stores.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        type: 'store',
        url: `/stores/${s.id}`
      })),
      orders: orders.map(o => ({
        id: o.id,
        orderNo: o.orderNo,
        storeName: o.store.name,
        status: o.status,
        type: 'order',
        url: `/orders?highlight=${o.id}`
      }))
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
