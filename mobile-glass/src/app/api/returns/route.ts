import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/returns - 반품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type') // return, exchange
    const storeId = searchParams.get('storeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (storeId) {
      where.storeId = parseInt(storeId)
    }

    if (startDate || endDate) {
      where.requestedAt = {}
      if (startDate) {
        where.requestedAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.requestedAt.lte = end
      }
    }

    const total = await prisma.return.count({ where })

    const returns = await prisma.return.findMany({
      where,
      include: {
        items: true
      },
      orderBy: { requestedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // 상태별 통계
    const statusCounts = await prisma.return.groupBy({
      by: ['status'],
      _count: true,
      _sum: { totalAmount: true }
    })

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        requested: statusCounts.find(s => s.status === 'requested')?._count || 0,
        approved: statusCounts.find(s => s.status === 'approved')?._count || 0,
        received: statusCounts.find(s => s.status === 'received')?._count || 0,
        rejected: statusCounts.find(s => s.status === 'rejected')?._count || 0,
        totalAmount: statusCounts.reduce((sum, s) => sum + (s._sum.totalAmount || 0), 0)
      }
    })
  } catch (error) {
    console.error('Failed to fetch returns:', error)
    return NextResponse.json({ error: '반품 목록 조회에 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/returns - 반품 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, type, reason, items, processedBy } = body

    if (!orderId || !items || items.length === 0) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    // 주문 확인
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 반품번호 생성
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const count = await prisma.return.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      }
    })
    const returnNo = `RTN-${dateStr}-${String(count + 1).padStart(3, '0')}`

    // 반품 아이템 데이터 준비
    const returnItems = items.map((item: any) => {
      const orderItem = order.items.find(oi => oi.id === item.orderItemId)
      return {
        orderItemId: item.orderItemId,
        productId: orderItem?.productId || 0,
        productName: orderItem?.productName || '',
        optionName: item.optionName || `${orderItem?.sph || ''} ${orderItem?.cyl || ''}`.trim(),
        quantity: item.quantity,
        unitPrice: orderItem?.unitPrice || 0,
        totalPrice: (orderItem?.unitPrice || 0) * item.quantity,
        reason: item.reason,
        condition: item.condition || 'good'
      }
    })

    const totalQuantity = returnItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
    const totalAmount = returnItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0)

    // 반품 생성
    const newReturn = await prisma.return.create({
      data: {
        returnNo,
        orderId,
        orderNo: order.orderNo,
        storeId: order.storeId,
        storeName: order.storeName,
        status: 'requested',
        type: type || 'return',
        totalQuantity,
        totalAmount,
        reason,
        processedBy,
        items: {
          create: returnItems
        }
      },
      include: {
        items: true
      }
    })

    // 작업 로그 기록
    await prisma.workLog.create({
      data: {
        workType: 'return_create',
        targetType: 'return',
        targetId: newReturn.id,
        targetNo: returnNo,
        description: `${type === 'exchange' ? '교환' : '반품'} 요청: ${order.storeName} - ${totalQuantity}개`,
        userName: processedBy
      }
    })

    return NextResponse.json({
      success: true,
      return: newReturn
    })
  } catch (error) {
    console.error('Failed to create return:', error)
    return NextResponse.json({ error: '반품 등록에 실패했습니다.' }, { status: 500 })
  }
}
