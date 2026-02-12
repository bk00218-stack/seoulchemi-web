import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stores - 가맹점 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const groupId = searchParams.get('groupId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const where: any = {}
    
    // 상태 필터
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }
    
    // 그룹 필터
    if (groupId) {
      where.groupId = parseInt(groupId)
    }
    
    // 검색
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { phone: { contains: search } },
        { ownerName: { contains: search } },
        { businessRegNo: { contains: search } },
      ]
    }
    
    // 전체 개수
    const total = await prisma.store.count({ where })
    
    // 목록 조회 (최근 주문일 포함)
    const stores = await prisma.store.findMany({
      where,
      include: {
        orders: {
          orderBy: { orderedAt: 'desc' },
          take: 1,
          select: { orderedAt: true }
        },
        group: { select: { id: true, name: true } },
        deliveryStaff: { select: { id: true, name: true } },
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    })
    
    // 통계
    const totalStores = await prisma.store.count()
    const activeStores = await prisma.store.count({ where: { isActive: true } })
    
    // 이번 달 신규 (createdAt 기준)
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const newThisMonth = await prisma.store.count({
      where: { createdAt: { gte: monthStart } }
    })
    
    // 미결제 가맹점 수 (outstandingAmount > 0)
    const outstandingStoresCount = await prisma.store.count({
      where: { outstandingAmount: { gt: 0 } }
    })
    
    // 총 미결제액 (outstandingAmount 합계)
    const outstandingSum = await prisma.store.aggregate({
      _sum: { outstandingAmount: true }
    })
    const totalOutstanding = outstandingSum._sum.outstandingAmount || 0
    
    // 이번 달 입금 (Transaction 테이블에서 deposit 타입 합계)
    const depositsThisMonth = await prisma.transaction.aggregate({
      where: {
        type: 'deposit',
        processedAt: { gte: monthStart }
      },
      _sum: { amount: true }
    })
    const totalDepositsThisMonth = depositsThisMonth._sum.amount || 0
    
    return NextResponse.json({
      stores: stores.map(store => ({
        id: store.id,
        code: store.code,
        name: store.name,
        ownerName: store.ownerName || '-',
        phone: store.phone || '-',
        mobile: store.deliveryPhone || null,
        deliveryPhone: store.deliveryPhone || null,
        deliveryContact: store.deliveryContact || null,
        salesRepName: store.salesRepName || null,
        outstandingAmount: store.outstandingAmount || 0,
        address: store.address || null,
        paymentTermDays: store.paymentTermDays || 30,
        billingDay: store.billingDay || null,
        isActive: store.isActive,
        // 신규 필드
        businessType: store.businessType,
        businessCategory: store.businessCategory,
        businessRegNo: store.businessRegNo,
        email: store.email,
        memo: store.memo,
        status: store.status,
        groupId: store.groupId,
        groupName: store.group?.name || null,
        deliveryStaffId: store.deliveryStaffId,
        deliveryStaffName: store.deliveryStaff?.name || null,
        orderCount: store._count.orders,
        lastOrderDate: store.orders[0]?.orderedAt?.toISOString().split('T')[0] || null,
        createdAt: store.createdAt.toISOString().split('T')[0],
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalStores,
        active: activeStores,
        inactive: totalStores - activeStores,
        newThisMonth,
        outstandingStoresCount,
        totalOutstanding,
        totalDepositsThisMonth,
      },
    })
  } catch (error) {
    console.error('Failed to fetch stores:', error)
    return NextResponse.json({ error: '가맹점 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/stores - 가맹점 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      code, 
      name, 
      ownerName, 
      phone, 
      mobile,
      address, 
      deliveryContact,
      deliveryPhone,
      deliveryAddress,
      salesRepName,
      paymentTermDays, 
      discountRate,
      areaCode,
      storeType,
      isActive = true,
      // 신규 필드
      businessType,
      businessCategory,
      businessRegNo,
      groupId,
      email,
      memo,
      status,
      deliveryStaffId,
      outstandingAmount,
      billingDay,
    } = body
    
    if (!name) {
      return NextResponse.json({ error: '안경원명은 필수입니다.' }, { status: 400 })
    }
    
    // 코드 자동생성 (없으면)
    let storeCode = code
    if (!storeCode) {
      const lastStore = await prisma.store.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true }
      })
      storeCode = String((lastStore?.id || 0) + 10000)
    }
    
    // 코드 중복 체크
    const existing = await prisma.store.findUnique({ where: { code: storeCode } })
    if (existing) {
      return NextResponse.json({ error: '이미 존재하는 코드입니다.' }, { status: 400 })
    }
    
    const store = await prisma.store.create({
      data: {
        code: storeCode,
        name,
        ownerName,
        phone,
        address,
        deliveryContact,
        deliveryPhone: deliveryPhone || mobile,
        deliveryAddress,
        salesRepName,
        paymentTermDays: paymentTermDays ? parseInt(String(paymentTermDays)) : 30,
        billingDay: billingDay ? parseInt(String(billingDay)) : null,
        discountRate: discountRate ? parseFloat(String(discountRate)) : 0,
        areaCode,
        storeType,
        isActive,
        // 신규 필드
        businessType,
        businessCategory,
        businessRegNo,
        groupId: groupId ? parseInt(String(groupId)) : null,
        email,
        memo,
        status: status || 'active',
        deliveryStaffId: deliveryStaffId ? parseInt(String(deliveryStaffId)) : null,
        outstandingAmount: outstandingAmount ? parseInt(String(outstandingAmount)) : 0,
      },
    })
    
    return NextResponse.json({ success: true, store })
  } catch (error) {
    console.error('Failed to create store:', error)
    return NextResponse.json({ error: '가맹점 등록에 실패했습니다.' }, { status: 500 })
  }
}
