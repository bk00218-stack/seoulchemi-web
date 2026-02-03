const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터 입력 시작...')

  // 데이터 파일 읽기
  const storesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/stores.json'), 'utf-8')
  )
  const productsData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/products.json'), 'utf-8')
  )

  // 기존 데이터 삭제
  console.log('🗑️ 기존 데이터 삭제...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productOption.deleteMany()
  await prisma.product.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.store.deleteMany()

  // 거래처 입력
  console.log(`📦 거래처 ${storesData.stores.length}개 입력...`)
  for (const store of storesData.stores) {
    await prisma.store.create({
      data: {
        name: store.name,
        code: store.optNo || `S${store.id}`,
        phone: store.contactTel || store.ownerTel || null,
        address: store.address ? `${store.address} ${store.addressDetail || ''}`.trim() : null,
        ownerName: store.owner || null,
        isActive: store.status === '활성'
      }
    })
  }

  // 브랜드 추출 및 입력
  const brandNames = [...new Set(productsData.products.map(p => p.brand))]
  console.log(`🏷️ 브랜드 ${brandNames.length}개 입력...`)
  
  const brandMap = {}
  for (let i = 0; i < brandNames.length; i++) {
    const brand = await prisma.brand.create({
      data: {
        name: brandNames[i],
        displayOrder: i,
        isActive: true
      }
    })
    brandMap[brandNames[i]] = brand.id
  }

  // 상품 입력
  console.log(`📦 상품 ${productsData.products.length}개 입력...`)
  for (const product of productsData.products) {
    // 가격 파싱 (콤마 제거)
    const sellingPrice = parseInt(product.sellingPrice.replace(/,/g, '')) || 0

    // optionType 매핑
    let optionType = product.unitType
    
    // 처방 옵션 결정
    const isRx = product.unitType === '안경렌즈 RX'
    const isContact = product.unitType === '콘택트렌즈'
    
    await prisma.product.create({
      data: {
        brandId: brandMap[product.brand],
        name: product.productName,
        optionType: optionType,
        productType: product.productType,
        bundleName: product.mainProductName || null,
        refractiveIndex: product.refractiveIndex || null,
        optionName: product.options || null,
        sellingPrice: sellingPrice,
        hasSph: isRx || isContact,
        hasCyl: isRx || isContact,
        hasAxis: isRx,
        hasBc: isContact,
        hasDia: isContact,
        isActive: product.status === '사용'
      }
    })
  }

  console.log('✅ 시드 완료!')
  console.log(`   - 거래처: ${storesData.stores.length}개`)
  console.log(`   - 브랜드: ${brandNames.length}개`)
  console.log(`   - 상품: ${productsData.products.length}개`)
}

main()
  .catch((e) => {
    console.error('❌ 시드 실패:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
