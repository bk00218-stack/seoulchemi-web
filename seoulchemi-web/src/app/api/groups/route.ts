import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/groups - 그룹 목록
export async function GET() {
  try {
    const groups = await prisma.storeGroup.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ 
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        discountRate: g.discountRate
      }))
    })
  } catch (error) {
    console.error('Failed to fetch groups:', error)
    return NextResponse.json({ error: '그룹 목록을 불러오는데 실패했습니다.', groups: [] }, { status: 500 })
  }
}
