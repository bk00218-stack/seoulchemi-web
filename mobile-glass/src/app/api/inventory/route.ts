import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 수량 정규화: 0.5 단위로 올림 (0.1→0.5, 1.1→1.5, 1.6→2)
function normalizeQuantity(qty: number): number {
  return Math.ceil(qty * 2) / 2
}

// GET /api/inventory - 재고 현황 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const search = searchParams.get('search') || ''
    const lowStock = searchParams.get('lowStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // 상품별 재고 조회
    const where: any = {
      isActive: true
    }

    if (brandId) {
      where.brandId = parseInt(brandId)
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { name: { contains: search } } }
      ]
    }

    const total = await prisma.product.count({ where })

    const products = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        options: {
          where: { isActive: true },
          orderBy: [{ sph: 'asc' }, { cyl: 'asc' }]
        }
      },
      orderBy: [{ brandId: 'asc' }, { displayOrder: 'asc' }],
      skip: (page - 1) * limit,
      take: limit
    })

    // 재고 집계
    const inventoryData = products.map(product => {
      const totalStock = product.options.reduce((sum, opt) => sum + opt.stock, 0)
      const optionCount = product.options.length
      const lowStockOptions = product.options.filter(opt => opt.stock <= 5).length

      return {
        id: product.id,
        brandId: product.brandId,
        brandName: product.brand.name,
        name: product.name,
        optionType: product.optionType,
        totalStock,
        optionCount,
        lowStockOptions,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        stockValue: totalStock * product.purchasePrice,
        options: product.options.map(opt => ({
          id: opt.id,
          sph: opt.sph,
          cyl: opt.cyl,
          optionName: opt.optionName,
          stock: opt.stock,
          barcode: opt.barcode,
          location: opt.location
        }))
      }
    })

    // 저재고 필터
    const filteredData = lowStock
      ? inventoryData.filter(item => item.lowStockOptions > 0)
      : inventoryData

    // 브랜드 목록 (필터용)
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: 'asc' }
    })

    // 전체 재고 통계
    const allOptions = await prisma.productOption.findMany({
      where: { isActive: true },
      select: { stock: true }
    })
    const totalStockCount = allOptions.reduce((sum, opt) => sum + opt.stock, 0)
    const lowStockCount = allOptions.filter(opt => opt.stock <= 5).length
    const zeroStockCount = allOptions.filter(opt => opt.stock === 0).length

    return NextResponse.json({
      products: filteredData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalProducts: total,
        totalStock: totalStockCount,
        lowStock: lowStockCount,
        zeroStock: zeroStockCount
      },
      brands
    })
  } catch (error) {
    console.error('Failed to fetch inventory:', error)
    return NextResponse.json({ error: '재고 조회에 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/inventory - 재고 조정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productOptionId, type, quantity, reason, memo, processedBy } = body

    if (!productOptionId || !type || quantity === undefined) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    // 수량 정규화 (1 미만은 0.5)
    const normalizedQty = normalizeQuantity(quantity)

    // 현재 재고 확인
    const option = await prisma.productOption.findUnique({
      where: { id: productOptionId },
      include: { product: true }
    })

    if (!option) {
      return NextResponse.json({ error: '상품옵션을 찾을 수 없습니다.' }, { status: 404 })
    }

    const beforeStock = option.stock
    let newStock = beforeStock

    if (type === 'in') {
      newStock = beforeStock + normalizedQty
    } else if (type === 'out') {
      newStock = beforeStock - normalizedQty
      if (newStock < 0) {
        return NextResponse.json({ error: '재고가 부족합니다.' }, { status: 400 })
      }
    } else if (type === 'adjust') {
      newStock = normalizedQty // 직접 설정
    }

    // 트랜잭션으로 처리
    const [updatedOption, transaction] = await prisma.$transaction([
      // 재고 업데이트
      prisma.productOption.update({
        where: { id: productOptionId },
        data: { stock: newStock }
      }),
      // 이력 기록
      prisma.inventoryTransaction.create({
        data: {
          productId: option.productId,
          productOptionId,
          type,
          reason: reason || type,
          quantity: type === 'adjust' ? normalizedQty - beforeStock : (type === 'out' ? -normalizedQty : normalizedQty),
          beforeStock,
          afterStock: newStock,
          memo,
          processedBy
        }
      })
    ])

    return NextResponse.json({
      success: true,
      option: {
        id: updatedOption.id,
        productName: option.product.name,
        optionName: option.optionName,
        beforeStock,
        afterStock: newStock,
        change: newStock - beforeStock
      },
      transaction
    })
  } catch (error) {
    console.error('Failed to adjust inventory:', error)
    return NextResponse.json({ error: '재고 조정에 실패했습니다.' }, { status: 500 })
  }
}
