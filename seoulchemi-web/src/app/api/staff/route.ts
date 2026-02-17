import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/staff - 직원 목록 (영업사원)
export async function GET() {
  try {
    const staff = await prisma.salesStaff.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ 
      staff: staff.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        areaCode: s.areaCode
      }))
    })
  } catch (error) {
    console.error('Failed to fetch staff:', error)
    return NextResponse.json({ error: '직원 목록을 불러오는데 실패했습니다.', staff: [] }, { status: 500 })
  }
}
