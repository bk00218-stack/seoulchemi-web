const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 안경렌즈 RX 브랜드 (에실로, 호야, 니콘, 자이스, 대명) 상품 + 품목 등록
 * 콘택트렌즈 알콘 상품 추가
 * 기존 브랜드에 품목(ProductLine) 구조 추가
 */

async function main() {
  console.log('🚀 상품 시드 시작...\n');

  // ========================================
  // 1. 에실로 (Essilor) - brandId: 20
  // ========================================
  console.log('📌 에실로 상품 등록...');
  const essilorLines = [
    { name: '바리락스 (누진)', products: [
      { name: '바리락스 컴포트 맥스 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 280000, purchasePrice: 168000 },
      { name: '바리락스 컴포트 맥스 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 350000, purchasePrice: 210000 },
      { name: '바리락스 피지오 3.0 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 380000, purchasePrice: 228000 },
      { name: '바리락스 피지오 3.0 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 450000, purchasePrice: 270000 },
      { name: '바리락스 XR 시리즈 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 520000, purchasePrice: 312000 },
      { name: '바리락스 XR 시리즈 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 600000, purchasePrice: 360000 },
    ]},
    { name: '에시로 (단초점)', products: [
      { name: '에시로 단초점 1.56', productType: '단초점', refractiveIndex: '1.56', sellingPrice: 60000, purchasePrice: 36000 },
      { name: '에시로 단초점 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 80000, purchasePrice: 48000 },
      { name: '에시로 단초점 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 120000, purchasePrice: 72000 },
      { name: '에시로 단초점 1.74', productType: '단초점', refractiveIndex: '1.74', sellingPrice: 200000, purchasePrice: 120000 },
    ]},
    { name: '아이젠 (중근용)', products: [
      { name: '아이젠 중근용 1.60', productType: '중근용', refractiveIndex: '1.60', sellingPrice: 180000, purchasePrice: 108000 },
      { name: '아이젠 중근용 1.67', productType: '중근용', refractiveIndex: '1.67', sellingPrice: 250000, purchasePrice: 150000 },
    ]},
    { name: '크리잘 코팅', products: [
      { name: '크리잘 사파이어 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 120000, purchasePrice: 72000 },
      { name: '크리잘 사파이어 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 160000, purchasePrice: 96000 },
      { name: '크리잘 프리벤시아 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 140000, purchasePrice: 84000 },
      { name: '크리잘 프리벤시아 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 180000, purchasePrice: 108000 },
    ]},
  ];
  await seedBrandProducts(20, essilorLines);

  // ========================================
  // 2. 호야 (HOYA) - brandId: 21
  // ========================================
  console.log('📌 호야 상품 등록...');
  const hoyaLines = [
    { name: '호야룩스 (누진)', products: [
      { name: '호야룩스 iD 마이스타일 V+ 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 350000, purchasePrice: 210000 },
      { name: '호야룩스 iD 마이스타일 V+ 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 420000, purchasePrice: 252000 },
      { name: '호야룩스 iD 라이프스타일 3 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 280000, purchasePrice: 168000 },
      { name: '호야룩스 iD 라이프스타일 3 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 350000, purchasePrice: 210000 },
      { name: '호야룩스 웰나 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 200000, purchasePrice: 120000 },
      { name: '호야룩스 웰나 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 280000, purchasePrice: 168000 },
    ]},
    { name: '뉴럭스 (단초점)', products: [
      { name: '뉴럭스 단초점 1.50', productType: '단초점', refractiveIndex: '1.50', sellingPrice: 45000, purchasePrice: 27000 },
      { name: '뉴럭스 단초점 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 70000, purchasePrice: 42000 },
      { name: '뉴럭스 단초점 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 110000, purchasePrice: 66000 },
      { name: '뉴럭스 단초점 1.74', productType: '단초점', refractiveIndex: '1.74', sellingPrice: 180000, purchasePrice: 108000 },
    ]},
    { name: '시티 (중근용)', products: [
      { name: '호야 시티 중근용 1.60', productType: '중근용', refractiveIndex: '1.60', sellingPrice: 160000, purchasePrice: 96000 },
      { name: '호야 시티 중근용 1.67', productType: '중근용', refractiveIndex: '1.67', sellingPrice: 220000, purchasePrice: 132000 },
    ]},
    { name: '블루컨트롤 (기능성)', products: [
      { name: '호야 블루컨트롤 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 100000, purchasePrice: 60000 },
      { name: '호야 블루컨트롤 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 140000, purchasePrice: 84000 },
      { name: '호야 센시티(변색) 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 150000, purchasePrice: 90000 },
      { name: '호야 센시티(변색) 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 200000, purchasePrice: 120000 },
    ]},
  ];
  await seedBrandProducts(21, hoyaLines);

  // ========================================
  // 3. 자이스 (ZEISS) - brandId: 22
  // ========================================
  console.log('📌 자이스 상품 등록...');
  const zeissLines = [
    { name: '프로그레시브 (누진)', products: [
      { name: '자이스 프로그레시브 인디비주얼 2 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 500000, purchasePrice: 300000 },
      { name: '자이스 프로그레시브 인디비주얼 2 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 600000, purchasePrice: 360000 },
      { name: '자이스 프로그레시브 플러스 2 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 350000, purchasePrice: 210000 },
      { name: '자이스 프로그레시브 플러스 2 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 420000, purchasePrice: 252000 },
      { name: '자이스 프로그레시브 퓨어 2 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 250000, purchasePrice: 150000 },
      { name: '자이스 프로그레시브 퓨어 2 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 320000, purchasePrice: 192000 },
    ]},
    { name: '클리어뷰 (단초점)', products: [
      { name: '자이스 클리어뷰 단초점 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 90000, purchasePrice: 54000 },
      { name: '자이스 클리어뷰 단초점 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 130000, purchasePrice: 78000 },
      { name: '자이스 클리어뷰 단초점 1.74', productType: '단초점', refractiveIndex: '1.74', sellingPrice: 220000, purchasePrice: 132000 },
    ]},
    { name: '오피스 (중근용)', products: [
      { name: '자이스 오피스렌즈 북 1.60', productType: '중근용', refractiveIndex: '1.60', sellingPrice: 200000, purchasePrice: 120000 },
      { name: '자이스 오피스렌즈 북 1.67', productType: '중근용', refractiveIndex: '1.67', sellingPrice: 280000, purchasePrice: 168000 },
    ]},
    { name: '듀라비전 코팅', products: [
      { name: '자이스 듀라비전 플래티넘 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 140000, purchasePrice: 84000 },
      { name: '자이스 듀라비전 블루프로텍트 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 120000, purchasePrice: 72000 },
      { name: '자이스 포토퓨전(변색) 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 180000, purchasePrice: 108000 },
    ]},
  ];
  await seedBrandProducts(22, zeissLines);

  // ========================================
  // 4. 니콘 (Nikon) - brandId: 23
  // ========================================
  console.log('📌 니콘 상품 등록...');
  const nikonLines = [
    { name: '프레지오 (누진)', products: [
      { name: '니콘 프레지오 파워 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 280000, purchasePrice: 168000 },
      { name: '니콘 프레지오 파워 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 350000, purchasePrice: 210000 },
      { name: '니콘 프레지오 마스터 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 380000, purchasePrice: 228000 },
      { name: '니콘 프레지오 마스터 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 450000, purchasePrice: 270000 },
    ]},
    { name: '라이트 (단초점)', products: [
      { name: '니콘 라이트 단초점 1.56', productType: '단초점', refractiveIndex: '1.56', sellingPrice: 55000, purchasePrice: 33000 },
      { name: '니콘 라이트 단초점 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 75000, purchasePrice: 45000 },
      { name: '니콘 라이트 단초점 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 115000, purchasePrice: 69000 },
      { name: '니콘 라이트 단초점 1.74', productType: '단초점', refractiveIndex: '1.74', sellingPrice: 190000, purchasePrice: 114000 },
    ]},
    { name: '온라인 (중근용)', products: [
      { name: '니콘 온라인 중근용 1.60', productType: '중근용', refractiveIndex: '1.60', sellingPrice: 170000, purchasePrice: 102000 },
      { name: '니콘 온라인 중근용 1.67', productType: '중근용', refractiveIndex: '1.67', sellingPrice: 230000, purchasePrice: 138000 },
    ]},
    { name: '씨코트 (기능성)', products: [
      { name: '니콘 씨코트 블루 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 100000, purchasePrice: 60000 },
      { name: '니콘 씨코트 블루 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 140000, purchasePrice: 84000 },
      { name: '니콘 트랜지션스(변색) 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 150000, purchasePrice: 90000 },
    ]},
  ];
  await seedBrandProducts(23, nikonLines);

  // ========================================
  // 5. 대명 - brandId: 19
  // ========================================
  console.log('📌 대명 상품 등록...');
  const daemyungLines = [
    { name: '대명 누진', products: [
      { name: '대명 누진 밸류 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 150000, purchasePrice: 90000 },
      { name: '대명 누진 밸류 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 200000, purchasePrice: 120000 },
      { name: '대명 누진 프리미엄 1.60', productType: '누진', refractiveIndex: '1.60', sellingPrice: 220000, purchasePrice: 132000 },
      { name: '대명 누진 프리미엄 1.67', productType: '누진', refractiveIndex: '1.67', sellingPrice: 280000, purchasePrice: 168000 },
    ]},
    { name: '대명 단초점', products: [
      { name: '대명 단초점 1.56', productType: '단초점', refractiveIndex: '1.56', sellingPrice: 40000, purchasePrice: 24000 },
      { name: '대명 단초점 1.60', productType: '단초점', refractiveIndex: '1.60', sellingPrice: 55000, purchasePrice: 33000 },
      { name: '대명 단초점 1.67', productType: '단초점', refractiveIndex: '1.67', sellingPrice: 80000, purchasePrice: 48000 },
      { name: '대명 단초점 1.74', productType: '단초점', refractiveIndex: '1.74', sellingPrice: 140000, purchasePrice: 84000 },
    ]},
    { name: '대명 중근용', products: [
      { name: '대명 중근용 1.60', productType: '중근용', refractiveIndex: '1.60', sellingPrice: 120000, purchasePrice: 72000 },
      { name: '대명 중근용 1.67', productType: '중근용', refractiveIndex: '1.67', sellingPrice: 170000, purchasePrice: 102000 },
    ]},
  ];
  await seedBrandProducts(19, daemyungLines);

  // ========================================
  // 6. 알콘 (Alcon) 콘택트렌즈 추가 - brandId: 10
  // ========================================
  console.log('📌 알콘 콘택트렌즈 추가...');
  const alconLines = [
    { name: '데일리스 (1일용)', products: [
      { name: '데일리스 토탈원 (30매)', productType: '1일용', refractiveIndex: null, sellingPrice: 42000, purchasePrice: 28000 },
      { name: '데일리스 토탈원 (90매)', productType: '1일용', refractiveIndex: null, sellingPrice: 110000, purchasePrice: 73000 },
      { name: '데일리스 토탈원 난시용 (30매)', productType: '1일용 난시', refractiveIndex: null, sellingPrice: 48000, purchasePrice: 32000 },
      { name: '데일리스 아쿠아컴포트 플러스 (30매)', productType: '1일용', refractiveIndex: null, sellingPrice: 25000, purchasePrice: 17000 },
      { name: '데일리스 아쿠아컴포트 플러스 (90매)', productType: '1일용', refractiveIndex: null, sellingPrice: 65000, purchasePrice: 43000 },
      { name: '프리시전1 (30매)', productType: '1일용', refractiveIndex: null, sellingPrice: 30000, purchasePrice: 20000 },
      { name: '프리시전1 (90매)', productType: '1일용', refractiveIndex: null, sellingPrice: 78000, purchasePrice: 52000 },
    ]},
    { name: '에어옵틱스 (2주용/월용)', products: [
      { name: '에어옵틱스 플러스 하이드라글라이드 (6매)', productType: '월용', refractiveIndex: null, sellingPrice: 35000, purchasePrice: 23000 },
      { name: '에어옵틱스 플러스 하이드라글라이드 난시용 (6매)', productType: '월용 난시', refractiveIndex: null, sellingPrice: 40000, purchasePrice: 27000 },
      { name: '에어옵틱스 컬러즈 (2매)', productType: '월용 컬러', refractiveIndex: null, sellingPrice: 28000, purchasePrice: 19000 },
      { name: '토탈30 (6매)', productType: '월용', refractiveIndex: null, sellingPrice: 38000, purchasePrice: 25000 },
    ]},
  ];
  await seedBrandProductsContact(10, alconLines);

  // ========================================
  // 7. 기존 브랜드에 품목(ProductLine) 구조 추가
  // ========================================
  console.log('\n📌 기존 브랜드 품목 구조 생성...');

  // 케미 (brandId: 2) - 여벌
  await createProductLines(2, ['단초점 여벌', '블루라이트차단', '착색렌즈', '변색렌즈']);

  // 데코비젼 (brandId: 1) - 여벌
  await createProductLines(1, ['단초점 여벌', '특수렌즈']);

  // 하이텍 (brandId: 3) - 여벌
  await createProductLines(3, ['단초점 여벌', '기능성']);

  // 진명 (brandId: 4) - 여벌
  await createProductLines(4, ['단초점 여벌']);

  // 인터로조 (brandId: 11) - 콘택트
  await createProductLines(11, ['클리어 1일용', '클리어 2주용', '컬러렌즈']);

  // 아큐브 (brandId: 9) - 콘택트
  await createProductLines(9, ['오아시스 라인', '모이스트 라인', '트루아이']);

  // 쿠퍼비전 (brandId: 15) - 콘택트
  await createProductLines(15, ['마이데이', '바이오피니티', '클라리티']);

  // 바슈롬 (brandId: 8) - 콘택트
  await createProductLines(8, ['울트라', '소프렌즈', '바이오트루']);

  // 케미누진 (brandId: 13) - RX
  await createProductLines(13, ['케미 누진 밸류', '케미 누진 프리미엄']);

  // 케미기능성 (brandId: 5) - RX
  await createProductLines(5, ['블루라이트차단 RX', '근적외선차단 RX', '변색 RX']);

  console.log('\n✅ 상품 시드 완료!');

  // 최종 통계
  const totalProducts = await prisma.product.count();
  const totalLines = await prisma.productLine.count();
  console.log(`총 상품: ${totalProducts}개, 총 품목: ${totalLines}개`);
}

async function seedBrandProducts(brandId, lineGroups) {
  let totalCreated = 0;

  for (const group of lineGroups) {
    // 품목(ProductLine) 생성
    let productLine;
    try {
      productLine = await prisma.productLine.create({
        data: {
          brandId,
          name: group.name,
          displayOrder: 0,
        }
      });
    } catch (e) {
      // 이미 있을 수 있음
      productLine = await prisma.productLine.findFirst({
        where: { brandId, name: group.name }
      });
      if (!productLine) {
        console.log(`  ⚠️ 품목 생성 실패: ${group.name}`, e.message);
        continue;
      }
    }

    // 상품 생성
    for (let i = 0; i < group.products.length; i++) {
      const p = group.products[i];
      try {
        await prisma.product.create({
          data: {
            brandId,
            productLineId: productLine.id,
            name: p.name,
            optionType: '안경렌즈 RX',
            productType: p.productType,
            refractiveIndex: p.refractiveIndex,
            sellingPrice: p.sellingPrice,
            purchasePrice: p.purchasePrice,
            isActive: true,
            displayOrder: i,
          }
        });
        totalCreated++;
      } catch (e) {
        console.log(`  ⚠️ 상품 중복/오류: ${p.name}`, e.message?.substring(0, 50));
      }
    }
  }

  console.log(`  ✅ ${totalCreated}개 상품 생성`);
}

async function seedBrandProductsContact(brandId, lineGroups) {
  let totalCreated = 0;

  for (const group of lineGroups) {
    let productLine;
    try {
      productLine = await prisma.productLine.create({
        data: { brandId, name: group.name, displayOrder: 0 }
      });
    } catch (e) {
      productLine = await prisma.productLine.findFirst({
        where: { brandId, name: group.name }
      });
      if (!productLine) continue;
    }

    for (let i = 0; i < group.products.length; i++) {
      const p = group.products[i];
      try {
        await prisma.product.create({
          data: {
            brandId,
            productLineId: productLine.id,
            name: p.name,
            optionType: '콘택트렌즈',
            productType: p.productType,
            refractiveIndex: p.refractiveIndex,
            sellingPrice: p.sellingPrice,
            purchasePrice: p.purchasePrice,
            isActive: true,
            displayOrder: i,
          }
        });
        totalCreated++;
      } catch (e) {
        console.log(`  ⚠️ 상품 중복/오류: ${p.name}`, e.message?.substring(0, 50));
      }
    }
  }
  console.log(`  ✅ ${totalCreated}개 콘택트렌즈 상품 생성`);
}

async function createProductLines(brandId, names) {
  for (let i = 0; i < names.length; i++) {
    try {
      await prisma.productLine.create({
        data: {
          brandId,
          name: names[i],
          displayOrder: i,
        }
      });
    } catch (e) {
      // 이미 있으면 건너뜀
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
