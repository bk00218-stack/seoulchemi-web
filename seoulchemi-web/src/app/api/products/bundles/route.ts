// 묶음상품 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 묶음상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const bundles = await prisma.bundleProduct.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            // productId로 상품 조회
          }
        }
      }
    })

    // 상품 정보 추가
    const productIds = bundles.flatMap(b => b.items.map(i => i.productId))
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { brand: true }
    })
    const productMap = new Map(products.map(p => [p.id, p]))

    const bundlesWithProducts = bundles.map(bundle => ({
      ...bundle,
      items: bundle.items.map(item => ({
        ...item,
        product: productMap.get(item.productId)
      })),
      totalPrice: bundle.items.reduce((sum, item) => {
        const product = productMap.get(item.productId)
        return sum + (product?.sellingPrice || 0) * item.quantity
      }, 0)
    }))

    return NextResponse.json({ bundles: bundlesWithProducts })
  } catch (error) {
    console.error('Failed to fetch bundles:', error)
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 })
  }
}

// 묶음상품 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, discountRate, discountAmount, items } = body

    if (!name || !items || items.length === 0) {
      return NextResponse.json({ error: '묶음상품명과 구성상품은 필수입니다' }, { status: 400 })
    }

    const bundle = await prisma.bundleProduct.create({
      data: {
        name,
        description,
        discountRate: discountRate || 0,
        discountAmount: discountAmount || 0,
        items: {
          create: items.map((item: { productId: number; quantity: number }) => ({
            productId: item.productId,
            quantity: item.quantity || 1
          }))
        }
      },
      include: {
        items: true
      }
    })

    return NextResponse.json(bundle, { status: 201 })
  } catch (error) {
    console.error('Failed to create bundle:', error)
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 })
  }
}
