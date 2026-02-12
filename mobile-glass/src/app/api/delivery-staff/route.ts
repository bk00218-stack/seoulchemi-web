import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/delivery-staff - 배송담당자 목록 조회
export async function GET() {
  try {
    const deliveryStaff = await prisma.deliveryStaff.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { stores: true }
        }
      }
    })
    
    return NextResponse.json({
      deliveryStaff: deliveryStaff.map(staff => ({
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        areaCode: staff.areaCode,
        isActive: staff.isActive,
        storeCount: staff._count.stores,
        createdAt: staff.createdAt.toISOString(),
      }))
    })
  } catch (error) {
    console.error('Failed to fetch delivery staff:', error)
    return NextResponse.json({ error: '배송담당자 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/delivery-staff - 배송담당자 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, areaCode } = body
    
    if (!name) {
      return NextResponse.json({ error: '담당자명은 필수입니다.' }, { status: 400 })
    }
    
    const deliveryStaff = await prisma.deliveryStaff.create({
      data: {
        name,
        phone,
        areaCode,
      }
    })
    
    return NextResponse.json({ success: true, deliveryStaff })
  } catch (error) {
    console.error('Failed to create delivery staff:', error)
    return NextResponse.json({ error: '배송담당자 등록에 실패했습니다.' }, { status: 500 })
  }
}
