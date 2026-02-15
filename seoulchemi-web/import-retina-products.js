const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// 레티나에서 추출한 데이터
const retinaProducts = [
  // PERFECT UV
  { category: "PERFECT UV", prodCd: "102506", prodName: "USH 1.56 SP PERFECT UV -SW", prodKrName: "중 퍼펙트", shortcut: "BPUCS", refIndex: "1.56", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -10, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 6, cylFrom: 0, cylTo: 2},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  { category: "PERFECT UV", prodCd: "102516", prodName: "USH 1.56 ASP PERFECT UV -SW", prodKrName: "중비 퍼펙트", shortcut: "IPUCS", refIndex: "1.56", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -10, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 6, cylFrom: 0, cylTo: 2},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  { category: "PERFECT UV", prodCd: "105466", prodName: "USH MR-8 SP PERFECT UV-V", prodKrName: "고 퍼펙트", shortcut: "DPV", refIndex: "1.60", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -10, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 6, cylFrom: 0, cylTo: 2},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  { category: "PERFECT UV", prodCd: "105476", prodName: "USH MR-8 ASP PERFECT UV-V", prodKrName: "고비 퍼펙트", shortcut: "GPV", refIndex: "1.60", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -10, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 6, cylFrom: 0, cylTo: 2},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  { category: "PERFECT UV", prodCd: "105514", prodName: "USH MR-8 SP HI-CURVE PERFECT UV-V", prodKrName: "고 퍼펙트 하이커브", shortcut: "HGP1V", refIndex: "1.60", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -10, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 4, cylFrom: 0, cylTo: 3},
    {type: "복난시", sphFrom: 0.25, sphTo: 3.75, cylFrom: -0.5, cylTo: -4}
  ]},
  { category: "PERFECT UV", prodCd: "106466", prodName: "USH MR-7 ASP 65 PERFECT UV-V", prodKrName: "초고비 퍼펙트", shortcut: "HPV", refIndex: "1.67", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -15, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 6, cylFrom: 0, cylTo: 2}
  ]},
  { category: "PERFECT UV", prodCd: "143225", prodName: "USH 1.74 ASP PERFECT UV", prodKrName: "1.74 퍼펙트", shortcut: "SRPV", refIndex: "1.74", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -15, cylFrom: 0, cylTo: -4},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  
  // IR
  { category: "IR", prodCd: "102486", prodName: "USH NK-55 SP PUV IR", prodKrName: "중 IR", shortcut: "BNP", refIndex: "1.56", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -10, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 4, cylFrom: 0, cylTo: 2},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  { category: "IR", prodCd: "102496", prodName: "USH NK-55 ASP PUV IR", prodKrName: "중비 IR", shortcut: "BANP", refIndex: "1.56", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -10, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 4, cylFrom: 0, cylTo: 2},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  { category: "IR", prodCd: "105496", prodName: "USH MR-8 ASP PUV IR", prodKrName: "고비 IR", shortcut: "GNP", refIndex: "1.60", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -10, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 6, cylFrom: 0, cylTo: 2},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  { category: "IR", prodCd: "105596", prodName: "USH MR-8 SP PUV IR", prodKrName: "고 IR", shortcut: "SNP", refIndex: "1.60", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -8, cylFrom: 0, cylTo: -4},
    {type: "원난시", sphFrom: 0, sphTo: 6, cylFrom: 0, cylTo: 2},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
  { category: "IR", prodCd: "106486", prodName: "USH MR-7 ASP PUV IR", prodKrName: "초고비 IR", shortcut: "HNP", refIndex: "1.67", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -15, cylFrom: 0, cylTo: -4}
  ]},
  { category: "IR", prodCd: "143716", prodName: "USH 1.74 ASP PUV IR", prodKrName: "1.74 IR", shortcut: "SHIR", refIndex: "1.74", hasImage: true, diopters: [
    {type: "근난시", sphFrom: 0, sphTo: -15, cylFrom: 0, cylTo: -4},
    {type: "복난시", sphFrom: 0.25, sphTo: 1.75, cylFrom: -0.5, cylTo: -2}
  ]},
]

async function main() {
  // 케미 브랜드 찾기
  let brand = await prisma.brand.findFirst({ where: { name: '케미' } })
  if (!brand) {
    brand = await prisma.brand.create({
      data: { name: '케미', isActive: true, displayOrder: 1 }
    })
    console.log('Created brand: 케미')
  }
  console.log('Brand ID:', brand.id)

  let created = 0
  let skipped = 0

  for (const prod of retinaProducts) {
    // 이미 있는지 확인 (ERP 코드로)
    const existing = await prisma.product.findFirst({
      where: { erpCode: prod.prodCd }
    })
    
    if (existing) {
      console.log(`Skipped (exists): ${prod.prodKrName} [${prod.prodCd}]`)
      skipped++
      continue
    }

    // 상품 생성
    const newProd = await prisma.product.create({
      data: {
        brandId: brand.id,
        name: `[케미 ${prod.category}] ${prod.prodKrName}`,
        erpCode: prod.prodCd,
        optionType: '안경렌즈 RX',
        productType: '단초점',
        bundleName: prod.category,
        refractiveIndex: prod.refIndex,
        optionName: prod.prodKrName,
        hasSph: true,
        hasCyl: true,
        hasAxis: true,
        imageUrl: prod.hasImage ? `/images/chemi/${prod.prodCd}.jpg` : null,
        isActive: true,
        displayOrder: created
      }
    })
    
    console.log(`Created: ${newProd.name} [${prod.prodCd}]`)
    created++
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
