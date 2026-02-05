// 상품 대량 등록 API (CSV 업로드)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// CSV 파싱 함수
function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter(line => line.trim())
  const result: string[][] = []

  for (const line of lines) {
    const row: string[] = []
    let cell = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(cell.trim())
        cell = ''
      } else {
        cell += char
      }
    }
    row.push(cell.trim())
    result.push(row)
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string || 'create' // create, update, upsert

    if (!file) {
      return NextResponse.json({ error: '파일을 선택해주세요' }, { status: 400 })
    }

    const text = await file.text()
    // BOM 제거
    const cleanText = text.replace(/^\uFEFF/, '')
    const rows = parseCSV(cleanText)

    if (rows.length < 2) {
      return NextResponse.json({ error: '데이터가 없습니다' }, { status: 400 })
    }

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const dataRows = rows.slice(1)

    // 필수 컬럼 확인
    const requiredColumns = ['브랜드', '상품명']
    const headerMap: Record<string, number> = {}

    headers.forEach((h, i) => {
      headerMap[h] = i
    })

    // 브랜드 캐시
    const brands = await prisma.brand.findMany()
    const brandMap = new Map(brands.map(b => [b.name.toLowerCase(), b]))

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNum = i + 2 // 헤더 + 1-indexed

      try {
        const brandName = row[headerMap['브랜드']]?.trim()
        const productName = row[headerMap['상품명']]?.trim()

        if (!brandName || !productName) {
          results.skipped++
          continue
        }

        // 브랜드 찾기 또는 생성
        let brand = brandMap.get(brandName.toLowerCase())
        if (!brand) {
          brand = await prisma.brand.create({
            data: { name: brandName }
          })
          brandMap.set(brandName.toLowerCase(), brand)
        }

        const productData = {
          brandId: brand.id,
          name: productName,
          optionType: row[headerMap['상품타입']]?.trim() || '안경렌즈 여벌',
          productType: row[headerMap['상품구분']]?.trim() || '',
          erpCode: row[headerMap['erp코드']]?.trim() || null,
          refractiveIndex: row[headerMap['굴절률']]?.trim() || null,
          optionName: row[headerMap['옵션명']]?.trim() || null,
          hasSph: row[headerMap['sph사용']]?.trim()?.toUpperCase() === 'Y',
          hasCyl: row[headerMap['cyl사용']]?.trim()?.toUpperCase() === 'Y',
          hasAxis: row[headerMap['axis사용']]?.trim()?.toUpperCase() === 'Y',
          purchasePrice: parseInt(row[headerMap['매입가']]?.trim()) || 0,
          sellingPrice: parseInt(row[headerMap['판매가']]?.trim()) || 0,
        }

        // 기존 상품 확인
        const existing = await prisma.product.findFirst({
          where: {
            brandId: brand.id,
            name: productName
          }
        })

        if (existing) {
          if (mode === 'create') {
            results.skipped++
            continue
          } else {
            // update or upsert
            await prisma.product.update({
              where: { id: existing.id },
              data: productData
            })
            results.success++
          }
        } else {
          await prisma.product.create({ data: productData })
          results.success++
        }
      } catch (error) {
        results.failed++
        results.errors.push(`행 ${rowNum}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      }
    }

    return NextResponse.json({
      message: '가져오기 완료',
      results
    })
  } catch (error) {
    console.error('Failed to import products:', error)
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 })
  }
}

// 템플릿 다운로드
export async function GET() {
  const headers = [
    '브랜드', '상품명', '상품타입', '상품구분', 'ERP코드', '굴절률', '옵션명',
    'SPH사용', 'CYL사용', 'AXIS사용', '매입가', '판매가'
  ]

  const sampleRow = [
    '케미', '1.56 착색', '안경렌즈 여벌', '단초점', 'CHM-156-T', '1.56', '착색',
    'Y', 'Y', 'N', '10000', '20000'
  ]

  const BOM = '\uFEFF'
  const csvContent = BOM + [headers, sampleRow]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="product_template.csv"'
    }
  })
}
