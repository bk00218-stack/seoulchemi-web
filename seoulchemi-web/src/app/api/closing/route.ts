// 월마감/결산 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

// 월별 결산 데이터 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // 매출 데이터
    const salesOrders = await prisma.order.findMany({
      where: {
        orderedAt: { gte: startDate, lte: endDate },
        status: { not: 'cancelled' }
      },
      include: {
        store: { select: { name: true, code: true } },
        items: true
      }
    })

    const salesSummary = {
      totalOrders: salesOrders.length,
      totalAmount: salesOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      totalItems: salesOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
      byStatus: {
        pending: salesOrders.filter(o => o.status === 'pending').length,
        confirmed: salesOrders.filter(o => o.status === 'confirmed').length,
        shipped: salesOrders.filter(o => o.status === 'shipped').length,
        delivered: salesOrders.filter(o => o.status === 'delivered').length,
      },
      byType: {
        stock: salesOrders.filter(o => o.orderType === 'stock').reduce((sum, o) => sum + o.totalAmount, 0),
        rx: salesOrders.filter(o => o.orderType === 'rx').reduce((sum, o) => sum + o.totalAmount, 0),
      }
    }

    // 매입 데이터
    const purchases = await prisma.purchase.findMany({
      where: {
        purchasedAt: { gte: startDate, lte: endDate },
        status: { not: 'cancelled' }
      },
      include: {
        supplier: { select: { name: true, code: true } }
      }
    })

    const purchaseSummary = {
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
      byStatus: {
        pending: purchases.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.totalAmount, 0),
        completed: purchases.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.totalAmount, 0),
      }
    }

    // 입금 데이터 (미수금 회수)
    const deposits = await prisma.transaction.findMany({
      where: {
        processedAt: { gte: startDate, lte: endDate },
        type: 'deposit'
      }
    })

    const depositSummary = {
      totalDeposits: deposits.length,
      totalAmount: deposits.reduce((sum, d) => sum + d.amount, 0),
      byMethod: {
        cash: deposits.filter(d => d.paymentMethod === 'cash').reduce((sum, d) => sum + d.amount, 0),
        card: deposits.filter(d => d.paymentMethod === 'card').reduce((sum, d) => sum + d.amount, 0),
        transfer: deposits.filter(d => d.paymentMethod === 'transfer').reduce((sum, d) => sum + d.amount, 0),
      }
    }

    // 반품 데이터
    const returns = await prisma.return.findMany({
      where: {
        requestedAt: { gte: startDate, lte: endDate }
      }
    })

    const returnSummary = {
      totalReturns: returns.length,
      totalAmount: returns.reduce((sum, r) => sum + r.totalAmount, 0),
      byStatus: {
        requested: returns.filter(r => r.status === 'requested').length,
        approved: returns.filter(r => r.status === 'approved').length,
        received: returns.filter(r => r.status === 'received').length,
        rejected: returns.filter(r => r.status === 'rejected').length,
      }
    }

    // 재고 현황 (현재 기준)
    const inventoryStats = await prisma.productOption.aggregate({
      _sum: { stock: true },
      _count: { id: true }
    })

    const lowStockCount = await prisma.productOption.count({
      where: { stock: { lte: 5 }, isActive: true }
    })

    const outOfStockCount = await prisma.productOption.count({
      where: { stock: 0, isActive: true }
    })

    // 미수금 현황
    const receivables = await prisma.store.aggregate({
      _sum: { outstandingAmount: true }
    })

    // 미납금 현황
    const payables = await prisma.supplier.aggregate({
      _sum: { outstandingAmount: true }
    })

    // 손익 계산
    const grossProfit = salesSummary.totalAmount - purchaseSummary.totalAmount
    const netProfit = grossProfit - returnSummary.totalAmount

    // 일별 추이
    const dailySales: { date: string; orders: number; amount: number }[] = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d)
      const dayEnd = new Date(d)
      dayEnd.setHours(23, 59, 59)

      const dayOrders = salesOrders.filter(o => {
        const orderDate = new Date(o.orderedAt)
        return orderDate >= dayStart && orderDate <= dayEnd
      })

      dailySales.push({
        date: d.toISOString().slice(0, 10),
        orders: dayOrders.length,
        amount: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      })
    }

    // 마감 상태 확인
    const closingRecord = await prisma.setting.findUnique({
      where: { key: `closing_${year}_${month}` }
    })

    const isClosed = closingRecord ? JSON.parse(closingRecord.value).closed : false

    return NextResponse.json({
      period: { year, month, startDate, endDate },
      sales: salesSummary,
      purchases: purchaseSummary,
      deposits: depositSummary,
      returns: returnSummary,
      inventory: {
        totalOptions: inventoryStats._count.id,
        totalStock: inventoryStats._sum.stock || 0,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount
      },
      receivables: receivables._sum.outstandingAmount || 0,
      payables: payables._sum.outstandingAmount || 0,
      profit: {
        gross: grossProfit,
        net: netProfit,
        margin: salesSummary.totalAmount > 0 
          ? Math.round((grossProfit / salesSummary.totalAmount) * 100) 
          : 0
      },
      dailySales,
      isClosed
    })
  } catch (error) {
    console.error('Failed to fetch closing data:', error)
    return NextResponse.json({ error: 'Failed to fetch closing data' }, { status: 500 })
  }
}

// 월마감 처리
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserName(request)
    const body = await request.json()
    const { year, month, action } = body // action: 'close' | 'reopen'

    const key = `closing_${year}_${month}`

    if (action === 'close') {
      // 마감 처리
      await prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: JSON.stringify({
            closed: true,
            closedAt: new Date().toISOString(),
            closedBy: currentUser,
          }),
          description: `${year}년 ${month}월 마감`
        },
        update: {
          value: JSON.stringify({
            closed: true,
            closedAt: new Date().toISOString(),
            closedBy: currentUser
          })
        }
      })

      // 작업 로그
      await prisma.workLog.create({
        data: {
          workType: 'closing',
          targetType: 'closing',
          description: `${year}년 ${month}월 마감 처리`,
          details: JSON.stringify({ year, month })
        }
      })

      return NextResponse.json({ message: `${year}년 ${month}월 마감 완료` })
    } else if (action === 'reopen') {
      // 마감 취소
      await prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: JSON.stringify({ closed: false }),
          description: `${year}년 ${month}월 마감`
        },
        update: {
          value: JSON.stringify({ closed: false })
        }
      })

      return NextResponse.json({ message: `${year}년 ${month}월 마감 취소` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to process closing:', error)
    return NextResponse.json({ error: 'Failed to process closing' }, { status: 500 })
  }
}
