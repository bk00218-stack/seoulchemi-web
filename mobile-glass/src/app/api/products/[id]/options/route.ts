import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    const options = await prisma.productOption.findMany({
      where: { productId },
      orderBy: [
        { sph: 'asc' },
        { cyl: 'asc' }
      ]
    })

    return NextResponse.json({ 
      options: options.map(o => ({
        id: o.id,
        sph: o.sph || '0.00',
        cyl: o.cyl || '0.00',
        axis: o.axis,
        optionName: o.optionName,
        memo: o.memo,
        barcode: o.barcode,
        stock: o.stock,
        status: o.isActive ? '주문가능' : '품절',
        stockLocation: o.location,
        priceAdjustment: o.priceAdjustment || 0,
      }))
    })
  } catch (error) {
    console.error('Error fetching product options:', error)
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()

    const option = await prisma.productOption.create({
      data: {
        productId,
        sph: body.sph,
        cyl: body.cyl,
        axis: body.axis,
        optionName: body.optionName,
        memo: body.memo,
        barcode: body.barcode,
        stock: body.stock || 0,
        isActive: body.isActive ?? true,
        location: body.location,
        priceAdjustment: body.priceAdjustment || 0,
      }
    })

    return NextResponse.json({ option })
  } catch (error) {
    console.error('Error creating product option:', error)
    return NextResponse.json({ error: 'Failed to create option' }, { status: 500 })
  }
}
