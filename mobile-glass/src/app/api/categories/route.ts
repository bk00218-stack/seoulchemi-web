import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    const categories = await prisma.category.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: 'asc' }, { displayOrder: 'asc' }]
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const category = await prisma.category.create({
      data: {
        type: body.type,
        code: body.code,
        name: body.name,
        description: body.description,
        displayOrder: body.displayOrder || 0,
        isActive: body.isActive ?? true
      }
    })
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
