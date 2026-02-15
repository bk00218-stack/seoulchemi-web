// 매입처 상세 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 매입처 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplierId = parseInt(id)

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        purchases: {
          orderBy: { purchasedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { purchases: true }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: '매입처를 찾을 수 없습니다' }, { status: 404 })
    }

    // 매입 통계
    const purchaseStats = await prisma.purchase.aggregate({
      where: { supplierId },
      _sum: { totalAmount: true },
      _count: { id: true }
    })

    return NextResponse.json({
      ...supplier,
      stats: {
        totalPurchases: purchaseStats._count.id,
        totalAmount: purchaseStats._sum.totalAmount || 0
      }
    })
  } catch (error) {
    console.error('Failed to fetch supplier:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

// 매입처 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplierId = parseInt(id)
    const body = await request.json()

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: body
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Failed to update supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

// 매입처 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplierId = parseInt(id)

    // 매입 내역 확인
    const purchaseCount = await prisma.purchase.count({
      where: { supplierId }
    })

    if (purchaseCount > 0) {
      // 비활성화만
      await prisma.supplier.update({
        where: { id: supplierId },
        data: { isActive: false }
      })
      return NextResponse.json({ message: '매입 내역이 있어 비활성화 처리되었습니다' })
    }

    await prisma.supplier.delete({
      where: { id: supplierId }
    })

    return NextResponse.json({ message: '삭제되었습니다' })
  } catch (error) {
    console.error('Failed to delete supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
