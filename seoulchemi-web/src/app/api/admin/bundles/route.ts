import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: 묶음상품 목록
export async function GET() {
  try {
    const bundles = await prisma.bundleProduct.findMany({
      include: {
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ bundles })
  } catch (error) {
    console.error('Bundles GET error:', error)
    return NextResponse.json({ error: '묶음상품 목록 조회 실패' }, { status: 500 })
  }
}

// POST: 묶음상품 등록
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, discountRate, discountAmount, items } = body

    if (!name) {
      return NextResponse.json({ error: '묶음상품명은 필수입니다' }, { status: 400 })
    }

    const bundle = await prisma.bundleProduct.create({
      data: {
        name,
        description: description || null,
        discountRate: discountRate || 0,
        discountAmount: discountAmount || 0,
        isActive: true,
        items: items?.length > 0 ? {
          create: items.map((item: { productId: number; quantity: number }) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
          }))
        } : undefined,
      },
      include: {
        items: { include: { product: { include: { brand: true } } } }
      }
    })

    return NextResponse.json({ success: true, bundle })
  } catch (error) {
    console.error('Bundles POST error:', error)
    return NextResponse.json({ error: '묶음상품 등록 실패' }, { status: 500 })
  }
}
