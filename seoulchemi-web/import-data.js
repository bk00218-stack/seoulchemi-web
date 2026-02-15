const { PrismaClient } = require('@prisma/client')
const storesData = require('./data/stores.json')
const productsData = require('./data/products.json')

const prisma = new PrismaClient()

async function main() {
  console.log('=== 데이터 Import 시작 ===\n')

  // 1. 브랜드 Import
  console.log('1. 브랜드 Import...')
  const brandMap = {}
  for (const brandName of productsData.brands) {
    const existing = await prisma.brand.findFirst({ where: { name: brandName } })
    if (existing) {
      brandMap[brandName] = existing.id
      console.log(`  - ${brandName}: 이미 존재 (id: ${existing.id})`)
    } else {
      const brand = await prisma.brand.create({
        data: {
          name: brandName,
          isActive: true,
        }
      })
      brandMap[brandName] = brand.id
      console.log(`  + ${brandName}: 생성됨 (id: ${brand.id})`)
    }
  }
  console.log(`브랜드 ${Object.keys(brandMap).length}개 완료\n`)

  // 2. 거래처 Import
  console.log('2. 거래처 Import...')
  let storeCount = 0
  let storeSkipped = 0
  for (const store of storesData.stores) {
    const code = store.optNo || String(store.id + 10000)
    const existing = await prisma.store.findFirst({ 
      where: { OR: [{ code }, { name: store.name }] } 
    })
    if (existing) {
      storeSkipped++
      continue
    }
    
    await prisma.store.create({
      data: {
        code,
        name: store.name,
        ownerName: store.owner || null,
        phone: store.contactTel || null,
        address: store.address ? `${store.address} ${store.addressDetail || ''}`.trim() : null,
        businessRegNo: store.businessNumber || null,
        email: store.email || null,
        memo: store.memo || null,
        isActive: store.status === '활성',
        status: store.status === '활성' ? 'active' : 'suspended',
      }
    })
    storeCount++
  }
  console.log(`거래처 ${storeCount}개 생성, ${storeSkipped}개 스킵\n`)

  // 3. 상품 Import
  console.log('3. 상품 Import...')
  let productCount = 0
  let productSkipped = 0
  for (const product of productsData.products) {
    const brandId = brandMap[product.brand]
    if (!brandId) {
      console.log(`  ! 브랜드 없음: ${product.brand}`)
      continue
    }

    const existing = await prisma.product.findFirst({
      where: { 
        brandId,
        name: product.productName 
      }
    })
    if (existing) {
      productSkipped++
      continue
    }

    // 가격 파싱 (콤마 제거)
    const price = parseInt(String(product.sellingPrice).replace(/,/g, '')) || 0

    await prisma.product.create({
      data: {
        brandId,
        name: product.productName,
        optionType: product.unitType || '안경렌즈 여벌',
        productType: product.productType || '안경렌즈',
        bundleName: product.mainProductName || null,
        refractiveIndex: product.refractiveIndex || null,
        optionName: product.options || null,
        sellingPrice: price,
        purchasePrice: Math.floor(price * 0.7), // 매입가 추정
        isActive: product.status === '사용',
      }
    })
    productCount++
  }
  console.log(`상품 ${productCount}개 생성, ${productSkipped}개 스킵\n`)

  // 결과 확인
  console.log('=== Import 완료 ===')
  console.log('Brand:', await prisma.brand.count())
  console.log('Store:', await prisma.store.count())
  console.log('Product:', await prisma.product.count())

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
