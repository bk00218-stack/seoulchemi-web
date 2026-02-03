// Retina 데이터 임포트 스크립트
// 브라우저에서 추출한 데이터를 DB에 저장

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 레티나에서 추출한 브랜드 목록
const BRANDS = [
  'K누진',
  '[행사]영진컬러',
  '데코비젼',
  '바슈롬',
  '아큐브',
  '알콘',
  '인터로조',
  '진광학',
  '진명',
  '케미',
  '케미기능성',
  '케미누진',
  '케미매직폼',
  '쿠퍼비전',
  '하이텍',
  '호야 여벌',
]

interface ProductData {
  brandName: string
  optionType: string
  productType: string
  name: string
  rgpType?: string
  bundleName?: string
  erpCode?: string
  refractiveIndex?: string
  optionName?: string
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

// 레티나에서 추출한 상품 데이터
const PRODUCTS: ProductData[] = [
  // K누진 브랜드
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K3 누진 1.56', bundleName: 'K누진', refractiveIndex: '1.56', optionName: 'K-3 중', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 24500, status: '미사용', sortOrder: 30 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K3 누진 1.60', bundleName: 'K누진', refractiveIndex: '1.60', optionName: 'K-3 고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 34500, status: '미사용', sortOrder: 31 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K3 누진 1.67', bundleName: 'K누진', refractiveIndex: '1.67', optionName: 'K-3 초고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 40000, status: '미사용', sortOrder: 32 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K3 누진 1.74', bundleName: 'K누진', refractiveIndex: '1.74', optionName: 'K-3 1.74', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 60000, status: '미사용', sortOrder: 33 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K5 누진 1.56', bundleName: 'K누진', refractiveIndex: '1.56', optionName: 'K-5 중', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 31500, status: '미사용', sortOrder: 34 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K5 누진 1.60', bundleName: 'K누진', refractiveIndex: '1.60', optionName: 'K-5 고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 41500, status: '미사용', sortOrder: 35 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K5 누진 1.67', bundleName: 'K누진', refractiveIndex: '1.67', optionName: 'K-5 초고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 45000, status: '미사용', sortOrder: 36 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K5 누진 1.74', bundleName: 'K누진', refractiveIndex: '1.74', optionName: 'K-5 1.74', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 67500, status: '미사용', sortOrder: 37 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K7 누진 1.56', bundleName: 'K누진', refractiveIndex: '1.56', optionName: 'K-7 중', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 35000, status: '미사용', sortOrder: 38 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K7 누진 1.60', bundleName: 'K누진', refractiveIndex: '1.60', optionName: 'K-7 고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 45000, status: '미사용', sortOrder: 39 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K7 누진 1.67', bundleName: 'K누진', refractiveIndex: '1.67', optionName: 'K-7 초고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 48500, status: '미사용', sortOrder: 40 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K7 누진 1.74', bundleName: 'K누진', refractiveIndex: '1.74', optionName: 'K-7 1.74', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 67500, status: '미사용', sortOrder: 41 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K9 누진 1.56', bundleName: 'K누진', refractiveIndex: '1.56', optionName: 'K-9 중', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 43000, status: '미사용', sortOrder: 42 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K9 누진 1.60', bundleName: 'K누진', refractiveIndex: '1.60', optionName: 'K-9 고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 48000, status: '미사용', sortOrder: 43 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K9 누진 1.67', bundleName: 'K누진', refractiveIndex: '1.67', optionName: 'K-9 초고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 59000, status: '미사용', sortOrder: 44 },
  { brandName: 'K누진', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: 'K9 누진 1.74', bundleName: 'K누진', refractiveIndex: '1.74', optionName: 'K-9 1.74', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 83000, status: '미사용', sortOrder: 45 },

  // 케미 브랜드
  { brandName: '케미', optionType: '안경렌즈 RX', productType: '안경렌즈 RX', name: '1.56 착색', bundleName: '착색', refractiveIndex: '1.56', optionName: '1.56 착색', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 6000, status: '사용', sortOrder: 11 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 근적외선] 1.74', bundleName: '근적외선IR', refractiveIndex: '1.74', optionName: '1.74', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 15000, status: '사용', sortOrder: 17 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 근적외선] 고', bundleName: '근적외선IR', refractiveIndex: '1.60', optionName: '고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 4950, status: '사용', sortOrder: 13 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 근적외선] 고비', bundleName: '근적외선IR', refractiveIndex: '1.60', optionName: '고비', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 6200, status: '사용', sortOrder: 15 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 근적외선] 중', bundleName: '근적외선IR', refractiveIndex: '1.56', optionName: '중', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 3300, status: '사용', sortOrder: 2 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 근적외선] 중비', bundleName: '근적외선IR', refractiveIndex: '1.56', optionName: '중비', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 4200, status: '사용', sortOrder: 12 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 근적외선] 초고비', bundleName: '근적외선IR', refractiveIndex: '1.67', optionName: '초고비', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 8000, status: '사용', sortOrder: 14 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 누진] 스타일 1.56 L', bundleName: '스타일 누진', refractiveIndex: '1.56', optionName: '1.56 누진여벌 왼쪽', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 4750, status: '사용', sortOrder: 19 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 누진] 스타일 1.56 R', bundleName: '스타일 누진', refractiveIndex: '1.56', optionName: '1.56 누진여벌 오른쪽', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 4750, status: '사용', sortOrder: 9 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 누진] 스타일 1.60 L', bundleName: '스타일 누진', refractiveIndex: '1.60', optionName: '1.60 여벌누진 왼쪽', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 15000, status: '사용', sortOrder: 20 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 누진] 스타일 1.60 R', bundleName: '스타일 누진', refractiveIndex: '1.60', optionName: '1.60 여벌누진 오른쪽', hasSph: true, hasCyl: false, hasAxis: false, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 15000, status: '사용', sortOrder: 18 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 드라이브] 1.60 ASP', bundleName: 'X-드라이브', refractiveIndex: '1.60', optionName: '1.60 비구면', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 6500, status: '사용', sortOrder: 6 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 드라이브] 1.67 ASP', bundleName: 'X-드라이브', refractiveIndex: '1.67', optionName: '1.67 비구면', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 9000, status: '사용', sortOrder: 16 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 변색] GEN 8(B)', bundleName: '케미변색', refractiveIndex: '1.60', optionName: 'GEN 8 (B) 고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 42500, status: '사용', sortOrder: 52 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 변색] GEN 8(G)', bundleName: '케미변색', refractiveIndex: '1.60', optionName: 'GEN 8 (G) 고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 42500, status: '사용', sortOrder: 51 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 변색] 고비 클래식(B)', bundleName: '케미변색', refractiveIndex: '1.60', optionName: '클래식(B) 고비', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 24500, status: '사용', sortOrder: 50 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 변색] 고비 클래식(G)', bundleName: '케미변색', refractiveIndex: '1.60', optionName: '클래식(G) 고비', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 24500, status: '사용', sortOrder: 48 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 변색] 엑스트라엑티브(B)', bundleName: '케미변색', refractiveIndex: '1.60', optionName: '엑스트라엑티브(B) 고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 47500, status: '사용', sortOrder: 54 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 변색] 엑스트라엑티브(G)', bundleName: '케미변색', refractiveIndex: '1.60', optionName: '엑스트라엑티브(G) 고', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 47500, status: '사용', sortOrder: 53 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 변색] 원앤원 (B)', bundleName: '케미변색', refractiveIndex: '1.56', optionName: '원앤원 (B) 중비', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 7000, status: '사용', sortOrder: 57 },
  { brandName: '케미', optionType: '안경렌즈 여벌', productType: '안경렌즈 여벌', name: '[케미 변색] 원앤원 (G)', bundleName: '케미변색', refractiveIndex: '1.56', optionName: '원앤원 (G) 중비', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 7000, status: '사용', sortOrder: 55 },

  // 알콘 브랜드 (콘택트렌즈)
  { brandName: '알콘', optionType: '콘택트렌즈', productType: '콘택트렌즈', name: '토탈원 워터렌즈 30P', bundleName: '토탈원 워터렌즈', refractiveIndex: '', optionName: '토탈원 워터렌즈 30P', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 43340, status: '사용', sortOrder: 1 },
  { brandName: '알콘', optionType: '콘택트렌즈', productType: '콘택트렌즈', name: '토탈원 워터렌즈 90P', bundleName: '토탈원 워터렌즈', refractiveIndex: '', optionName: '토탈원 워터렌즈 90P', hasSph: true, hasCyl: true, hasAxis: true, hasBc: false, hasDia: false, purchasePrice: 0, sellingPrice: 112310, status: '사용', sortOrder: 2 },
]

