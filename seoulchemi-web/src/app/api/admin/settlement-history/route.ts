import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: 정산 이력 조회 (완료된 매입 기록)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: Record<string, unknown> = {
      status: 'completed',
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId)
    }

    if (from || to) {
      where.receivedAt = {}
      if (from) (where.receivedAt as Record<string, unknown>).gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setDate(toDate.getDate() + 1)
        ;(where.receivedAt as Record<string, unknown>).lt = toDate
      }
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    })

    // 매입처 목록
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    // 통계
    const totalAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0)

    return NextResponse.json({
      purchases,
      suppliers,
      stats: {
        count: purchases.length,
        totalAmount,
      }
    })
  } catch (error) {
    console.error('Settlement history GET error:', error)
    return NextResponse.json({ error: '정산 이력 조회 실패' }, { status: 500 })
  }
}
