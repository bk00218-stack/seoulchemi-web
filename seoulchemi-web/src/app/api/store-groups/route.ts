import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const groups = await prisma.storeGroup.findMany({
      include: {
        _count: { select: { stores: true } },
        brandDiscounts: true
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(groups.map(g => ({
      ...g,
      storeCount: g._count.stores
    })))
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const group = await prisma.storeGroup.create({
      data: {
        name: body.name,
        description: body.description,
        discountRate: body.discountRate || 0,
        storeType: body.storeType || 'normal',
        isActive: body.isActive ?? true
      }
    })
    return NextResponse.json(group)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
