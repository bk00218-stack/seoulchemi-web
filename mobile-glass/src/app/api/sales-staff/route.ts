import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/sales-staff - 영업담당자 목록 조회
export async function GET() {
  try {
    const salesStaff = await prisma.salesStaff.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { stores: true }
        }
      }
    })
    
    return NextResponse.json({
      salesStaff: salesStaff.map(staff => ({
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
    console.error('Failed to fetch sales staff:', error)
    return NextResponse.json({ error: '영업담당자 목록을 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/sales-staff - 영업담당자 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, areaCode } = body
    
    if (!name) {
      return NextResponse.json({ error: '담당자명은 필수입니다.' }, { status: 400 })
    }
    
    const salesStaff = await prisma.salesStaff.create({
      data: {
        name,
        phone,
        areaCode,
      }
    })
    
    return NextResponse.json({ success: true, salesStaff })
  } catch (error) {
    console.error('Failed to create sales staff:', error)
    return NextResponse.json({ error: '영업담당자 등록에 실패했습니다.' }, { status: 500 })
  }
}
