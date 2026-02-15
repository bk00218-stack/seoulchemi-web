// 재고 대량 수정 API (CSV 업로드)
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
    const adjustMode = formData.get('adjustMode') as string || 'set' // set: 덮어쓰기, add: 추가, subtract: 차감

    if (!file) {
      return NextResponse.json({ error: '파일을 선택해주세요' }, { status: 400 })
    }

    const text = await file.text()
    const cleanText = text.replace(/^\uFEFF/, '')
    const rows = parseCSV(cleanText)

    if (rows.length < 2) {
      return NextResponse.json({ error: '데이터가 없습니다' }, { status: 400 })
    }

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const dataRows = rows.slice(1)

    const headerMap: Record<string, number> = {}
    headers.forEach((h, i) => {
      headerMap[h] = i
    })

    // 바코드 기준으로 옵션 찾기
    const hasBarcodeColumn = headerMap['바코드'] !== undefined

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const rowNum = i + 2

      try {
        const barcode = row[headerMap['바코드']]?.trim()
        const stock = parseInt(row[headerMap['재고']] || row[headerMap['현재재고']] || '0')

        if (isNaN(stock)) {
          results.skipped++
          continue
        }

        let option = null

        if (barcode) {
          // 바코드로 검색
          option = await prisma.productOption.findFirst({
            where: { barcode }
          })
        } else {
          // 상품명 + SPH + CYL 조합으로 검색
          const brandName = row[headerMap['브랜드']]?.trim()
          const productName = row[headerMap['상품명']]?.trim()
          const sph = row[headerMap['sph']]?.trim()
          const cyl = row[headerMap['cyl']]?.trim()

          if (productName) {
            const product = await prisma.product.findFirst({
              where: {
                name: productName,
                ...(brandName ? { brand: { name: brandName } } : {})
              }
            })

            if (product) {
              option = await prisma.productOption.findFirst({
                where: {
                  productId: product.id,
                  ...(sph ? { sph } : {}),
                  ...(cyl ? { cyl } : {})
                }
              })

              // 옵션이 없으면 새로 생성
              if (!option && (sph || cyl)) {
                option = await prisma.productOption.create({
                  data: {
                    productId: product.id,
                    sph: sph || null,
                    cyl: cyl || null,
                    axis: row[headerMap['axis']]?.trim() || null,
                    barcode: barcode || null,
                    stock: 0
                  }
                })
              }
            }
          }
        }

        if (!option) {
          results.failed++
          results.errors.push(`행 ${rowNum}: 상품/옵션을 찾을 수 없습니다`)
          continue
        }

        // 재고 수정
        let newStock = stock
        if (adjustMode === 'add') {
          newStock = option.stock + stock
        } else if (adjustMode === 'subtract') {
          newStock = Math.max(0, option.stock - stock)
        }

        // 재고 이력 기록
        await prisma.inventoryTransaction.create({
          data: {
            productId: option.productId,
            productOptionId: option.id,
            type: 'adjust',
            reason: 'adjust',
            quantity: newStock - option.stock,
            beforeStock: option.stock,
            afterStock: newStock,
            memo: `일괄 재고 수정 (${adjustMode})`
          }
        })

        // 재고 업데이트
        await prisma.productOption.update({
          where: { id: option.id },
          data: { 
            stock: newStock,
            location: row[headerMap['위치']]?.trim() || option.location
          }
        })

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`행 ${rowNum}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      }
    }

    return NextResponse.json({
      message: '재고 수정 완료',
      results
    })
  } catch (error) {
    console.error('Failed to import inventory:', error)
    return NextResponse.json({ error: 'Failed to import inventory' }, { status: 500 })
  }
}

// 템플릿 다운로드
export async function GET() {
  const headers = ['브랜드', '상품명', 'SPH', 'CYL', 'AXIS', '바코드', '재고', '위치']
  const sampleRow = ['케미', '1.56 착색', '-2.00', '-0.75', '', 'ABC123', '10', 'A-1-2']

  const BOM = '\uFEFF'
  const csvContent = BOM + [headers, sampleRow]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="inventory_template.csv"'
    }
  })
}
