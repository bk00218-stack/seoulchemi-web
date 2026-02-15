import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const orderType = searchParams.get('orderType')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // 필터 조건
    const where: Record<string, unknown> = {}
    
    if (storeId) {
      where.storeId = parseInt(storeId)
    }
    
    if (orderType) {
      where.orderType = orderType
    }
    
    if (status) {
      where.status = status
    }

    // 주문 목록 조회
    const orders = await prisma.order.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            address: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                brand: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        orderedAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    // 총 개수
    const total = await prisma.order.count({ where })

    return NextResponse.json({
      orders,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
