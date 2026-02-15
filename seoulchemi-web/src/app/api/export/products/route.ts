// 상품 엑셀 내보내기 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const includeOptions = searchParams.get('includeOptions') === 'true'

    const where: any = { isActive: true }
    if (brandId) where.brandId = parseInt(brandId)

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ brand: { name: 'asc' } }, { name: 'asc' }],
      include: {
        brand: true,
        options: includeOptions ? true : false
      }
    })

    if (includeOptions) {
      // 옵션(도수)별 상세 내보내기
      const headers = [
        '브랜드', '상품명', '상품타입', 'ERP코드', '굴절률',
        'SPH', 'CYL', 'AXIS', '바코드', '재고', '위치', '매입가', '판매가'
      ]

      const rows: string[][] = []

      products.forEach((product: any) => {
        if (product.options && product.options.length > 0) {
          product.options.forEach((option: any) => {
            rows.push([
              product.brand.name,
              product.name,
              product.optionType,
              product.erpCode || '',
              product.refractiveIndex || '',
              option.sph || '',
              option.cyl || '',
              option.axis || '',
              option.barcode || '',
              option.stock.toString(),
              option.location || '',
              product.purchasePrice.toString(),
              (product.sellingPrice + (option.priceAdjustment || 0)).toString()
            ])
          })
        } else {
          rows.push([
            product.brand.name,
            product.name,
            product.optionType,
            product.erpCode || '',
            product.refractiveIndex || '',
            '', '', '', '',
            '0',
            '',
            product.purchasePrice.toString(),
            product.sellingPrice.toString()
          ])
        }
      })

      const BOM = '\uFEFF'
      const csvContent = BOM + [headers, ...rows]
        .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const filename = `products_detail_${new Date().toISOString().slice(0, 10)}.csv`

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } else {
      // 기본 상품 목록 내보내기
      const headers = [
        '브랜드', '상품명', '상품타입', 'ERP코드', '굴절률', '옵션명',
        'SPH사용', 'CYL사용', 'AXIS사용', '매입가', '판매가', '상태'
      ]

      const rows = products.map(product => [
        product.brand.name,
        product.name,
        product.optionType,
        product.erpCode || '',
        product.refractiveIndex || '',
        product.optionName || '',
        product.hasSph ? 'Y' : 'N',
        product.hasCyl ? 'Y' : 'N',
        product.hasAxis ? 'Y' : 'N',
        product.purchasePrice.toString(),
        product.sellingPrice.toString(),
        product.isActive ? '사용' : '미사용'
      ])

      const BOM = '\uFEFF'
      const csvContent = BOM + [headers, ...rows]
        .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const filename = `products_${new Date().toISOString().slice(0, 10)}.csv`

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    }
  } catch (error) {
    console.error('Failed to export products:', error)
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 })
  }
}
