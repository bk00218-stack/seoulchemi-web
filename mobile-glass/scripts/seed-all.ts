// 전체 레티나 데이터 임포트 스크립트
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BRANDS = [
  'K누진', '[행사]영진컬러', '데코비젼', '바슈롬', '아큐브', '알콘',
  '인터로조', '진광학', '진명', '케미', '케미기능성', '케미누진',
  '케미매직폼', '쿠퍼비전', '하이텍', '호야 여벌'
]

interface Product {
  optionType: string
  productType: string
  name: string
  bundleName: string
  refractiveIndex: string
  optionName: string
  hasSph: boolean
  hasCyl: boolean
  hasAxis: boolean
  hasBc: boolean
  hasDia: boolean
  purchasePrice: number
  sellingPrice: number
  status: string
  sortOrder: number
}

// 추출한 상품 데이터 (브랜드별)
const PRODUCTS: Record<string, Product[]> = {
  'K누진': [
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K3 누진 1.56',bundleName:'K누진',refractiveIndex:'1.56',optionName:'K-3 중',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:24500,status:'미사용',sortOrder:30},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K3 누진 1.60',bundleName:'K누진',refractiveIndex:'1.60',optionName:'K-3 고',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:34500,status:'미사용',sortOrder:31},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K3 누진 1.67',bundleName:'K누진',refractiveIndex:'1.67',optionName:'K-3 초고',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:40000,status:'미사용',sortOrder:32},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K3 누진 1.74',bundleName:'K누진',refractiveIndex:'1.74',optionName:'K-3 1.74',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:60000,status:'미사용',sortOrder:33},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K5 누진 1.56',bundleName:'K누진',refractiveIndex:'1.56',optionName:'K-5 중',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:31500,status:'미사용',sortOrder:34},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K5 누진 1.60',bundleName:'K누진',refractiveIndex:'1.60',optionName:'K-5 고',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:41500,status:'미사용',sortOrder:35},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K5 누진 1.67',bundleName:'K누진',refractiveIndex:'1.67',optionName:'K-5 초고',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:45000,status:'미사용',sortOrder:36},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K5 누진 1.74',bundleName:'K누진',refractiveIndex:'1.74',optionName:'K-5 1.74',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:67500,status:'미사용',sortOrder:37},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K7 누진 1.56',bundleName:'K누진',refractiveIndex:'1.56',optionName:'K-7 중',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:35000,status:'미사용',sortOrder:38},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K7 누진 1.60',bundleName:'K누진',refractiveIndex:'1.60',optionName:'K-7 고',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:45000,status:'미사용',sortOrder:39},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K7 누진 1.67',bundleName:'K누진',refractiveIndex:'1.67',optionName:'K-7 초고',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:48500,status:'미사용',sortOrder:40},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K7 누진 1.74',bundleName:'K누진',refractiveIndex:'1.74',optionName:'K-7 1.74',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:67500,status:'미사용',sortOrder:41},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K9 누진 1.56',bundleName:'K누진',refractiveIndex:'1.56',optionName:'K-9 중',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:43000,status:'미사용',sortOrder:42},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K9 누진 1.60',bundleName:'K누진',refractiveIndex:'1.60',optionName:'K-9 고',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:48000,status:'미사용',sortOrder:43},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K9 누진 1.67',bundleName:'K누진',refractiveIndex:'1.67',optionName:'K-9 초고',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:59000,status:'미사용',sortOrder:44},
    {optionType:'안경렌즈 RX',productType:'안경렌즈 RX',name:'K9 누진 1.74',bundleName:'K누진',refractiveIndex:'1.74',optionName:'K-9 1.74',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:83000,status:'미사용',sortOrder:45},
  ],
  '알콘': [
    {optionType:'콘택트렌즈',productType:'콘택트렌즈',name:'토탈원 워터렌즈 30P',bundleName:'토탈원 워터렌즈',refractiveIndex:'',optionName:'토탈원 워터렌즈 30P',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:43340,status:'사용',sortOrder:0},
    {optionType:'콘택트렌즈',productType:'콘택트렌즈',name:'토탈원 워터렌즈 90P',bundleName:'토탈원 워터렌즈',refractiveIndex:'',optionName:'토탈원 워터렌즈 90P',hasSph:true,hasCyl:true,hasAxis:true,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:112310,status:'사용',sortOrder:0},
  ],
  '호야 여벌': [
    {optionType:'안경렌즈 여벌',productType:'안경렌즈 여벌',name:'스텔리파이 고굴절',bundleName:'',refractiveIndex:'1.60',optionName:'스텔리파이 고굴절',hasSph:true,hasCyl:true,hasAxis:false,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:9900,status:'사용',sortOrder:0},
    {optionType:'안경렌즈 여벌',productType:'안경렌즈 여벌',name:'스텔리파이 고비',bundleName:'',refractiveIndex:'1.60',optionName:'스텔리파이 고비',hasSph:true,hasCyl:true,hasAxis:false,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:13200,status:'사용',sortOrder:0},
    {optionType:'안경렌즈 여벌',productType:'안경렌즈 여벌',name:'스텔리파이 중굴절',bundleName:'',refractiveIndex:'1.55',optionName:'스텔리파이 중굴절',hasSph:true,hasCyl:true,hasAxis:false,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:5500,status:'사용',sortOrder:0},
    {optionType:'안경렌즈 여벌',productType:'안경렌즈 여벌',name:'스텔리파이 중비',bundleName:'',refractiveIndex:'1.56',optionName:'스텔리파이 중비',hasSph:true,hasCyl:true,hasAxis:false,hasBc:false,hasDia:false,purchasePrice:0,sellingPrice:8250,status:'사용',sortOrder:0},
  ],
}

