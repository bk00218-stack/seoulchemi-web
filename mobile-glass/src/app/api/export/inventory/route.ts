// 재고 엑셀 내보내기 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const lowStock = searchParams.get('lowStock') === 'true'

    const where: any = { product: { isActive: true } }
    if (brandId) where.product = { ...where.product, brandId: parseInt(brandId) }

    const options = await prisma.productOption.findMany({
      where,
      orderBy: [
        { product: { brand: { name: 'asc' } } },
        { product: { name: 'asc' } },
        { sph: 'asc' },
        { cyl: 'asc' }
      ],
      include: {
        product: {
          include: { brand: true }
        }
      }
    })

    // 재고 부족만 필터링
    let filteredOptions = options
    if (lowStock) {
      filteredOptions = options.filter(opt => opt.stock <= 5)
    }

    const headers = [
      '브랜드', '상품명', 'SPH', 'CYL', 'AXIS', '바코드', '현재재고', '위치', '상태'
    ]

    const rows = filteredOptions.map(option => [
      option.product.brand.name,
      option.product.name,
      option.sph || '',
      option.cyl || '',
      option.axis || '',
      option.barcode || '',
      option.stock.toString(),
      option.location || '',
      option.isActive ? '사용' : '미사용'
    ])

    const BOM = '\uFEFF'
    const csvContent = BOM + [headers, ...rows]
      .map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const filename = `inventory_${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Failed to export inventory:', error)
    return NextResponse.json({ error: 'Failed to export inventory' }, { status: 500 })
  }
}
