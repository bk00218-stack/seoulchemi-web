import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const shortcuts = await prisma.productShortcut.findMany({
      orderBy: { useCount: 'desc' }
    })
    
    // 상품 정보 조회
    const productIds = shortcuts.map(s => s.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    })
    const productMap = new Map(products.map(p => [p.id, p]))
    
    const result = shortcuts.map(s => {
      const product = productMap.get(s.productId)
      return {
        ...s,
        productName: product?.name || '(삭제됨)',
        brandName: product?.brand.name || '-'
      }
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const shortcut = await prisma.productShortcut.create({
      data: {
        shortcode: body.shortcode,
        productId: body.productId,
        description: body.description,
        isActive: body.isActive ?? true
      }
    })
    return NextResponse.json(shortcut)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