// 브라우저에서 추출한 전체 데이터를 별도 파일에서 로드
// (여기에 전체 데이터 추가 필요 - 데이터가 너무 크므로 별도 처리)

async function main() {
  console.log('레티나 전체 데이터 임포트 시작...')
  console.log('브랜드 수:', BRANDS.length)

  // 기존 데이터 삭제
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.bundleItem.deleteMany()
  await prisma.bundleProduct.deleteMany()
  await prisma.productShortcut.deleteMany()
  await prisma.productOption.deleteMany()
  await prisma.product.deleteMany()
  await prisma.brand.deleteMany()
  console.log('기존 데이터 삭제 완료')

  // 브랜드 생성
  const brandMap: Record<string, number> = {}
  for (let i = 0; i < BRANDS.length; i++) {
    const brandName = BRANDS[i].replace(/\s+★.*$/, '').trim()
    const brand = await prisma.brand.create({
      data: { name: brandName, displayOrder: i + 1, isActive: true }
    })
    brandMap[brandName] = brand.id
    console.log(`브랜드: ${brandName} (ID: ${brand.id})`)
  }

  // 상품 생성
  let totalProducts = 0
  for (const [brandName, products] of Object.entries(PRODUCTS)) {
    const brandId = brandMap[brandName]
    if (!brandId) {
      console.log(`브랜드 없음: ${brandName}`)
      continue
    }

    for (const p of products) {
      await prisma.product.create({
        data: {
          brandId,
          name: p.name,
          optionType: p.optionType,
          productType: p.productType,
          bundleName: p.bundleName || null,
          refractiveIndex: p.refractiveIndex || null,
          optionName: p.optionName || null,
          hasSph: p.hasSph,
          hasCyl: p.hasCyl,
          hasAxis: p.hasAxis,
          hasBc: p.hasBc,
          hasDia: p.hasDia,
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          isActive: p.status === '사용',
          displayOrder: p.sortOrder,
        }
      })
      totalProducts++
    }
    console.log(`${brandName}: ${products.length}개 상품 생성`)
  }

  console.log(`\n총 ${totalProducts}개 상품 생성 완료!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
