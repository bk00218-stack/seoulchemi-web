import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stores/[id] - 거래처 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    
    if (isNaN(storeId)) {
      return NextResponse.json({ error: '잘못된 거래처 ID입니다.' }, { status: 400 })
    }
    
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        orders: {
          orderBy: { orderedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            orderNo: true,
            orderType: true,
            status: true,
            totalAmount: true,
            orderedAt: true,
            memo: true,
          }
        },
        transactions: {
          orderBy: { processedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            type: true,
            amount: true,
            balanceAfter: true,
            paymentMethod: true,
            memo: true,
            processedAt: true,
          }
        },
        brandDiscounts: {
          include: {
            brand: { select: { id: true, name: true } }
          }
        },
        productDiscounts: {
          include: {
            product: { select: { id: true, name: true } }
          }
        },
        group: { select: { id: true, name: true } },
        deliveryStaff: { select: { id: true, name: true, phone: true } },
        _count: {
          select: { orders: true, transactions: true }
        }
      }
    })
    
    if (!store) {
      return NextResponse.json({ error: '거래처를 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ store })
  } catch (error) {
    console.error('Failed to fetch store:', error)
    return NextResponse.json({ error: '거래처 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PUT/PATCH /api/stores/[id] - 거래처 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    
    if (isNaN(storeId)) {
      return NextResponse.json({ error: '잘못된 거래처 ID입니다.' }, { status: 400 })
    }
    
    const body = await request.json()
    const {
      name,
      code,
      ownerName,
      phone,
      address,
      deliveryContact,
      deliveryPhone,
      deliveryAddress,
      salesRepName,
      paymentTermDays,
      discountRate,
      areaCode,
      storeType,
      isActive,
      creditLimit,
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
    
    // 필수값 체크
    if (!name) {
      return NextResponse.json({ error: '거래처명은 필수입니다.' }, { status: 400 })
    }
    
    // 코드 중복 체크 (자신 제외)
    if (code) {
      const existing = await prisma.store.findFirst({
        where: {
          code,
          NOT: { id: storeId }
        }
      })
      if (existing) {
        return NextResponse.json({ error: '이미 존재하는 코드입니다.' }, { status: 400 })
      }
    }
    
    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        name,
        ...(code && { code }),
        ownerName,
        phone,
        address,
        deliveryContact,
        deliveryPhone,
        deliveryAddress,
        salesRepName,
        paymentTermDays: paymentTermDays !== undefined ? parseInt(String(paymentTermDays)) : undefined,
        billingDay: billingDay !== undefined ? (billingDay ? parseInt(String(billingDay)) : null) : undefined,
        discountRate: discountRate !== undefined ? parseFloat(String(discountRate)) : undefined,
        areaCode,
        storeType,
        isActive,
        creditLimit: creditLimit !== undefined ? parseInt(String(creditLimit)) : undefined,
        // 신규 필드
        businessType,
        businessCategory,
        businessRegNo,
        groupId: groupId !== undefined ? (groupId ? parseInt(String(groupId)) : null) : undefined,
        email,
        memo,
        status,
        deliveryStaffId: deliveryStaffId !== undefined ? (deliveryStaffId ? parseInt(String(deliveryStaffId)) : null) : undefined,
        outstandingAmount: outstandingAmount !== undefined ? parseInt(String(outstandingAmount)) : undefined,
      },
    })
    
    return NextResponse.json({ success: true, store })
  } catch (error) {
    console.error('Failed to update store:', error)
    return NextResponse.json({ error: '거래처 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/stores/[id] - 거래처 비활성화
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    
    if (isNaN(storeId)) {
      return NextResponse.json({ error: '잘못된 거래처 ID입니다.' }, { status: 400 })
    }
    
    // 실제 삭제 대신 비활성화
    const store = await prisma.store.update({
      where: { id: storeId },
      data: { isActive: false },
    })
    
    return NextResponse.json({ success: true, message: '거래처가 비활성화되었습니다.', store })
  } catch (error) {
    console.error('Failed to deactivate store:', error)
    return NextResponse.json({ error: '거래처 비활성화에 실패했습니다.' }, { status: 500 })
  }
}
