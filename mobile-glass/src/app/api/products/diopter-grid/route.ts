// 도수표 그리드 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const brandId = searchParams.get('brandId')

    if (!productId && !brandId) {
      // 브랜드/상품 목록 반환
      const brands = await prisma.brand.findMany({
        where: { isActive: true },
        include: {
          products: {
            where: { 
              isActive: true,
              OR: [
                { hasSph: true },
                { hasCyl: true }
              ]
            },
            select: { id: true, name: true, refractiveIndex: true, optionName: true }
          }
        },
        orderBy: { displayOrder: 'asc' }
      })

      return NextResponse.json({ brands })
    }

    // 특정 상품의 도수표 데이터
    const options = await prisma.productOption.findMany({
      where: {
        productId: productId ? parseInt(productId) : undefined,
        product: brandId ? { brandId: parseInt(brandId) } : undefined,
        isActive: true
      },
      orderBy: [{ sph: 'asc' }, { cyl: 'asc' }],
      include: {
        product: {
          select: { id: true, name: true, brand: { select: { name: true } } }
        }
      }
    })

    // SPH, CYL 범위 추출
    const sphValues = new Set<string>()
    const cylValues = new Set<string>()

    options.forEach(opt => {
      if (opt.sph) sphValues.add(opt.sph)
      if (opt.cyl) cylValues.add(opt.cyl)
    })

    // 정렬 함수 (도수값 정렬)
    const sortDiopter = (a: string, b: string) => {
      const aNum = parseFloat(a.replace('+', ''))
      const bNum = parseFloat(b.replace('+', ''))
      return aNum - bNum
    }

    const sortedSph = Array.from(sphValues).sort(sortDiopter)
    const sortedCyl = Array.from(cylValues).sort(sortDiopter)

    // 그리드 데이터 구성
    const grid: Record<string, Record<string, { stock: number; optionId: number; barcode?: string }>> = {}

    sortedSph.forEach(sph => {
      grid[sph] = {}
    })

    options.forEach(opt => {
      if (opt.sph && opt.cyl !== null) {
        if (!grid[opt.sph]) grid[opt.sph] = {}
        grid[opt.sph][opt.cyl || '0'] = {
          stock: opt.stock,
          optionId: opt.id,
          barcode: opt.barcode || undefined
        }
      } else if (opt.sph && opt.cyl === null) {
        // CYL 없이 SPH만 있는 경우
        if (!grid[opt.sph]) grid[opt.sph] = {}
        grid[opt.sph]['0'] = {
          stock: opt.stock,
          optionId: opt.id,
          barcode: opt.barcode || undefined
        }
      }
    })

    // 통계
    const stats = {
      totalOptions: options.length,
      totalStock: options.reduce((sum, opt) => sum + opt.stock, 0),
      outOfStock: options.filter(opt => opt.stock === 0).length,
      lowStock: options.filter(opt => opt.stock > 0 && opt.stock <= 5).length
    }

    return NextResponse.json({
      sphRange: sortedSph,
      cylRange: sortedCyl.length > 0 ? sortedCyl : ['0'],
      grid,
      stats,
      productName: options[0]?.product.name,
      brandName: options[0]?.product.brand.name
    })
  } catch (error) {
    console.error('Failed to fetch diopter grid:', error)
    return NextResponse.json({ error: 'Failed to fetch diopter grid' }, { status: 500 })
  }
}

// 도수 옵션 개별 수정
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { optionId, stock, priceAdjustment, isActive, location, barcode } = body

    if (!optionId) {
      return NextResponse.json({ error: '옵션 ID가 필요합니다' }, { status: 400 })
    }

    const option = await prisma.productOption.findUnique({
      where: { id: optionId }
    })

    if (!option) {
      return NextResponse.json({ error: '옵션을 찾을 수 없습니다' }, { status: 404 })
    }

    const updateData: any = {}

    // 재고 변경 시 이력 기록
    if (stock !== undefined && stock !== option.stock) {
      await prisma.inventoryTransaction.create({
        data: {
          productId: option.productId,
          productOptionId: option.id,
          type: 'adjust',
          reason: 'adjust',
          quantity: stock - option.stock,
          beforeStock: option.stock,
          afterStock: stock,
          memo: '도수표에서 직접 수정'
        }
      })
      updateData.stock = stock
    }

    if (priceAdjustment !== undefined) updateData.priceAdjustment = priceAdjustment
    if (isActive !== undefined) updateData.isActive = isActive
    if (location !== undefined) updateData.location = location
    if (barcode !== undefined) updateData.barcode = barcode

    const updated = await prisma.productOption.update({
      where: { id: optionId },
      data: updateData
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update option:', error)
    return NextResponse.json({ error: 'Failed to update option' }, { status: 500 })
  }
}

// 도수 옵션 일괄 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, sphRange, cylRange, defaultStock = 0 } = body

    if (!productId) {
      return NextResponse.json({ error: '상품을 선택해주세요' }, { status: 400 })
    }

    // sphRange: { min: -6.00, max: 0, step: 0.25 }
    // cylRange: { min: -2.00, max: 0, step: 0.25 }

    const sphValues: string[] = []
    const cylValues: string[] = []

    // SPH 값 생성
    for (let sph = sphRange.min; sph <= sphRange.max; sph += sphRange.step) {
      const formatted = sph >= 0 ? `+${sph.toFixed(2)}` : sph.toFixed(2)
      sphValues.push(formatted)
    }

    // CYL 값 생성
    for (let cyl = cylRange.min; cyl <= cylRange.max; cyl += cylRange.step) {
      const formatted = cyl >= 0 ? `+${cyl.toFixed(2)}` : cyl.toFixed(2)
      cylValues.push(formatted)
    }

    // 기존 옵션 조회
    const existingOptions = await prisma.productOption.findMany({
      where: { productId },
      select: { sph: true, cyl: true }
    })

    const existingSet = new Set(
      existingOptions.map(opt => `${opt.sph}|${opt.cyl}`)
    )

    // 새 옵션 생성
    const newOptions: { productId: number; sph: string; cyl: string; stock: number }[] = []

    for (const sph of sphValues) {
      for (const cyl of cylValues) {
        const key = `${sph}|${cyl}`
        if (!existingSet.has(key)) {
          newOptions.push({
            productId,
            sph,
            cyl,
            stock: defaultStock
          })
        }
      }
    }

    if (newOptions.length > 0) {
      await prisma.productOption.createMany({
        data: newOptions
      })
    }

    return NextResponse.json({
      message: `${newOptions.length}개의 옵션이 생성되었습니다`,
      created: newOptions.length,
      skipped: (sphValues.length * cylValues.length) - newOptions.length
    })
  } catch (error) {
    console.error('Failed to create diopter options:', error)
    return NextResponse.json({ error: 'Failed to create diopter options' }, { status: 500 })
  }
}