async function main() {
  console.log('레티나 데이터 임포트 시작...')

  // 기존 데이터 삭제 (FK 순서 고려)
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
      data: {
        name: brandName,
        displayOrder: i + 1,
        isActive: true,
      }
    })
    brandMap[brandName] = brand.id
    console.log(`브랜드 생성: ${brandName} (ID: ${brand.id})`)
  }

  // 상품 생성
  let productCount = 0
  for (const product of PRODUCTS) {
    const brandId = brandMap[product.brandName]
    if (!brandId) {
      console.log(`브랜드를 찾을 수 없음: ${product.brandName}`)
      continue
    }

    await prisma.product.create({
      data: {
        brandId,
        name: product.name,
        optionType: product.optionType,
        productType: product.productType,
        bundleName: product.bundleName || null,
        erpCode: product.erpCode || null,
        refractiveIndex: product.refractiveIndex || null,
        optionName: product.optionName || null,
        hasSph: product.hasSph,
        hasCyl: product.hasCyl,
        hasAxis: product.hasAxis,
        hasBc: product.hasBc,
        hasDia: product.hasDia,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        isActive: product.status === '사용',
        displayOrder: product.sortOrder,
      }
    })
    productCount++
  }

  console.log(`상품 ${productCount}개 생성 완료`)
  console.log('레티나 데이터 임포트 완료!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
