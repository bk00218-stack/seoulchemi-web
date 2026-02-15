// 가맹점 대량 등록 API (CSV 업로드)
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
        const code = row[headerMap['가맹점코드']]?.trim()
        const name = row[headerMap['가맹점명']]?.trim()

        if (!code || !name) {
          results.skipped++
          continue
        }

        const storeData = {
          code,
          name,
          ownerName: row[headerMap['대표자']]?.trim() || null,
          phone: row[headerMap['연락처']]?.trim() || null,
          address: row[headerMap['주소']]?.trim() || null,
          deliveryAddress: row[headerMap['배송주소']]?.trim() || null,
          deliveryContact: row[headerMap['배송담당자']]?.trim() || null,
          deliveryPhone: row[headerMap['배송연락처']]?.trim() || null,
          creditLimit: parseInt(row[headerMap['신용한도']]?.trim()) || 0,
          paymentTermDays: parseInt(row[headerMap['결제기한']]?.trim()) || 30,
          salesRepName: row[headerMap['담당자']]?.trim() || null,
          areaCode: row[headerMap['지역']]?.trim() || null,
        }

        // 기존 가맹점 확인
        const existing = await prisma.store.findUnique({
          where: { code }
        })

        if (existing) {
          if (mode === 'create') {
            results.skipped++
            continue
          } else {
            await prisma.store.update({
              where: { code },
              data: storeData
            })
            results.success++
          }
        } else {
          await prisma.store.create({ data: storeData })
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
    console.error('Failed to import stores:', error)
    return NextResponse.json({ error: 'Failed to import stores' }, { status: 500 })
  }
}

// 템플릿 다운로드
export async function GET() {
  const headers = [
    '가맹점코드', '가맹점명', '대표자', '연락처', '주소',
    '배송주소', '배송담당자', '배송연락처', '신용한도', '결제기한', '담당자', '지역'
  ]
  const sampleRow = [
    'STORE001', '서울안경원', '홍길동', '02-1234-5678', '서울시 강남구 테헤란로 123',
    '서울시 강남구 테헤란로 123', '김배송', '010-1234-5678', '1000000', '30', '이영업', '강남'
  ]

  const BOM = '\uFEFF'
  const csvContent = BOM + [headers, sampleRow]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="store_template.csv"'
    }
  })
}
