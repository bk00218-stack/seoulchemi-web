import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const { optionId } = await params
    const id = parseInt(optionId)

    const option = await prisma.productOption.findUnique({
      where: { id }
    })

    if (!option) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 })
    }

    return NextResponse.json({ option })
  } catch (error) {
    console.error('Error fetching option:', error)
    return NextResponse.json({ error: 'Failed to fetch option' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const { optionId } = await params
    const id = parseInt(optionId)
    const body = await request.json()

    const option = await prisma.productOption.update({
      where: { id },
      data: {
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
    console.error('Error updating option:', error)
    return NextResponse.json({ error: 'Failed to update option' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optionId: string }> }
) {
  try {
    const { optionId } = await params
    const id = parseInt(optionId)

    await prisma.productOption.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting option:', error)
    return NextResponse.json({ error: 'Failed to delete option' }, { status: 500 })
  }
}
