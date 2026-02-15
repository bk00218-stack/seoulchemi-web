import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET: 거래처별 할인 설정 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    
    const [store, brandDiscounts, productDiscounts, productPrices, brands, products] = await Promise.all([
      prisma.store.findUnique({
        where: { id: storeId },
        select: { id: true, name: true, code: true, discountRate: true }
      }),
      prisma.storeBrandDiscount.findMany({
        where: { storeId },
        include: { brand: { select: { id: true, name: true } } }
      }),
      prisma.storeProductDiscount.findMany({
        where: { storeId },
        include: { product: { select: { id: true, name: true, brandId: true, sellingPrice: true } } }
      }),
      prisma.storeProductPrice.findMany({
        where: { storeId },
        include: { product: { select: { id: true, name: true, brandId: true, sellingPrice: true } } }
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' }
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, brandId: true, sellingPrice: true },
        orderBy: { name: 'asc' }
      })
    ])

    if (!store) {
      return NextResponse.json({ error: '거래처를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({
      store,
      brandDiscounts,
      productDiscounts,
      productPrices,
      brands,
      products
    })
  } catch (error) {
    console.error('Failed to fetch store discounts:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// PUT: 거래처 기본 할인율 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    const { discountRate } = await request.json()

    const store = await prisma.store.update({
      where: { id: storeId },
      data: { discountRate: discountRate || 0 }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Failed to update store discount:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// POST: 할인 설정 추가/수정
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    const { type, brandId, productId, discountRate, specialPrice } = await request.json()

    let result

    if (type === 'brand') {
      // 브랜드별 할인율
      result = await prisma.storeBrandDiscount.upsert({
        where: { storeId_brandId: { storeId, brandId } },
        update: { discountRate },
        create: { storeId, brandId, discountRate }
      })
    } else if (type === 'product_discount') {
      // 상품별 할인율
      result = await prisma.storeProductDiscount.upsert({
        where: { storeId_productId: { storeId, productId } },
        update: { discountRate },
        create: { storeId, productId, discountRate }
      })
    } else if (type === 'product_price') {
      // 상품별 특수단가
      result = await prisma.storeProductPrice.upsert({
        where: { storeId_productId: { storeId, productId } },
        update: { specialPrice },
        create: { storeId, productId, specialPrice }
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to save discount:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

// DELETE: 할인 설정 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const targetId = parseInt(searchParams.get('targetId') || '0')

    if (type === 'brand') {
      await prisma.storeBrandDiscount.delete({
        where: { storeId_brandId: { storeId, brandId: targetId } }
      })
    } else if (type === 'product_discount') {
      await prisma.storeProductDiscount.delete({
        where: { storeId_productId: { storeId, productId: targetId } }
      })
    } else if (type === 'product_price') {
      await prisma.storeProductPrice.delete({
        where: { storeId_productId: { storeId, productId: targetId } }
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete discount:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
