import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 레티나에서 추출한 전체 상품 데이터
const retinaProducts = [
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K3 누진 1.56", "bundleName": "K누진", "refractiveIndex": "1.56", "sellingPrice": "24,500"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K3 누진 1.60", "bundleName": "K누진", "refractiveIndex": "1.60", "sellingPrice": "34,500"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K3 누진 1.67", "bundleName": "K누진", "refractiveIndex": "1.67", "sellingPrice": "40,000"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K3 누진 1.74", "bundleName": "K누진", "refractiveIndex": "1.74", "sellingPrice": "60,000"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K5 누진 1.56", "bundleName": "K누진", "refractiveIndex": "1.56", "sellingPrice": "31,500"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K5 누진 1.60", "bundleName": "K누진", "refractiveIndex": "1.60", "sellingPrice": "41,500"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K5 누진 1.67", "bundleName": "K누진", "refractiveIndex": "1.67", "sellingPrice": "45,000"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K5 누진 1.74", "bundleName": "K누진", "refractiveIndex": "1.74", "sellingPrice": "67,500"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K7 누진 1.56", "bundleName": "K누진", "refractiveIndex": "1.56", "sellingPrice": "35,000"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K7 누진 1.60", "bundleName": "K누진", "refractiveIndex": "1.60", "sellingPrice": "45,000"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K7 누진 1.67", "bundleName": "K누진", "refractiveIndex": "1.67", "sellingPrice": "48,500"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K7 누진 1.74", "bundleName": "K누진", "refractiveIndex": "1.74", "sellingPrice": "67,500"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K9 누진 1.56", "bundleName": "K누진", "refractiveIndex": "1.56", "sellingPrice": "43,000"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K9 누진 1.60", "bundleName": "K누진", "refractiveIndex": "1.60", "sellingPrice": "48,000"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K9 누진 1.67", "bundleName": "K누진", "refractiveIndex": "1.67", "sellingPrice": "59,000"},
  {"brand": "K누진", "optionType": "안경렌즈 RX", "productName": "K9 누진 1.74", "bundleName": "K누진", "refractiveIndex": "1.74", "sellingPrice": "83,000"},
  {"brand": "영진컬러", "optionType": "안경렌즈 여벌", "productName": "영진 그레이", "bundleName": "", "refractiveIndex": "1.56", "sellingPrice": "1,995"},
  {"brand": "영진컬러", "optionType": "안경렌즈 여벌", "productName": "영진 브라운", "bundleName": "", "refractiveIndex": "1.56", "sellingPrice": "1,995"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "UV STAR 1.56 구면 청광", "bundleName": "UV STAR 청광", "refractiveIndex": "1.56", "sellingPrice": "2,750"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "UV STAR 1.56 비구면 청광", "bundleName": "UV STAR 청광", "refractiveIndex": "1.56", "sellingPrice": "3,850"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "UV STAR 1.60 청광 원시", "bundleName": "UV STAR 청광", "refractiveIndex": "1.60", "sellingPrice": "4,500"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "UV STAR 1.67 청광 원시", "bundleName": "UV STAR 청광", "refractiveIndex": "1.67", "sellingPrice": "8,000"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[드라이브] 1.56 20%", "bundleName": "드라이브", "refractiveIndex": "1.56", "sellingPrice": "12,100"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[드라이브] 1.60 20%", "bundleName": "드라이브", "refractiveIndex": "1.60", "sellingPrice": "14,520"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[반미러] 1.60 트랜디 (블루)", "bundleName": "반밀러", "refractiveIndex": "1.60", "sellingPrice": "10,890"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[반미러] 1.60 트랜디 (실버)", "bundleName": "반밀러", "refractiveIndex": "1.60", "sellingPrice": "10,890"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[변색] 1.56 트리벤션 (B)", "bundleName": "데코 변색렌즈", "refractiveIndex": "1.56", "sellingPrice": "4,950"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[변색] 1.56 트리벤션 (G)", "bundleName": "데코 변색렌즈", "refractiveIndex": "1.56", "sellingPrice": "4,950"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[변색] 1.60 트리벤션 (B)", "bundleName": "데코 변색렌즈", "refractiveIndex": "1.60", "sellingPrice": "13,750"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[변색] 1.60 트리벤션 (G)", "bundleName": "데코 변색렌즈", "refractiveIndex": "1.60", "sellingPrice": "13,750"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[변색] 1.67 트리벤션 (G)", "bundleName": "데코 변색렌즈", "refractiveIndex": "1.67", "sellingPrice": "17,000"},
  {"brand": "데코비젼", "optionType": "안경렌즈 여벌", "productName": "[변색] 1.74 트리벤션 (G)", "bundleName": "데코 변색렌즈", "refractiveIndex": "1.74", "sellingPrice": "37,000"},
  {"brand": "바슈롬", "optionType": "콘택트렌즈", "productName": "내츄렐 브라운 (30P)", "bundleName": "네츄렐 컬러", "refractiveIndex": "", "sellingPrice": "35,200"},
  {"brand": "바슈롬", "optionType": "콘택트렌즈", "productName": "내츄렐 브라운 (90P)", "bundleName": "네츄렐 컬러", "refractiveIndex": "", "sellingPrice": "85,800"},
  {"brand": "바슈롬", "optionType": "콘택트렌즈", "productName": "내츄렐 블랙 (30P)", "bundleName": "네츄렐 컬러", "refractiveIndex": "", "sellingPrice": "35,200"},
  {"brand": "바슈롬", "optionType": "콘택트렌즈", "productName": "내츄렐 블랙 (90P)", "bundleName": "네츄렐 컬러", "refractiveIndex": "", "sellingPrice": "85,800"},
  {"brand": "바슈롬", "optionType": "콘택트렌즈", "productName": "레이셀 글리터링 그레이 (30P)", "bundleName": "레이셀 컬러 30P", "refractiveIndex": "", "sellingPrice": "33,000"},
  {"brand": "바슈롬", "optionType": "콘택트렌즈", "productName": "레이셀 디어 브라운 (30P)", "bundleName": "레이셀 컬러 30P", "refractiveIndex": "", "sellingPrice": "33,000"},
  {"brand": "아큐브", "optionType": "콘택트렌즈", "productName": "디파인 내츄럴샤인 (30P)", "bundleName": "디파인 (30P)", "refractiveIndex": "", "sellingPrice": "43,560"},
  {"brand": "아큐브", "optionType": "콘택트렌즈", "productName": "디파인 래디언트 브라이트 (30P)", "bundleName": "디파인 (30P)", "refractiveIndex": "", "sellingPrice": "43,560"},
  {"brand": "아큐브", "optionType": "콘택트렌즈", "productName": "모이스트 원데이 (30P)", "bundleName": "모이스트 원데이", "refractiveIndex": "", "sellingPrice": "27,720"},
  {"brand": "아큐브", "optionType": "콘택트렌즈", "productName": "모이스트 원데이 (90P)", "bundleName": "모이스트 원데이", "refractiveIndex": "", "sellingPrice": "72,490"},
  {"brand": "알콘", "optionType": "콘택트렌즈", "productName": "토탈원 워터렌즈 30P", "bundleName": "토탈원 워터렌즈", "refractiveIndex": "", "sellingPrice": "43,340"},
  {"brand": "알콘", "optionType": "콘택트렌즈", "productName": "토탈원 워터렌즈 90P", "bundleName": "토탈원 워터렌즈", "refractiveIndex": "", "sellingPrice": "112,310"},
  {"brand": "인터로조", "optionType": "콘택트렌즈", "productName": "클라렌 원데이 (30P)", "bundleName": "클라렌 원데이", "refractiveIndex": "", "sellingPrice": "16,500"},
  {"brand": "인터로조", "optionType": "콘택트렌즈", "productName": "클라렌 원데이 (80P)", "bundleName": "클라렌 원데이", "refractiveIndex": "", "sellingPrice": "41,800"},
  {"brand": "진광학", "optionType": "안경렌즈 여벌", "productName": "[CR유색멀티] 1.50 BA", "bundleName": "CR 컬러렌즈", "refractiveIndex": "1.50", "sellingPrice": "2,500"},
  {"brand": "진광학", "optionType": "안경렌즈 여벌", "productName": "[시장] 1.56 55파이", "bundleName": "", "refractiveIndex": "1.56", "sellingPrice": "3,000"},
  {"brand": "진명", "optionType": "안경렌즈 여벌", "productName": "[가르마 20% 청광] 1.56 SP (B)", "bundleName": "가르마 20% 청광+근적외선", "refractiveIndex": "1.56", "sellingPrice": "3,500"},
  {"brand": "진명", "optionType": "안경렌즈 여벌", "productName": "[가르마 20% 청광] 1.60 SP (B)", "bundleName": "가르마 20% 청광+근적외선", "refractiveIndex": "1.60", "sellingPrice": "5,750"},
  {"brand": "진명", "optionType": "안경렌즈 여벌", "productName": "[가르마 80%] 1.56 (BC)", "bundleName": "가르마 80% 일반커브", "refractiveIndex": "1.56", "sellingPrice": "4,500"},
  {"brand": "진명", "optionType": "안경렌즈 여벌", "productName": "[가르마 80%] 1.60 (BC)", "bundleName": "가르마 80% 일반커브", "refractiveIndex": "1.60", "sellingPrice": "6,500"},
  {"brand": "케미", "optionType": "안경렌즈 RX", "productName": "1.56 착색", "bundleName": "착색", "refractiveIndex": "1.56", "sellingPrice": "6,000"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 근적외선] 1.74", "bundleName": "근적외선IR", "refractiveIndex": "1.74", "sellingPrice": "15,000"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 근적외선] 고", "bundleName": "근적외선IR", "refractiveIndex": "1.60", "sellingPrice": "4,950"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 근적외선] 고비", "bundleName": "근적외선IR", "refractiveIndex": "1.60", "sellingPrice": "6,200"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 근적외선] 중", "bundleName": "근적외선IR", "refractiveIndex": "1.56", "sellingPrice": "3,300"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 근적외선] 중비", "bundleName": "근적외선IR", "refractiveIndex": "1.56", "sellingPrice": "4,200"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 근적외선] 초고비", "bundleName": "근적외선IR", "refractiveIndex": "1.67", "sellingPrice": "8,000"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 드라이브] 1.60 ASP", "bundleName": "X-드라이브", "refractiveIndex": "1.60", "sellingPrice": "6,500"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 드라이브] 1.67 ASP", "bundleName": "X-드라이브", "refractiveIndex": "1.67", "sellingPrice": "9,000"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 변색] GEN 8(B)", "bundleName": "케미변색", "refractiveIndex": "1.60", "sellingPrice": "42,500"},
  {"brand": "케미", "optionType": "안경렌즈 여벌", "productName": "[케미 변색] GEN 8(G)", "bundleName": "케미변색", "refractiveIndex": "1.60", "sellingPrice": "42,500"},
  {"brand": "케미기능성", "optionType": "안경렌즈 RX", "productName": "1.50 매직폼 오피스", "bundleName": "매직폼 오피스 (CO)", "refractiveIndex": "1.50", "sellingPrice": "15,700"},
  {"brand": "케미기능성", "optionType": "안경렌즈 RX", "productName": "1.56 매직폼 오피스 PUV", "bundleName": "매직폼 오피스 (CO)", "refractiveIndex": "1.56", "sellingPrice": "16,950"},
  {"brand": "케미기능성", "optionType": "안경렌즈 RX", "productName": "1.60 매직폼 오피스 PUV", "bundleName": "매직폼 오피스 (CO)", "refractiveIndex": "1.60", "sellingPrice": "22,050"},
  {"brand": "케미누진", "optionType": "안경렌즈 RX", "productName": "1.50 3040", "bundleName": "케미누진 삼공사공 (3040)", "refractiveIndex": "1.50", "sellingPrice": "18,000"},
  {"brand": "케미누진", "optionType": "안경렌즈 RX", "productName": "1.50 매직폼 싱글", "bundleName": "매직폼 싱글 (CS)", "refractiveIndex": "1.50", "sellingPrice": "21,000"},
  {"brand": "케미누진", "optionType": "안경렌즈 RX", "productName": "1.56 3040 PUV", "bundleName": "케미누진 삼공사공 (3040)", "refractiveIndex": "1.56", "sellingPrice": "20,500"},
  {"brand": "케미누진", "optionType": "안경렌즈 RX", "productName": "1.60 매직폼 싱글 PUV", "bundleName": "매직폼 싱글 (CS)", "refractiveIndex": "1.60", "sellingPrice": "22,000"},
  {"brand": "케미누진", "optionType": "안경렌즈 RX", "productName": "1.60 3040 PUV", "bundleName": "케미누진 삼공사공 (3040)", "refractiveIndex": "1.60", "sellingPrice": "24,000"},
  {"brand": "케미누진", "optionType": "안경렌즈 RX", "productName": "1.67 3040 PUV", "bundleName": "케미누진 삼공사공 (3040)", "refractiveIndex": "1.67", "sellingPrice": "33,550"},
  {"brand": "케미매직폼", "optionType": "안경렌즈 RX", "productName": "1.50 MF-디지털", "bundleName": "매직폼 디지털 (CD)", "refractiveIndex": "1.50", "sellingPrice": "21,450"},
  {"brand": "케미매직폼", "optionType": "안경렌즈 RX", "productName": "1.50 MF-베이직", "bundleName": "매직폼 베이직 (CB)", "refractiveIndex": "1.50", "sellingPrice": "21,450"},
  {"brand": "케미매직폼", "optionType": "안경렌즈 RX", "productName": "1.56 MF-디지털 PUV", "bundleName": "매직폼 디지털 (CD)", "refractiveIndex": "1.56", "sellingPrice": "22,600"},
  {"brand": "쿠퍼비전", "optionType": "콘택트렌즈", "productName": "마이데이 원데이 (30P)", "bundleName": "마이데이", "refractiveIndex": "", "sellingPrice": "30,030"},
  {"brand": "쿠퍼비전", "optionType": "콘택트렌즈", "productName": "마이데이 원데이 (90P)", "bundleName": "마이데이", "refractiveIndex": "", "sellingPrice": "75,900"},
  {"brand": "쿠퍼비전", "optionType": "콘택트렌즈", "productName": "클래리티 원데이 (30P)", "bundleName": "클래리티", "refractiveIndex": "", "sellingPrice": "24,970"},
  {"brand": "하이텍", "optionType": "안경렌즈 여벌", "productName": "[아이렌] 중", "bundleName": "아이렌 일반", "refractiveIndex": "1.56", "sellingPrice": "1,450"},
  {"brand": "하이텍", "optionType": "안경렌즈 여벌", "productName": "[아이렌] 1.60", "bundleName": "아이렌 일반", "refractiveIndex": "1.60", "sellingPrice": "2,900"},
  {"brand": "하이텍", "optionType": "안경렌즈 여벌", "productName": "[아이렌퍼펙트] 중", "bundleName": "아이렌 청광", "refractiveIndex": "1.56", "sellingPrice": "2,400"},
  {"brand": "하이텍", "optionType": "안경렌즈 여벌", "productName": "[아이렌퍼펙트] 고", "bundleName": "아이렌 청광", "refractiveIndex": "1.60", "sellingPrice": "3,250"},
  {"brand": "하이텍", "optionType": "안경렌즈 여벌", "productName": "[아이렌퍼펙트] 초고비", "bundleName": "아이렌 청광", "refractiveIndex": "1.67", "sellingPrice": "5,500"},
  {"brand": "하이텍", "optionType": "안경렌즈 여벌", "productName": "하이텍 [근적외선] 1.56 SP", "bundleName": "근적외선", "refractiveIndex": "1.56", "sellingPrice": "3,000"},
  {"brand": "하이텍", "optionType": "안경렌즈 여벌", "productName": "하이텍 [근적외선] 1.60 APS", "bundleName": "근적외선", "refractiveIndex": "1.60", "sellingPrice": "4,400"}
]

