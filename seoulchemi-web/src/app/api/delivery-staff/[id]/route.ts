import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/delivery-staff/[id] - 배송담당자 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const staffId = parseInt(id)
    
    if (isNaN(staffId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    
    const deliveryStaff = await prisma.deliveryStaff.findUnique({
      where: { id: staffId },
      include: {
        stores: {
          select: { id: true, name: true, code: true }
        }
      }
    })
    
    if (!deliveryStaff) {
      return NextResponse.json({ error: '배송담당자를 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ deliveryStaff })
  } catch (error) {
    console.error('Failed to fetch delivery staff:', error)
    return NextResponse.json({ error: '배송담당자 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PUT /api/delivery-staff/[id] - 배송담당자 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const staffId = parseInt(id)
    
    if (isNaN(staffId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    
    const body = await request.json()
    const { name, phone, areaCode, isActive } = body
    
    if (!name) {
      return NextResponse.json({ error: '담당자명은 필수입니다.' }, { status: 400 })
    }
    
    const deliveryStaff = await prisma.deliveryStaff.update({
      where: { id: staffId },
      data: {
        name,
        phone,
        areaCode,
        isActive: isActive !== undefined ? isActive : true,
      }
    })
    
    return NextResponse.json({ success: true, deliveryStaff })
  } catch (error) {
    console.error('Failed to update delivery staff:', error)
    return NextResponse.json({ error: '배송담당자 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/delivery-staff/[id] - 배송담당자 비활성화
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const staffId = parseInt(id)
    
    if (isNaN(staffId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    
    const deliveryStaff = await prisma.deliveryStaff.update({
      where: { id: staffId },
      data: { isActive: false }
    })
    
    return NextResponse.json({ success: true, message: '배송담당자가 비활성화되었습니다.', deliveryStaff })
  } catch (error) {
    console.error('Failed to deactivate delivery staff:', error)
    return NextResponse.json({ error: '배송담당자 비활성화에 실패했습니다.' }, { status: 500 })
  }
}
