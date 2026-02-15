import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/sales-staff/[id] - 영업담당자 상세 조회
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
    
    const salesStaff = await prisma.salesStaff.findUnique({
      where: { id: staffId },
      include: {
        stores: {
          select: { id: true, name: true, code: true }
        }
      }
    })
    
    if (!salesStaff) {
      return NextResponse.json({ error: '영업담당자를 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ salesStaff })
  } catch (error) {
    console.error('Failed to fetch sales staff:', error)
    return NextResponse.json({ error: '영업담당자 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PUT /api/sales-staff/[id] - 영업담당자 수정
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
    
    const salesStaff = await prisma.salesStaff.update({
      where: { id: staffId },
      data: {
        name,
        phone,
        areaCode,
        isActive: isActive !== undefined ? isActive : true,
      }
    })
    
    return NextResponse.json({ success: true, salesStaff })
  } catch (error) {
    console.error('Failed to update sales staff:', error)
    return NextResponse.json({ error: '영업담당자 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/sales-staff/[id] - 영업담당자 비활성화
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
    
    const salesStaff = await prisma.salesStaff.update({
      where: { id: staffId },
      data: { isActive: false }
    })
    
    return NextResponse.json({ success: true, message: '영업담당자가 비활성화되었습니다.', salesStaff })
  } catch (error) {
    console.error('Failed to deactivate sales staff:', error)
    return NextResponse.json({ error: '영업담당자 비활성화에 실패했습니다.' }, { status: 500 })
  }
}
