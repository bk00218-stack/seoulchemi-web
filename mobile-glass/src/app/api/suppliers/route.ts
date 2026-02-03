import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/suppliers - 매입처 목록
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    
    const where: any = {}
    
    if (!includeInactive) {
      where.isActive = true
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { contactName: { contains: search } },
      ]
    }
    
    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { purchases: true } }
      },
      orderBy: { name: 'asc' },
    })
    
    // 통계
    const totalCount = await prisma.supplier.count()
    const activeCount = await prisma.supplier.count({ where: { isActive: true } })
    
    // 총 매입금액 계산
    const totalPurchaseAmount = await prisma.purchase.aggregate({
      where: { status: 'completed' },
      _sum: { totalAmount: true }
    })
    
    return NextResponse.json({
      suppliers: suppliers.map(s => ({
        id: s.id,
        name: s.name,
        code: s.code,
        contactName: s.contactName,
        phone: s.phone,
        email: s.email,
        address: s.address,
        bankInfo: s.bankInfo,
        memo: s.memo,
        isActive: s.isActive,
        purchaseCount: s._count.purchases,
        createdAt: s.createdAt.toISOString().split('T')[0],
      })),
      stats: {
        totalCount,
        activeCount,
        totalPurchaseAmount: totalPurchaseAmount._sum.totalAmount || 0,
      }
    })
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
    return NextResponse.json({ error: '매입처 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/suppliers - 매입처 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, code, contactName, phone, email, address, bankInfo, memo } = body
    
    if (!name || !code) {
      return NextResponse.json({ error: '매입처명과 코드는 필수입니다' }, { status: 400 })
    }
    
    // 코드 중복 체크
    const existing = await prisma.supplier.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: '이미 사용중인 코드입니다' }, { status: 400 })
    }
    
    const supplier = await prisma.supplier.create({
      data: { name, code, contactName, phone, email, address, bankInfo, memo }
    })
    
    return NextResponse.json({ success: true, supplier })
  } catch (error) {
    console.error('Failed to create supplier:', error)
    return NextResponse.json({ error: '매입처 등록에 실패했습니다.' }, { status: 500 })
  }
}
