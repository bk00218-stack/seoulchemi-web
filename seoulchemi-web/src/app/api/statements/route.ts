// 거래명세서 API - 가맹점별 월별 거래 내역 조회
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

    if (!storeId) {
      return NextResponse.json({ error: '가맹점을 선택해주세요.' }, { status: 400 })
    }

    // 기간 설정
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // 가맹점 정보
    const store = await prisma.store.findUnique({
      where: { id: parseInt(storeId) },
      select: {
        id: true,
        code: true,
        name: true,
        ownerName: true,
        businessRegNo: true,
        phone: true,
        address: true,
        email: true,
      }
    })

    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 해당 기간의 주문 내역 (취소 제외)
    const orders = await prisma.order.findMany({
      where: {
        storeId: parseInt(storeId),
        orderedAt: { gte: startDate, lte: endDate },
        status: { notIn: ['cancelled'] },
      },
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      },
      orderBy: { orderedAt: 'asc' },
    })

    // 주문 데이터 가공
    const orderItems = orders.flatMap(order =>
      order.items.map(item => ({
        date: order.orderedAt.toISOString(),
        orderNo: order.orderNo,
        orderType: order.orderType,
        brandName: item.product?.brand?.name || '',
        productName: item.product?.name || `상품 #${item.productId}`,
        sph: item.sph || '',
        cyl: item.cyl || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }))
    )

    // 해당 기간의 입금 내역
    const deposits = await prisma.transaction.findMany({
      where: {
        storeId: parseInt(storeId),
        type: 'deposit',
        processedAt: { gte: startDate, lte: endDate },
      },
      orderBy: { processedAt: 'asc' },
    })

    const depositItems = deposits.map(d => ({
      date: d.processedAt.toISOString(),
      amount: d.amount,
      paymentMethod: d.paymentMethod || 'transfer',
      depositor: d.depositor || '',
      memo: d.memo || '',
    }))

    // 요약
    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0)

    // 전월 이월 (기간 시작 전 잔액) - store의 현재 미수금에서 역산
    // 간단하게: 현재 미수금 + 이번달 입금 - 이번달 매출 = 전월 이월
    const currentStore = await prisma.store.findUnique({
      where: { id: parseInt(storeId) },
      select: { outstandingAmount: true }
    })
    const currentOutstanding = currentStore?.outstandingAmount || 0
    const carriedForward = currentOutstanding + totalDeposits - totalSales

    return NextResponse.json({
      store,
      period: { year, month },
      orders: orderItems,
      deposits: depositItems,
      summary: {
        carriedForward: Math.max(0, carriedForward),
        totalSales,
        totalDeposits,
        balance: currentOutstanding,
        orderCount: orders.length,
        itemCount: orderItems.length,
      }
    })
  } catch (error) {
    console.error('Failed to generate statement:', error)
    return NextResponse.json({ error: '거래명세서 데이터 생성에 실패했습니다.' }, { status: 500 })
  }
}
