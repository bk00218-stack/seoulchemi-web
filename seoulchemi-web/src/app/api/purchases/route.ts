import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/purchases - 매입 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const supplierId = searchParams.get('supplierId')
    
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (supplierId) {
      where.supplierId = parseInt(supplierId)
    }
    
    if (search) {
      where.OR = [
        { purchaseNo: { contains: search } },
        { supplier: { name: { contains: search } } },
      ]
    }
    
    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: true,
      },
      orderBy: { purchasedAt: 'desc' },
      take: 100,
    })
    
    // 상품 정보 가져오기
    const productIds = purchases.flatMap(p => p.items.map(i => i.productId))
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    })
    const productMap = new Map(products.map(p => [p.id, p]))
    
    // 통계
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const monthlyCount = await prisma.purchase.count({
      where: { purchasedAt: { gte: thisMonth } }
    })
    
    const pendingCount = await prisma.purchase.count({
      where: { status: 'pending' }
    })
    
    const totalAmount = await prisma.purchase.aggregate({
      _sum: { totalAmount: true }
    })
    
    const supplierCount = await prisma.supplier.count({ where: { isActive: true } })
    
    // 매입처 목록
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    })
    
    return NextResponse.json({
      purchases: purchases.map(purchase => {
        const firstItem = purchase.items[0]
        const product = firstItem ? productMap.get(firstItem.productId) : null
        return {
          id: purchase.id,
          purchaseNo: purchase.purchaseNo,
          date: purchase.purchasedAt.toISOString().split('T')[0],
          supplier: purchase.supplier.name,
          supplierId: purchase.supplier.id,
          brand: product?.brand.name || '-',
          product: product?.name || '-',
          quantity: purchase.items.reduce((sum, item) => sum + item.quantity, 0),
          unitPrice: firstItem?.unitPrice || 0,
          totalAmount: purchase.totalAmount,
          status: purchase.status,
        }
      }),
      suppliers,
      stats: {
        monthlyCount,
        pendingCount,
        totalAmount: Math.round((totalAmount._sum.totalAmount || 0) / 10000), // 만원 단위
        supplierCount,
      },
    })
  } catch (error) {
    console.error('Failed to fetch purchases:', error)
    return NextResponse.json({ error: '매입 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/purchases - 매입 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { supplierId, items, memo } = body
    
    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json({ error: '매입처와 상품을 선택해주세요' }, { status: 400 })
    }
    
    // 매입번호 생성
    const today = new Date()
    const prefix = `PUR-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`
    const lastPurchase = await prisma.purchase.findFirst({
      where: { purchaseNo: { startsWith: prefix } },
      orderBy: { purchaseNo: 'desc' }
    })
    
    let seq = 1
    if (lastPurchase) {
      const lastSeq = parseInt(lastPurchase.purchaseNo.split('-').pop() || '0')
      seq = lastSeq + 1
    }
    const purchaseNo = `${prefix}-${String(seq).padStart(4, '0')}`
    
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
    
    const purchase = await prisma.purchase.create({
      data: {
        purchaseNo,
        supplierId,
        totalAmount,
        memo,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          }))
        }
      }
    })
    
    return NextResponse.json({ success: true, purchase })
  } catch (error) {
    console.error('Failed to create purchase:', error)
    return NextResponse.json({ error: '매입 등록에 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/purchases - 상태 변경
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { purchaseIds, status } = body
    
    if (!purchaseIds || !Array.isArray(purchaseIds) || purchaseIds.length === 0) {
      return NextResponse.json({ error: '매입을 선택해주세요' }, { status: 400 })
    }
    
    const updateData: any = { status }
    if (status === 'completed') {
      updateData.receivedAt = new Date()
    }
    
    await prisma.purchase.updateMany({
      where: { id: { in: purchaseIds } },
      data: updateData,
    })
    
    return NextResponse.json({ success: true, updatedCount: purchaseIds.length })
  } catch (error) {
    console.error('Failed to update purchases:', error)
    return NextResponse.json({ error: '상태 변경에 실패했습니다.' }, { status: 500 })
  }
}
