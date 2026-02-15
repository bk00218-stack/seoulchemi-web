import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { put, del } from '@vercel/blob'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Get current product to delete old image if exists
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { imageUrl: true }
    })

    // Delete old image from Vercel Blob if exists
    if (currentProduct?.imageUrl && currentProduct.imageUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(currentProduct.imageUrl)
      } catch (e) {
        console.log('Failed to delete old image:', e)
      }
    }

    // Generate filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `products/${productId}-${Date.now()}.${ext}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    })

    // Update database with blob URL
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: blob.url }
    })

    return NextResponse.json({ imageUrl: blob.url })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    // Get current image URL
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { imageUrl: true }
    })

    // Delete from Vercel Blob if exists
    if (product?.imageUrl && product.imageUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(product.imageUrl)
      } catch (e) {
        console.log('Failed to delete image from blob:', e)
      }
    }

    // Update database
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
