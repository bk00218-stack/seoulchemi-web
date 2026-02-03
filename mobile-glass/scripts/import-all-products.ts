import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface RawProduct {
  brand: string
  unitType: string
  productType: string
  productName: string
  mainProductName: string
  refractiveIndex: string
  options: string
  sellingPrice: string
  status: string
}

async function main() {
  // Read the all-products.json file
  const dataPath = path.join(__dirname, '../data/all-products.json')
  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  const products: RawProduct[] = rawData.products.map((p: any) => ({
    brand: p.brand,
    unitType: p.optionType,
    productType: p.optionType,
    productName: p.name,
    mainProductName: p.bundleName,
    refractiveIndex: p.refractiveIndex,
    options: p.options,
    sellingPrice: String(p.sellingPrice),
    status: p.status || '사용'
  }))
  
  console.log(`총 ${products.length}개 상품 임포트 시작...`)
  console.log(`브랜드: ${Object.keys(rawData.brands).join(', ')}`)
  
  // 1. Create brands
  const brandMap = new Map<string, number>()
  const uniqueBrands = [...new Set(products.map(p => p.brand))]
  
  console.log(`\n브랜드 생성 중... (${uniqueBrands.length}개)`)
  
  for (const brandName of uniqueBrands) {
    const existing = await prisma.brand.findUnique({
      where: { name: brandName }
    })
    
    if (existing) {
      brandMap.set(brandName, existing.id)
      console.log(`  [존재] ${brandName} (ID: ${existing.id})`)
    } else {
      const created = await prisma.brand.create({
        data: { name: brandName, isActive: true }
      })
      brandMap.set(brandName, created.id)
      console.log(`  [생성] ${brandName} (ID: ${created.id})`)
    }
  }
  
  // 2. Create products
  console.log(`\n상품 생성 중...`)
  let created = 0
  let skipped = 0
  let errors = 0
  
  for (const p of products) {
    const brandId = brandMap.get(p.brand)
    if (!brandId) {
      console.log(`  [오류] 브랜드 없음: ${p.brand}`)
      errors++
      continue
    }
    
    // Check if product already exists
    const existing = await prisma.product.findFirst({
      where: {
        brandId,
        name: p.productName
      }
    })
    
    if (existing) {
      skipped++
      continue
    }
    
    // Parse selling price (remove commas)
    const price = parseInt(p.sellingPrice.replace(/,/g, ''), 10) || 0
    
    // Determine product type flags
    const isRx = p.unitType.includes('RX') || p.productType.includes('RX')
    const isContact = p.unitType.includes('콘택트') || p.productType.includes('콘택트')
    
    try {
      await prisma.product.create({
        data: {
          brandId,
          name: p.productName,
          optionType: p.unitType,
          productType: p.productType,
          bundleName: p.mainProductName || null,
          refractiveIndex: p.refractiveIndex || null,
          optionName: p.options || null,
          sellingPrice: price,
          hasSph: !isContact, // 콘택트가 아니면 SPH 사용
          hasCyl: isRx,
          hasAxis: isRx,
          isActive: p.status === '사용'
        }
      })
      created++
    } catch (e) {
      console.log(`  [오류] ${p.productName}: ${e}`)
      errors++
    }
  }
  
  console.log(`\n===== 임포트 완료 =====`)
  console.log(`생성: ${created}`)
  console.log(`스킵 (중복): ${skipped}`)
  console.log(`오류: ${errors}`)
  
  // Print stats
  const totalBrands = await prisma.brand.count()
  const totalProducts = await prisma.product.count()
  console.log(`\nDB 현황:`)
  console.log(`  브랜드: ${totalBrands}개`)
  console.log(`  상품: ${totalProducts}개`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
