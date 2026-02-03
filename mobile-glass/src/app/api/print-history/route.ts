import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 출력 이력 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const printType = searchParams.get('printType') || ''
    const printedBy = searchParams.get('printedBy') || ''
    
    const history = await prisma.printHistory.findMany({
      where: {
        ...(search && {
          OR: [
            { orderNo: { contains: search } },
            { storeName: { contains: search } }
          ]
        }),
        ...(printType && { printType }),
        ...(printedBy && { printedBy })
      },
      orderBy: { printedAt: 'desc' },
      take: 100
    })
    
    // 통계 계산
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    const [todayCount, weekCount, monthCount, totalPages] = await Promise.all([
      prisma.printHistory.count({ where: { printedAt: { gte: today } } }),
      prisma.printHistory.count({ where: { printedAt: { gte: weekAgo } } }),
      prisma.printHistory.count({ where: { printedAt: { gte: monthAgo } } }),
      prisma.printHistory.aggregate({ _sum: { pageCount: true } })
    ])
    
    return NextResponse.json({
      history,
      stats: {
        todayCount,
        weekCount,
        monthCount,
        totalPages: totalPages._sum.pageCount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching print history:', error)
    return NextResponse.json({ error: 'Failed to fetch print history' }, { status: 500 })
  }
}

// 출력 이력 기록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, orderNo, storeName, printType, printedBy, pageCount } = body
    
    const history = await prisma.printHistory.create({
      data: {
        orderId,
        orderNo,
        storeName,
        printType,
        printedBy: printedBy || '관리자',
        pageCount: pageCount || 1
      }
    })
    
    return NextResponse.json(history)
  } catch (error) {
    console.error('Error creating print history:', error)
    return NextResponse.json({ error: 'Failed to create print history' }, { status: 500 })
  }
}
