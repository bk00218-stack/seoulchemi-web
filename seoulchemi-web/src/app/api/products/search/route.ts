import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 })
    }

    // 바코드로 옵션 검색
    const option = await prisma.productOption.findFirst({
      where: { barcode },
      include: {
        product: {
          include: { brand: true }
        }
      }
    })

    if (!option) {
      return NextResponse.json({ product: null, option: null })
    }

    return NextResponse.json({
      product: {
        id: option.product.id,
        name: option.product.name,
        brandId: option.product.brandId,
        brandName: option.product.brand.name,
        optionType: option.product.optionType,
        refractiveIndex: option.product.refractiveIndex,
        sellingPrice: option.product.sellingPrice,
      },
      option: {
        id: option.id,
        sph: option.sph,
        cyl: option.cyl,
        barcode: option.barcode,
        stock: option.stock,
        status: option.isActive ? '주문가능' : '품절',
      }
    })
  } catch (error) {
    console.error('Error searching barcode:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
