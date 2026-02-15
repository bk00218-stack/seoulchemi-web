// 매입 관리 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 매입 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // pending, completed, cancelled
    const supplierId = searchParams.get('supplierId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (search) {
      where.OR = [
        { purchaseNo: { contains: search } },
        { supplier: { name: { contains: search } } },
        { supplier: { code: { contains: search } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId)
    }

    if (startDate || endDate) {
      where.purchasedAt = {}
      if (startDate) where.purchasedAt.gte = new Date(startDate)
      if (endDate) where.purchasedAt.lte = new Date(endDate + 'T23:59:59')
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        orderBy: { purchasedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          supplier: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { items: true }
          }
        }
      }),
      prisma.purchase.count({ where })
    ])

    // 통계
    const stats = await prisma.purchase.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: { id: true }
    })

    return NextResponse.json({
      purchases,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalPurchases: stats._count.id,
        totalAmount: stats._sum.totalAmount || 0
      }
    })
  } catch (error) {
    console.error('Failed to fetch purchases:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

// 매입 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { supplierId, items, memo, purchasedAt } = body

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json({ error: '매입처와 상품 정보는 필수입니다' }, { status: 400 })
    }

    // 매입번호 생성 (PO-YYYYMMDD-XXX)
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const lastPurchase = await prisma.purchase.findFirst({
      where: {
        purchaseNo: { startsWith: `PO-${dateStr}` }
      },
      orderBy: { purchaseNo: 'desc' }
    })

    let seq = 1
    if (lastPurchase) {
      const lastSeq = parseInt(lastPurchase.purchaseNo.split('-')[2])
      seq = lastSeq + 1
    }
    const purchaseNo = `PO-${dateStr}-${seq.toString().padStart(3, '0')}`

    // 총액 계산
    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.unitPrice * item.quantity), 0)

    // 트랜잭션으로 매입 생성
    const purchase = await prisma.$transaction(async (tx) => {
      // 매입 생성
      const newPurchase = await tx.purchase.create({
        data: {
          purchaseNo,
          supplierId,
          totalAmount,
          memo,
          purchasedAt: purchasedAt ? new Date(purchasedAt) : new Date(),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
            }))
          }
        },
        include: {
          supplier: true,
          items: true
        }
      })

      // 매입처 미납금 증가
      await tx.supplier.update({
        where: { id: supplierId },
        data: {
          outstandingAmount: { increment: totalAmount }
        }
      })

      // 작업 로그
      await tx.workLog.create({
        data: {
          workType: 'purchase_create',
          targetType: 'purchase',
          targetId: newPurchase.id,
          targetNo: purchaseNo,
          description: `매입 등록 - ${newPurchase.supplier.name}`,
          details: JSON.stringify({ totalAmount, itemCount: items.length })
        }
      })

      return newPurchase
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Failed to create purchase:', error)
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}
