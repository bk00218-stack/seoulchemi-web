import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bundles = await prisma.bundleProduct.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(bundles)
  } catch (error) {
    console.error('Error fetching bundles:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const bundle = await prisma.bundleProduct.create({
      data: {
        name: body.name,
        description: body.description,
        discountRate: body.discountRate || 0,
        discountAmount: body.discountAmount || 0,
        isActive: body.isActive ?? true
      }
    })
    return NextResponse.json(bundle)
  } catch (error) {
    console.error('Error creating bundle:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
