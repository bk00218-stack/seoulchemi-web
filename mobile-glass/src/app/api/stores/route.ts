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
    
    // 개별 필터
    const nameFilter = searchParams.get('name')
    const ownerNameFilter = searchParams.get('ownerName')
    const phoneFilter = searchParams.get('phone')
    const addressFilter = searchParams.get('address')
    const salesRepFilter = searchParams.get('salesRepName')
    const deliveryFilter = searchParams.get('deliveryContact')
    const groupNameFilter = searchParams.get('groupName')
    
    const where: any = {}
    
    // 상태 필터
    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }
    
    // 그룹 필터 (ID)
    if (groupId) {
      where.groupId = parseInt(groupId)
    }
    
    // 개별 필드 검색
    if (nameFilter) {
      where.name = { contains: nameFilter }
    }
    if (ownerNameFilter) {
      where.ownerName = { contains: ownerNameFilter }
    }
    if (phoneFilter) {
      where.phone = { contains: phoneFilter }
    }
    if (addressFilter) {
      where.address = { contains: addressFilter }
    }
    if (salesRepFilter) {
      where.salesRepName = { contains: salesRepFilter }
    }
    if (deliveryFilter) {
      where.OR = [
        { deliveryContact: { contains: deliveryFilter } },
        { deliveryStaff: { name: { contains: deliveryFilter } } }
      ]
    }
    if (groupNameFilter) {
      where.group = { name: { contains: groupNameFilter } }
    }
    
    // 일반 검색 (기존 호환)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { phone: { contains: search } },
        { ownerName: { contains: search } },
        { businessRegNo: { contains: search } },
      ]
    }
    
    // 이번 달 기준
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // 병렬로 쿼리 실행 (성능 최적화)
    const [
      total,
      stores,
      totalStores,
      activeStores,
      newThisMonth,
    ] = await Promise.all([
      // 필터된 개수
      prisma.store.count({ where }),
      
      // 목록 조회 (최소한의 include만)
      prisma.store.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          ownerName: true,
          phone: true,
          address: true,
          isActive: true,
          salesRepName: true,
          deliveryContact: true,
          deliveryPhone: true,
          paymentTermDays: true,
          billingDay: true,
          groupId: true,
          outstandingAmount: true,
          createdAt: true,
          group: { select: { id: true, name: true } },
          deliveryStaff: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      
      // 전체 가맹점 수
      prisma.store.count(),
      
      // 활성 가맹점 수
      prisma.store.count({ where: { isActive: true } }),
      
      // 이번 달 신규
      prisma.store.count({ where: { createdAt: { gte: monthStart } } }),
    ])

    // 미수금 관련 통계는 별도 (필요시에만)
    const outstandingStoresCount = 0
    const totalOutstanding = 0
    const totalDepositsThisMonth = 0
    
    return NextResponse.json({
      stores: stores.map(store => ({
        id: store.id,
        code: store.code,
        name: store.name,
        ownerName: store.ownerName || '-',
        phone: store.phone || '-',
        deliveryPhone: store.deliveryPhone || null,
        deliveryContact: store.deliveryContact || null,
        salesRepName: store.salesRepName || null,
        outstandingAmount: store.outstandingAmount || 0,
        address: store.address || null,
        paymentTermDays: store.paymentTermDays || 30,
        billingDay: store.billingDay || null,
        isActive: store.isActive,
        groupId: store.groupId,
        groupName: store.group?.name || null,
        deliveryStaffName: store.deliveryStaff?.name || null,
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