function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/,/g, '')) || 0
}

async function main() {
  console.log('🚀 레티나 상품 데이터 임포트 시작...')
  
  // 1. 기존 데이터 삭제
  await prisma.product.deleteMany()
  await prisma.brand.deleteMany()
  console.log('✅ 기존 데이터 삭제 완료')

  // 2. 브랜드 추출 및 생성
  const brandNames = [...new Set(retinaProducts.map(p => p.brand))]
  console.log(`📦 ${brandNames.length}개 브랜드 생성 중...`)
  
  const brandMap = new Map<string, number>()
  for (const name of brandNames) {
    const brand = await prisma.brand.create({
      data: { name, isActive: true }
    })
    brandMap.set(name, brand.id)
  }
  console.log('✅ 브랜드 생성 완료')

  // 3. 상품 생성
  console.log(`📦 ${retinaProducts.length}개 상품 생성 중...`)
  let count = 0
  for (const p of retinaProducts) {
    const brandId = brandMap.get(p.brand)
    if (!brandId) continue

    await prisma.product.create({
      data: {
        brandId,
        name: p.productName,
        optionType: p.optionType,
        productType: p.optionType,
        bundleName: p.bundleName || null,
        refractiveIndex: p.refractiveIndex || null,
        sellingPrice: parsePrice(p.sellingPrice),
        isActive: true
      }
    })
    count++
  }
  console.log(`✅ ${count}개 상품 생성 완료`)

  // 4. 결과 확인
  const totalBrands = await prisma.brand.count()
  const totalProducts = await prisma.product.count()
  console.log('')
  console.log('📊 임포트 결과:')
  console.log(`   - 브랜드: ${totalBrands}개`)
  console.log(`   - 상품: ${totalProducts}개`)
  console.log('')
  console.log('🎉 레티나 데이터 임포트 완료!')
}

main()
  .catch(e => {
    console.error('❌ 에러:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
