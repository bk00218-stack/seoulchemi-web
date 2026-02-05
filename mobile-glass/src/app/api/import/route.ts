import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/import - CSV/JSON 데이터 가져오기
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data, options } = body

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: '데이터 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    let result: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: []
    }

    switch (type) {
      case 'stores':
        result = await importStores(data, options)
        break
      case 'products':
        result = await importProducts(data, options)
        break
      case 'inventory':
        result = await importInventory(data, options)
        break
      default:
        return NextResponse.json({ error: '지원하지 않는 가져오기 유형입니다.' }, { status: 400 })
    }

    // 작업 로그
    await prisma.workLog.create({
      data: {
        workType: `import_${type}`,
        targetType: 'import',
        description: `데이터 가져오기: ${type} - 성공: ${result.success}, 실패: ${result.failed}`,
        details: JSON.stringify(result)
      }
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: '가져오기에 실패했습니다.' }, { status: 500 })
  }
}

// 가맹점 가져오기
async function importStores(data: any[], options: any) {
  const result = { success: 0, failed: 0, errors: [] as string[] }
  const updateExisting = options?.updateExisting ?? false

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    try {
      const code = String(row.code || row['코드'] || '').trim()
      const name = String(row.name || row['가맹점명'] || row['이름'] || '').trim()

      if (!code || !name) {
        result.failed++
        result.errors.push(`행 ${i + 1}: 코드 또는 이름이 없습니다.`)
        continue
      }

      const existing = await prisma.store.findFirst({ where: { code } })

      if (existing) {
        if (updateExisting) {
          await prisma.store.update({
            where: { id: existing.id },
            data: {
              name,
              phone: row.phone || row['전화번호'] || existing.phone,
              address: row.address || row['주소'] || existing.address,
              ownerName: row.ownerName || row['대표자'] || existing.ownerName,
            }
          })
          result.success++
        } else {
          result.failed++
          result.errors.push(`행 ${i + 1}: 코드 ${code}가 이미 존재합니다.`)
        }
      } else {
        await prisma.store.create({
          data: {
            code,
            name,
            phone: row.phone || row['전화번호'] || null,
            address: row.address || row['주소'] || null,
            ownerName: row.ownerName || row['대표자'] || null,
            isActive: true,
            outstandingAmount: 0,
            creditLimit: parseInt(row.creditLimit || row['신용한도']) || 5000000,
            paymentTermDays: parseInt(row.paymentTermDays || row['결제기간']) || 30,
          }
        })
        result.success++
      }
    } catch (error: any) {
      result.failed++
      result.errors.push(`행 ${i + 1}: ${error.message}`)
    }
  }

  return result
}

// 상품 가져오기
async function importProducts(data: any[], options: any) {
  const result = { success: 0, failed: 0, errors: [] as string[] }
  const updateExisting = options?.updateExisting ?? false

  // 브랜드 캐시
  const brandCache = new Map<string, number>()
  const brands = await prisma.brand.findMany()
  brands.forEach(b => brandCache.set(b.name, b.id))

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    try {
      const brandName = String(row.brandName || row['브랜드'] || '').trim()
      const name = String(row.name || row['상품명'] || '').trim()

      if (!brandName || !name) {
        result.failed++
        result.errors.push(`행 ${i + 1}: 브랜드 또는 상품명이 없습니다.`)
        continue
      }

      // 브랜드 찾기 또는 생성
      let brandId = brandCache.get(brandName)
      if (!brandId) {
        const newBrand = await prisma.brand.create({
          data: { name: brandName, isActive: true }
        })
        brandId = newBrand.id
        brandCache.set(brandName, brandId)
      }

      // 기존 상품 확인
      const existing = await prisma.product.findFirst({
        where: { brandId, name }
      })

      const productData = {
        brandId,
        name,
        optionType: row.optionType || row['옵션타입'] || '안경렌즈 여벌',
        productType: row.productType || row['상품구분'] || '일반',
        purchasePrice: parseInt(row.purchasePrice || row['매입가']) || 0,
        sellingPrice: parseInt(row.sellingPrice || row['판매가']) || 0,
        hasSph: row.hasSph === true || row.hasSph === 'Y' || row['SPH'] === 'Y',
        hasCyl: row.hasCyl === true || row.hasCyl === 'Y' || row['CYL'] === 'Y',
        isActive: true,
      }

      if (existing) {
        if (updateExisting) {
          await prisma.product.update({
            where: { id: existing.id },
            data: productData
          })
          result.success++
        } else {
          result.failed++
          result.errors.push(`행 ${i + 1}: 상품 ${brandName} ${name}이 이미 존재합니다.`)
        }
      } else {
        await prisma.product.create({ data: productData })
        result.success++
      }
    } catch (error: any) {
      result.failed++
      result.errors.push(`행 ${i + 1}: ${error.message}`)
    }
  }

  return result
}

// 재고 가져오기
async function importInventory(data: any[], options: any) {
  const result = { success: 0, failed: 0, errors: [] as string[] }

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    try {
      const barcode = String(row.barcode || row['바코드'] || '').trim()
      const stock = parseInt(row.stock || row['재고'] || row['수량']) || 0

      if (!barcode) {
        result.failed++
        result.errors.push(`행 ${i + 1}: 바코드가 없습니다.`)
        continue
      }

      const option = await prisma.productOption.findFirst({
        where: { barcode }
      })

      if (!option) {
        result.failed++
        result.errors.push(`행 ${i + 1}: 바코드 ${barcode}를 찾을 수 없습니다.`)
        continue
      }

      const beforeStock = option.stock

      await prisma.$transaction([
        prisma.productOption.update({
          where: { id: option.id },
          data: { stock }
        }),
        prisma.inventoryTransaction.create({
          data: {
            productId: option.productId,
            productOptionId: option.id,
            type: 'adjust',
            reason: 'import',
            quantity: stock - beforeStock,
            beforeStock,
            afterStock: stock,
            memo: '엑셀 가져오기',
            processedBy: '관리자'
          }
        })
      ])

      result.success++
    } catch (error: any) {
      result.failed++
      result.errors.push(`행 ${i + 1}: ${error.message}`)
    }
  }

  return result
}
