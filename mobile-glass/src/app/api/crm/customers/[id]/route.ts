import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/crm/customers/[id] - 고객 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        prescriptions: {
          orderBy: { measuredAt: 'desc' },
          take: 10,
        },
        purchases: {
          orderBy: { saleDate: 'desc' },
          take: 10,
          include: {
            items: true,
          },
        },
        reminders: {
          where: { status: 'pending' },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: '고객 정보를 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// PUT /api/crm/customers/[id] - 고객 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    // 고객 존재 확인
    const existing = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 전화번호 변경 시 중복 확인
    if (body.phone && body.phone !== existing.phone) {
      const duplicate = await prisma.customer.findFirst({
        where: {
          storeId: existing.storeId,
          phone: body.phone,
          id: { not: id },
        },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: '이미 등록된 전화번호입니다' },
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        phone: body.phone?.trim(),
        phone2: body.phone2?.trim() || null,
        email: body.email?.trim() || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        gender: body.gender,
        zipcode: body.zipcode,
        address: body.address,
        addressDetail: body.addressDetail,
        memo: body.memo,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
        smsAgree: body.smsAgree,
        emailAgree: body.emailAgree,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: '고객 정보 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

// DELETE /api/crm/customers/[id] - 고객 삭제 (비활성화)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, id: customer.id })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: '고객 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
