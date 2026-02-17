import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    const body = await request.json()

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: body.name,
        optionType: body.optionType,
        productType: body.productType || body.optionType,
        bundleName: body.bundleName || null,
        refractiveIndex: body.refractiveIndex || null,
        sellingPrice: body.sellingPrice || 0,
        purchasePrice: body.purchasePrice || 0,
        isActive: body.isActive ?? true,
        displayOrder: body.displayOrder,
        erpCode: body.erpCode ?? undefined,
        imageUrl: body.imageUrl ?? undefined,
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    await prisma.product.delete({
      where: { id: productId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
