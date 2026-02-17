import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stats/sales - 가맹점별 매출 통계
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const groupId = searchParams.get('groupId')
    const salesStaffId = searchParams.get('salesStaffId')
    
    // 기본: 오늘
    const startDate = dateFrom ? new Date(dateFrom) : new Date(new Date().setHours(0, 0, 0, 0))
    const endDate = dateTo ? new Date(dateTo + 'T23:59:59') : new Date(new Date().setHours(23, 59, 59, 999))
    
    // 가맹점 필터
    const storeWhere: any = { status: 'active' }
    if (groupId) storeWhere.groupId = parseInt(groupId)
    if (salesStaffId) storeWhere.salesStaffId = parseInt(salesStaffId)
    
    // 가맹점 목록 조회
    const stores = await prisma.store.findMany({
      where: storeWhere,
      include: {
        group: { select: { name: true } },
        salesStaff: { select: { name: true } },
      },
      orderBy: { name: 'asc' }
    })
    
    // 각 가맹점의 기간 내 거래 합계
    const storeIds = stores.map(s => s.id)
    
    const transactions = await prisma.transaction.groupBy({
      by: ['storeId', 'type'],
      where: {
        storeId: { in: storeIds },
        processedAt: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })
    
    // 기간 시작 전 마지막 잔액 (전전액)
    const prevBalances = await Promise.all(
      storeIds.map(async (storeId) => {
        const lastTx = await prisma.transaction.findFirst({
          where: { storeId, processedAt: { lt: startDate } },
          orderBy: { processedAt: 'desc' },
          select: { balanceAfter: true }
        })
        return { storeId, prevBalance: lastTx?.balanceAfter || 0 }
      })
    )
    
    const prevBalanceMap = new Map(prevBalances.map(p => [p.storeId, p.prevBalance]))
    
    // 거래 데이터 매핑
    const txMap = new Map<number, { sale: number; deposit: number; return: number; adjustment: number }>()
    
    for (const tx of transactions) {
      if (!txMap.has(tx.storeId)) {
        txMap.set(tx.storeId, { sale: 0, deposit: 0, return: 0, adjustment: 0 })
      }
      const data = txMap.get(tx.storeId)!
      if (tx.type === 'sale') data.sale = tx._sum.amount || 0
      else if (tx.type === 'deposit') data.deposit = tx._sum.amount || 0
      else if (tx.type === 'return') data.return = tx._sum.amount || 0
      else if (tx.type === 'adjustment') data.adjustment = tx._sum.amount || 0
    }
    
    // 결과 생성
    const results = stores.map(store => {
      const tx = txMap.get(store.id) || { sale: 0, deposit: 0, return: 0, adjustment: 0 }
      const prevBalance = prevBalanceMap.get(store.id) || 0
      const totalOutstanding = store.outstandingAmount || 0
      const netSales = tx.sale - tx.return - tx.adjustment
      
      return {
        storeId: store.id,
        storeName: store.name,
        storeCode: store.code,
        groupName: store.group?.name || '-',
        region: store.address?.split(' ')[0] || '-', // 주소에서 첫 단어 (시/도)
        salesStaffName: store.salesStaff?.name || '-',
        status: store.status,
        prevBalance, // 전전액
        saleAmount: tx.sale, // 주문금액
        returnAmount: tx.return, // 반품금액
        depositAmount: tx.deposit, // 입금액
        discountAmount: tx.adjustment, // 할인금액
        totalOutstanding, // 총미수
        netSales, // 실매출액
      }
    })
    
    // 총합계
    const summary = {
      prevBalance: results.reduce((s, r) => s + r.prevBalance, 0),
      saleAmount: results.reduce((s, r) => s + r.saleAmount, 0),
      returnAmount: results.reduce((s, r) => s + r.returnAmount, 0),
      depositAmount: results.reduce((s, r) => s + r.depositAmount, 0),
      discountAmount: results.reduce((s, r) => s + r.discountAmount, 0),
      totalOutstanding: results.reduce((s, r) => s + r.totalOutstanding, 0),
      netSales: results.reduce((s, r) => s + r.netSales, 0),
    }
    
    return NextResponse.json({ stores: results, summary })
  } catch (error) {
    console.error('Failed to fetch sales stats:', error)
    return NextResponse.json({ error: '매출 통계를 불러오는데 실패했습니다.', stores: [], summary: {} }, { status: 500 })
  }
}
