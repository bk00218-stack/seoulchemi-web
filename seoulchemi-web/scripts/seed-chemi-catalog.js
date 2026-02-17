const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 케미렌즈 2026 소비자 카탈로그 기반 상품 데이터 등록
 *
 * 처리 순서:
 * 1. K누진(Brand 6) 전체 삭제
 * 2. 기존 상품 비활성화 (케미2, 케미기능성5, 케미누진13, 케미매직폼14)
 * 3. ProductLine 정비
 * 4. 새 상품 등록
 */

async function main() {
  console.log('🚀 케미렌즈 2026 카탈로그 기반 시드 시작...\n');

  // ================================================
  // STEP 1: K누진(Brand 6) 전체 삭제
  // ================================================
  console.log('🗑️  K누진(Brand 6) 삭제 중...');
  try {
    // 먼저 ProductOption 삭제 (Product에 연결된)
    const kProducts = await prisma.product.findMany({ where: { brandId: 6 }, select: { id: true } });
    if (kProducts.length > 0) {
      await prisma.productOption.deleteMany({ where: { productId: { in: kProducts.map(p => p.id) } } });
    }
    await prisma.product.deleteMany({ where: { brandId: 6 } });
    await prisma.productLine.deleteMany({ where: { brandId: 6 } });
    // Brand는 다른 테이블 참조가 있을 수 있으므로 비활성화
    await prisma.brand.update({ where: { id: 6 }, data: { isActive: false } });
    console.log(`  ✅ K누진 상품 ${kProducts.length}개 삭제, 브랜드 비활성화 완료`);
  } catch (e) {
    console.log(`  ⚠️ K누진 삭제 중 오류: ${e.message}`);
  }

  // ================================================
  // STEP 2: 기존 상품 비활성화
  // ================================================
  console.log('\n🔒 기존 상품 비활성화 중...');
  for (const brandId of [2, 5, 13, 14]) {
    const result = await prisma.product.updateMany({
      where: { brandId, isActive: true },
      data: { isActive: false }
    });
    const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { name: true } });
    console.log(`  ${brand.name}(${brandId}): ${result.count}개 비활성화`);
  }

  // ================================================
  // STEP 3: ProductLine 정비 + 상품 등록
  // ================================================

  // ------ 케미누진 (Brand 13) - 누진 다초점 렌즈 ------
  console.log('\n📌 케미누진(13) - 누진 다초점 렌즈 등록...');
  await seedBrand(13, '안경렌즈 RX', [
    // ── PREMIUM (프리미엄) ──
    { lineName: '프리미엄 누진', lineCode: 'PREMIUM', products: [
      // 에스티 (MF-ST)
      { name: '에스티 1.50 일반', code: 'ST-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 650000, purchasePrice: 0 },
      { name: '에스티 1.56 일반', code: 'ST-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 750000, purchasePrice: 0 },
      { name: '에스티 1.56 PUV', code: 'ST-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 750000, purchasePrice: 0 },
      { name: '에스티 1.60 PUV', code: 'ST-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 900000, purchasePrice: 0 },
      { name: '에스티 1.67 PUV', code: 'ST-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 1000000, purchasePrice: 0 },
      { name: '에스티 1.74 PUV', code: 'ST-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 1300000, purchasePrice: 0 },
      // 엑스티 (MF-XT)
      { name: '엑스티 1.50 일반', code: 'XT-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 450000, purchasePrice: 0 },
      { name: '엑스티 1.56 일반', code: 'XT-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 550000, purchasePrice: 0 },
      { name: '엑스티 1.56 PUV', code: 'XT-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 550000, purchasePrice: 0 },
      { name: '엑스티 1.60 PUV', code: 'XT-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 700000, purchasePrice: 0 },
      { name: '엑스티 1.67 PUV', code: 'XT-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 800000, purchasePrice: 0 },
      { name: '엑스티 1.74 PUV', code: 'XT-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 1050000, purchasePrice: 0 },
      // 모바일 (MF-MOBILE)
      { name: '모바일 1.50 일반', code: 'MM-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 350000, purchasePrice: 0 },
      { name: '모바일 1.56 일반', code: 'MM-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 400000, purchasePrice: 0 },
      { name: '모바일 1.56 PUV', code: 'MM-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 400000, purchasePrice: 0 },
      { name: '모바일 1.60 PUV', code: 'MM-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 500000, purchasePrice: 0 },
      { name: '모바일 1.67 PUV', code: 'MM-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 650000, purchasePrice: 0 },
      { name: '모바일 1.74 PUV', code: 'MM-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 800000, purchasePrice: 0 },
    ]},

    // ── LUXURY (고급형) ──
    { lineName: '고급형 누진', lineCode: 'LUXURY', products: [
      // 아웃도어 (MF-OD)
      { name: '아웃도어 1.50 일반', code: 'OD-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 320000, purchasePrice: 0 },
      { name: '아웃도어 1.56 일반', code: 'OD-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 350000, purchasePrice: 0 },
      { name: '아웃도어 1.56 PUV', code: 'OD-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 350000, purchasePrice: 0 },
      { name: '아웃도어 1.60 PUV', code: 'OD-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 410000, purchasePrice: 0 },
      { name: '아웃도어 1.67 PUV', code: 'OD-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 520000, purchasePrice: 0 },
      { name: '아웃도어 1.74 PUV', code: 'OD-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 690000, purchasePrice: 0 },
      // 프리미엄 (MF-CP)
      { name: '프리미엄 1.50 일반', code: 'CP-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 290000, purchasePrice: 0 },
      { name: '프리미엄 1.56 일반', code: 'CP-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 320000, purchasePrice: 0 },
      { name: '프리미엄 1.56 PUV', code: 'CP-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 320000, purchasePrice: 0 },
      { name: '프리미엄 1.60 PUV', code: 'CP-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 380000, purchasePrice: 0 },
      { name: '프리미엄 1.67 PUV', code: 'CP-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 480000, purchasePrice: 0 },
      { name: '프리미엄 1.74 PUV', code: 'CP-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 670000, purchasePrice: 0 },
      // 디지털소프트 (MF-CDS)
      { name: '디지털소프트 1.50 일반', code: 'CDS-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 280000, purchasePrice: 0 },
      { name: '디지털소프트 1.56 일반', code: 'CDS-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 290000, purchasePrice: 0 },
      { name: '디지털소프트 1.56 PUV', code: 'CDS-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 290000, purchasePrice: 0 },
      { name: '디지털소프트 1.60 PUV', code: 'CDS-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 360000, purchasePrice: 0 },
      { name: '디지털소프트 1.67 PUV', code: 'CDS-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 460000, purchasePrice: 0 },
      { name: '디지털소프트 1.74 PUV', code: 'CDS-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 640000, purchasePrice: 0 },
      // 스타일 (MF-AS)
      { name: '스타일 1.50 일반', code: 'AS-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 280000, purchasePrice: 0 },
      { name: '스타일 1.56 일반', code: 'AS-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 280000, purchasePrice: 0 },
      { name: '스타일 1.56 PUV', code: 'AS-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 280000, purchasePrice: 0 },
      { name: '스타일 1.60 PUV', code: 'AS-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 350000, purchasePrice: 0 },
      { name: '스타일 1.67 PUV', code: 'AS-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 440000, purchasePrice: 0 },
      // 디지털 (MF-CD)
      { name: '디지털 1.50 일반', code: 'CD-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 260000, purchasePrice: 0 },
      { name: '디지털 1.56 일반', code: 'CD-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 270000, purchasePrice: 0 },
      { name: '디지털 1.56 PUV', code: 'CD-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 270000, purchasePrice: 0 },
      { name: '디지털 1.60 PUV', code: 'CD-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 330000, purchasePrice: 0 },
      { name: '디지털 1.67 PUV', code: 'CD-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 430000, purchasePrice: 0 },
      { name: '디지털 1.74 PUV', code: 'CD-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 600000, purchasePrice: 0 },
    ]},

    // ── STANDARD (표준형) ──
    { lineName: '표준형 누진', lineCode: 'STANDARD', products: [
      // 베이직 (MF-CB)
      { name: '베이직 1.50 일반', code: 'CB-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 250000, purchasePrice: 0 },
      { name: '베이직 1.56 일반', code: 'CB-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 260000, purchasePrice: 0 },
      { name: '베이직 1.56 PUV', code: 'CB-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 260000, purchasePrice: 0 },
      { name: '베이직 1.60 PUV', code: 'CB-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 320000, purchasePrice: 0 },
      { name: '베이직 1.67 PUV', code: 'CB-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 420000, purchasePrice: 0 },
      { name: '베이직 1.74 PUV', code: 'CB-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 590000, purchasePrice: 0 },
      // 와이드 (MF-CW)
      { name: '와이드 1.50 일반', code: 'CW-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 180000, purchasePrice: 0 },
      { name: '와이드 1.56 일반', code: 'CW-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 200000, purchasePrice: 0 },
      { name: '와이드 1.56 PUV', code: 'CW-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 200000, purchasePrice: 0 },
      { name: '와이드 1.60 PUV', code: 'CW-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 280000, purchasePrice: 0 },
      { name: '와이드 1.67 PUV', code: 'CW-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 330000, purchasePrice: 0 },
      // 애니원 (MF-CA)
      { name: '애니원 1.50 일반', code: 'CA-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 170000, purchasePrice: 0 },
      { name: '애니원 1.56 일반', code: 'CA-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 190000, purchasePrice: 0 },
      { name: '애니원 1.56 PUV', code: 'CA-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 190000, purchasePrice: 0 },
      { name: '애니원 1.60 PUV', code: 'CA-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 260000, purchasePrice: 0 },
      { name: '애니원 1.67 PUV', code: 'CA-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 320000, purchasePrice: 0 },
      { name: '애니원 1.74 PUV', code: 'CA-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 410000, purchasePrice: 0 },
      // 어댑터 (MF-AD)
      { name: '어댑터 1.50 일반', code: 'AD-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 130000, purchasePrice: 0 },
      { name: '어댑터 1.56 일반', code: 'AD-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 150000, purchasePrice: 0 },
      { name: '어댑터 1.56 PUV', code: 'AD-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 150000, purchasePrice: 0 },
      { name: '어댑터 1.60 PUV', code: 'AD-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 200000, purchasePrice: 0 },
      { name: '어댑터 1.67 PUV', code: 'AD-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 250000, purchasePrice: 0 },
      { name: '어댑터 1.74 PUV', code: 'AD-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 320000, purchasePrice: 0 },
    ]},

    // ── BEGINNER (입문형) ──
    { lineName: '입문형 누진', lineCode: 'BEGINNER', products: [
      // 삼공사공 (3040)
      { name: '삼공사공 1.50 일반', code: '30-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 150000, purchasePrice: 0 },
      { name: '삼공사공 1.56 일반', code: '30-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 180000, purchasePrice: 0 },
      { name: '삼공사공 1.56 PUV', code: '30-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 180000, purchasePrice: 0 },
      { name: '삼공사공 1.60 PUV', code: '30-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 230000, purchasePrice: 0 },
      { name: '삼공사공 1.67 PUV', code: '30-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 290000, purchasePrice: 0 },
      { name: '삼공사공 1.74 PUV', code: '30-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 380000, purchasePrice: 0 },
      // 제로 (ZERO)
      { name: '제로 1.50 일반', code: 'Z-C', productType: '누진', refractiveIndex: '1.50', sellingPrice: 110000, purchasePrice: 0 },
      { name: '제로 1.56 일반', code: 'Z-M', productType: '누진', refractiveIndex: '1.56', sellingPrice: 130000, purchasePrice: 0 },
      { name: '제로 1.56 PUV', code: 'Z-M-PUV', productType: '누진 PUV', refractiveIndex: '1.56', sellingPrice: 130000, purchasePrice: 0 },
      { name: '제로 1.60 PUV', code: 'Z-H-PUV', productType: '누진 PUV', refractiveIndex: '1.60', sellingPrice: 180000, purchasePrice: 0 },
      { name: '제로 1.67 PUV', code: 'Z-S-PUV', productType: '누진 PUV', refractiveIndex: '1.67', sellingPrice: 230000, purchasePrice: 0 },
      { name: '제로 1.74 PUV', code: 'Z-U-PUV', productType: '누진 PUV', refractiveIndex: '1.74', sellingPrice: 290000, purchasePrice: 0 },
    ]},
  ]);

  // ------ 케미매직폼 (Brand 14) - 기능성 디자인 렌즈 ------
  console.log('\n📌 케미매직폼(14) - 기능성 디자인 렌즈 등록...');
  await seedBrand(14, '안경렌즈 RX', [
    // ── 오피스 ──
    { lineName: '오피스', lineCode: 'OFFICE', products: [
      // 모바일오피스 (MF-MOBILE OFFICE)
      { name: '모바일오피스 1.50 일반', code: 'MO-C', productType: '오피스', refractiveIndex: '1.50', sellingPrice: 270000, purchasePrice: 0 },
      { name: '모바일오피스 1.56 일반', code: 'MO-M', productType: '오피스', refractiveIndex: '1.56', sellingPrice: 290000, purchasePrice: 0 },
      { name: '모바일오피스 1.56 PUV', code: 'MO-M-PUV', productType: '오피스 PUV', refractiveIndex: '1.56', sellingPrice: 290000, purchasePrice: 0 },
      { name: '모바일오피스 1.60 PUV', code: 'MO-H-PUV', productType: '오피스 PUV', refractiveIndex: '1.60', sellingPrice: 350000, purchasePrice: 0 },
      { name: '모바일오피스 1.67 PUV', code: 'MO-S-PUV', productType: '오피스 PUV', refractiveIndex: '1.67', sellingPrice: 450000, purchasePrice: 0 },
      { name: '모바일오피스 1.74 PUV', code: 'MO-U-PUV', productType: '오피스 PUV', refractiveIndex: '1.74', sellingPrice: 640000, purchasePrice: 0 },
      // 매직폼오피스 (MF-CO)
      { name: '매직폼오피스 1.50 일반', code: 'CO-C', productType: '오피스', refractiveIndex: '1.50', sellingPrice: 220000, purchasePrice: 0 },
      { name: '매직폼오피스 1.56 일반', code: 'CO-M', productType: '오피스', refractiveIndex: '1.56', sellingPrice: 250000, purchasePrice: 0 },
      { name: '매직폼오피스 1.56 PUV', code: 'CO-M-PUV', productType: '오피스 PUV', refractiveIndex: '1.56', sellingPrice: 250000, purchasePrice: 0 },
      { name: '매직폼오피스 1.60 PUV', code: 'CO-H-PUV', productType: '오피스 PUV', refractiveIndex: '1.60', sellingPrice: 320000, purchasePrice: 0 },
      { name: '매직폼오피스 1.67 PUV', code: 'CO-S-PUV', productType: '오피스 PUV', refractiveIndex: '1.67', sellingPrice: 420000, purchasePrice: 0 },
      { name: '매직폼오피스 1.74 PUV', code: 'CO-U-PUV', productType: '오피스 PUV', refractiveIndex: '1.74', sellingPrice: 580000, purchasePrice: 0 },
    ]},

    // ── 피로방지 ──
    { lineName: '피로방지', lineCode: 'FRESH', products: [
      // 모바일프레쉬 (MF-MOBILE FRESH)
      { name: '모바일프레쉬 1.50 일반', code: 'MBF-C', productType: '피로방지', refractiveIndex: '1.50', sellingPrice: 270000, purchasePrice: 0 },
      { name: '모바일프레쉬 1.56 일반', code: 'MBF-M', productType: '피로방지', refractiveIndex: '1.56', sellingPrice: 290000, purchasePrice: 0 },
      { name: '모바일프레쉬 1.56 PUV', code: 'MBF-M-PUV', productType: '피로방지 PUV', refractiveIndex: '1.56', sellingPrice: 290000, purchasePrice: 0 },
      { name: '모바일프레쉬 1.60 PUV', code: 'MBF-H-PUV', productType: '피로방지 PUV', refractiveIndex: '1.60', sellingPrice: 350000, purchasePrice: 0 },
      { name: '모바일프레쉬 1.67 PUV', code: 'MBF-S-PUV', productType: '피로방지 PUV', refractiveIndex: '1.67', sellingPrice: 450000, purchasePrice: 0 },
      { name: '모바일프레쉬 1.74 PUV', code: 'MBF-U-PUV', productType: '피로방지 PUV', refractiveIndex: '1.74', sellingPrice: 640000, purchasePrice: 0 },
      // 매직폼프레쉬 (MF-CF)
      { name: '매직폼프레쉬 1.50 일반', code: 'CF-C', productType: '피로방지', refractiveIndex: '1.50', sellingPrice: 220000, purchasePrice: 0 },
      { name: '매직폼프레쉬 1.56 일반', code: 'CF-M', productType: '피로방지', refractiveIndex: '1.56', sellingPrice: 250000, purchasePrice: 0 },
      { name: '매직폼프레쉬 1.56 PUV', code: 'CF-M-PUV', productType: '피로방지 PUV', refractiveIndex: '1.56', sellingPrice: 250000, purchasePrice: 0 },
      { name: '매직폼프레쉬 1.60 PUV', code: 'CF-H-PUV', productType: '피로방지 PUV', refractiveIndex: '1.60', sellingPrice: 320000, purchasePrice: 0 },
      { name: '매직폼프레쉬 1.67 PUV', code: 'CF-S-PUV', productType: '피로방지 PUV', refractiveIndex: '1.67', sellingPrice: 420000, purchasePrice: 0 },
    ]},

    // ── 키즈 ──
    { lineName: '키즈', lineCode: 'KIDS', products: [
      { name: '매직폼키즈 1.50 일반', code: 'CK-C', productType: '키즈', refractiveIndex: '1.50', sellingPrice: 320000, purchasePrice: 0 },
      { name: '매직폼키즈 1.56 일반', code: 'CK-M', productType: '키즈', refractiveIndex: '1.56', sellingPrice: 350000, purchasePrice: 0 },
      { name: '매직폼키즈 1.56 PUV', code: 'CK-M-PUV', productType: '키즈 PUV', refractiveIndex: '1.56', sellingPrice: 250000, purchasePrice: 0 },
      { name: '매직폼키즈 1.60 PUV', code: 'CK-H-PUV', productType: '키즈 PUV', refractiveIndex: '1.60', sellingPrice: 320000, purchasePrice: 0 },
    ]},

    // ── 싱글 ──
    { lineName: '싱글', lineCode: 'SINGLE', products: [
      { name: '매직폼싱글 1.50 일반', code: 'CS-C', productType: '싱글', refractiveIndex: '1.50', sellingPrice: 250000, purchasePrice: 0 },
      { name: '매직폼싱글 1.56 일반', code: 'CS-M', productType: '싱글', refractiveIndex: '1.56', sellingPrice: 260000, purchasePrice: 0 },
      { name: '매직폼싱글 1.56 PUV', code: 'CS-M-PUV', productType: '싱글 PUV', refractiveIndex: '1.56', sellingPrice: 260000, purchasePrice: 0 },
      { name: '매직폼싱글 1.60 PUV', code: 'CS-H-PUV', productType: '싱글 PUV', refractiveIndex: '1.60', sellingPrice: 300000, purchasePrice: 0 },
      { name: '매직폼싱글 1.67 PUV', code: 'CS-S-PUV', productType: '싱글 PUV', refractiveIndex: '1.67', sellingPrice: 420000, purchasePrice: 0 },
      { name: '매직폼싱글 1.74 PUV', code: 'CS-U-PUV', productType: '싱글 PUV', refractiveIndex: '1.74', sellingPrice: 500000, purchasePrice: 0 },
    ]},

    // ── 외면누진 A-ONE ──
    { lineName: '외면누진', lineCode: 'A-ONE', products: [
      { name: '에이원스타일 1.56', code: 'A1-M', productType: '외면누진', refractiveIndex: '1.56', sellingPrice: 80000, purchasePrice: 0 },
      { name: '에이원스타일 1.60', code: 'A1-H', productType: '외면누진', refractiveIndex: '1.60', sellingPrice: 120000, purchasePrice: 0 },
    ]},
  ]);

  // ------ 케미 (Brand 2) - 단초점 렌즈 (여벌) ------
  console.log('\n📌 케미(2) - 단초점 렌즈 등록...');
  await seedBrand(2, '안경렌즈 여벌', [
    // ── 구면 (SP) ──
    { lineName: '구면 (SP)', lineCode: 'SP', products: [
      { name: '1.56 SP', code: '156-SP', productType: '구면', refractiveIndex: '1.56', sellingPrice: 25000, purchasePrice: 0 },
      { name: '1.56 UV400 SP', code: '156-UV-SP', productType: '구면', refractiveIndex: '1.56', sellingPrice: 35000, purchasePrice: 0 },
      { name: '1.60 UV400 SP', code: '160-UV-SP', productType: '구면', refractiveIndex: '1.60', sellingPrice: 45000, purchasePrice: 0 },
      { name: '1.60 UV400(70mm) SP', code: '160-UV70-SP', productType: '구면', refractiveIndex: '1.60', sellingPrice: 45000, purchasePrice: 0 },
    ]},
    // ── 비구면 (ASP) ──
    { lineName: '비구면 (ASP)', lineCode: 'ASP', products: [
      { name: '1.56 CHAOS', code: '156-CHAOS', productType: '비구면', refractiveIndex: '1.56', sellingPrice: 35000, purchasePrice: 0 },
      { name: '1.60 ARGUS', code: '160-ARGUS', productType: '비구면', refractiveIndex: '1.60', sellingPrice: 75000, purchasePrice: 0 },
      { name: '1.67 ZEUS', code: '167-ZEUS', productType: '비구면', refractiveIndex: '1.67', sellingPrice: 95000, purchasePrice: 0 },
      { name: '1.67 ZEUS ATOMEGA', code: '167-ZEUS-AT', productType: '비구면', refractiveIndex: '1.67', sellingPrice: 140000, purchasePrice: 0 },
      { name: '1.74 HERA', code: '174-HERA', productType: '비구면', refractiveIndex: '1.74', sellingPrice: 150000, purchasePrice: 0 },
      { name: '1.74 HERA ATOMEGA', code: '174-HERA-AT', productType: '비구면', refractiveIndex: '1.74', sellingPrice: 230000, purchasePrice: 0 },
    ]},
  ]);

  // ------ 케미기능성 (Brand 5) - 기능성 렌즈 ------
  console.log('\n📌 케미기능성(5) - 기능성 렌즈 등록...');
  await seedBrand(5, '안경렌즈 RX', [
    // ── 디지털컬러착색 ──
    { lineName: '디지털컬러착색', lineCode: 'COLOR', products: [
      { name: '디지털컬러 1.56 기본', code: 'DC-156', productType: '착색', refractiveIndex: '1.56', sellingPrice: 110000, purchasePrice: 0 },
      { name: '디지털컬러 1.60 기본', code: 'DC-160', productType: '착색', refractiveIndex: '1.60', sellingPrice: 150000, purchasePrice: 0 },
      { name: '디지털컬러 1.56 Trendy', code: 'DC-156T', productType: '착색 Trendy', refractiveIndex: '1.56', sellingPrice: 170000, purchasePrice: 0 },
      { name: '디지털컬러 1.60 Trendy', code: 'DC-160T', productType: '착색 Trendy', refractiveIndex: '1.60', sellingPrice: 170000, purchasePrice: 0 },
      { name: '디지털컬러 스포츠 컬러렌즈', code: 'DC-SPT', productType: '착색 스포츠', refractiveIndex: '1.56', sellingPrice: 110000, purchasePrice: 0 },
    ]},

    // ── 퍼펙트UV ──
    { lineName: '퍼펙트UV', lineCode: 'PUV', products: [
      { name: '퍼펙트UV 1.56', code: 'PUV-156', productType: '퍼펙트UV', refractiveIndex: '1.56', sellingPrice: 50000, purchasePrice: 0 },
      { name: '퍼펙트UV 1.60', code: 'PUV-160', productType: '퍼펙트UV', refractiveIndex: '1.60', sellingPrice: 120000, purchasePrice: 0 },
      { name: '퍼펙트UV 1.67', code: 'PUV-167', productType: '퍼펙트UV', refractiveIndex: '1.67', sellingPrice: 0, purchasePrice: 0 },
      { name: '퍼펙트UV 1.74', code: 'PUV-174', productType: '퍼펙트UV', refractiveIndex: '1.74', sellingPrice: 170000, purchasePrice: 0 },
    ]},

    // ── D-FREE PUV ──
    { lineName: 'D-FREE PUV', lineCode: 'DFREE', products: [
      { name: 'D-FREE PUV 1.60 ASP', code: 'DF-160', productType: 'D-FREE', refractiveIndex: '1.60', sellingPrice: 0, purchasePrice: 0 },
      { name: 'D-FREE PUV 1.67 ASP', code: 'DF-167', productType: 'D-FREE', refractiveIndex: '1.67', sellingPrice: 0, purchasePrice: 0 },
      { name: 'D-FREE PUV 1.74 ASP', code: 'DF-174', productType: 'D-FREE', refractiveIndex: '1.74', sellingPrice: 0, purchasePrice: 0 },
      { name: 'D-FREE PUV CLEAR 1.74', code: 'DF-174C', productType: 'D-FREE CLEAR', refractiveIndex: '1.74', sellingPrice: 0, purchasePrice: 0 },
    ]},

    // ── 근적외선차단 (IR) ──
    { lineName: '근적외선차단 (IR)', lineCode: 'IR', products: [
      { name: 'IR 1.56 SP', code: 'IR-156SP', productType: 'IR', refractiveIndex: '1.56', sellingPrice: 0, purchasePrice: 0 },
      { name: 'IR 1.56 ASP', code: 'IR-156ASP', productType: 'IR', refractiveIndex: '1.56', sellingPrice: 0, purchasePrice: 0 },
      { name: 'IR 1.60 SP', code: 'IR-160SP', productType: 'IR', refractiveIndex: '1.60', sellingPrice: 110000, purchasePrice: 0 },
      { name: 'IR 1.60 ASP', code: 'IR-160ASP', productType: 'IR', refractiveIndex: '1.60', sellingPrice: 120000, purchasePrice: 0 },
      { name: 'IR 1.67 ASP', code: 'IR-167ASP', productType: 'IR', refractiveIndex: '1.67', sellingPrice: 230000, purchasePrice: 0 },
      { name: 'IR 1.67 ASP ATOMEGA', code: 'IR-167AT', productType: 'IR', refractiveIndex: '1.67', sellingPrice: 250000, purchasePrice: 0 },
      { name: 'IR 1.74 ASP', code: 'IR-174ASP', productType: 'IR', refractiveIndex: '1.74', sellingPrice: 300000, purchasePrice: 0 },
    ]},

    // ── X-DRIVE (운전용) ──
    { lineName: '운전용 (X-DRIVE)', lineCode: 'XDRIVE', products: [
      { name: 'X-DRIVE 1.60 SP', code: 'XD-160SP', productType: 'X-DRIVE', refractiveIndex: '1.60', sellingPrice: 130000, purchasePrice: 0 },
      { name: 'X-DRIVE 1.60 ASP', code: 'XD-160ASP', productType: 'X-DRIVE', refractiveIndex: '1.60', sellingPrice: 230000, purchasePrice: 0 },
      { name: 'X-DRIVE 1.67 ASP', code: 'XD-167ASP', productType: 'X-DRIVE', refractiveIndex: '1.67', sellingPrice: 230000, purchasePrice: 0 },
      { name: 'X-DRIVE 1.74 ASP', code: 'XD-174ASP', productType: 'X-DRIVE', refractiveIndex: '1.74', sellingPrice: 460000, purchasePrice: 0 },
    ]},

    // ── 변색 (PHOTO) ──
    { lineName: '변색', lineCode: 'PHOTO', products: [
      { name: 'PHOTO AID 1.60 ASP', code: 'PA-160', productType: '변색', refractiveIndex: '1.60', sellingPrice: 120000, purchasePrice: 0 },
      { name: 'PHOTO AID 1.67 ASP', code: 'PA-167', productType: '변색', refractiveIndex: '1.67', sellingPrice: 250000, purchasePrice: 0 },
      { name: 'PHOTO AID 1.74 ASP', code: 'PA-174', productType: '변색', refractiveIndex: '1.74', sellingPrice: 450000, purchasePrice: 0 },
      { name: 'XTRActive II 1.60 SP', code: 'XA-160', productType: '변색', refractiveIndex: '1.60', sellingPrice: 350000, purchasePrice: 0 },
      { name: 'Transitions Classic 1.56 ASP', code: 'TC-156', productType: '변색', refractiveIndex: '1.56', sellingPrice: 0, purchasePrice: 0 },
      { name: 'Transitions Classic 1.60 ASP', code: 'TC-160', productType: '변색', refractiveIndex: '1.60', sellingPrice: 0, purchasePrice: 0 },
      { name: 'ONE&ONE 1.56 ASP', code: 'OO-156ASP', productType: '변색', refractiveIndex: '1.56', sellingPrice: 80000, purchasePrice: 0 },
      { name: 'ONE&ONE 1.56 SP/RX', code: 'OO-156RX', productType: '변색', refractiveIndex: '1.56', sellingPrice: 0, purchasePrice: 0 },
    ]},

    // ── 스포츠 ──
    { lineName: '스포츠', lineCode: 'SPORTS', products: [
      { name: 'SPORTS PREMIUM', code: 'SPT-P', productType: '스포츠', refractiveIndex: '', sellingPrice: 260000, purchasePrice: 0 },
      { name: 'SPORTS PROSUMER-R', code: 'SPT-R', productType: '스포츠', refractiveIndex: '', sellingPrice: 350000, purchasePrice: 0 },
      { name: 'SPORTS EXPEDITION', code: 'SPT-E', productType: '스포츠', refractiveIndex: '', sellingPrice: 370000, purchasePrice: 0 },
    ]},

    // ── 하이커브 (TRENDY) ──
    { lineName: '하이커브 (TRENDY)', lineCode: 'TRENDY', products: [
      { name: 'TRENDY 1.56 SP', code: 'TR-156', productType: '하이커브', refractiveIndex: '1.56', sellingPrice: 80000, purchasePrice: 0 },
      { name: 'TRENDY 1.60 SP', code: 'TR-160', productType: '하이커브', refractiveIndex: '1.60', sellingPrice: 110000, purchasePrice: 0 },
      { name: 'TRENDY 1.67 SP', code: 'TR-167', productType: '하이커브', refractiveIndex: '1.67', sellingPrice: 0, purchasePrice: 0 },
    ]},

    // ── 편광 (PolarCoat) ──
    { lineName: '편광 (PolarCoat)', lineCode: 'POLAR', products: [
      { name: 'PolarCoat', code: 'PC', productType: '편광', refractiveIndex: '', sellingPrice: 200000, purchasePrice: 0 },
    ]},
  ]);

  // ================================================
  // 최종 통계
  // ================================================
  console.log('\n📊 최종 통계:');
  const brands = [2, 5, 13, 14];
  for (const brandId of brands) {
    const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { name: true } });
    const activeProducts = await prisma.product.count({ where: { brandId, isActive: true } });
    const inactiveProducts = await prisma.product.count({ where: { brandId, isActive: false } });
    const lines = await prisma.productLine.count({ where: { brandId } });
    console.log(`  ${brand.name}(${brandId}): 활성 ${activeProducts}개, 비활성 ${inactiveProducts}개, 품목 ${lines}개`);
  }

  const totalActive = await prisma.product.count({ where: { isActive: true } });
  const totalInactive = await prisma.product.count({ where: { isActive: false } });
  const totalLines = await prisma.productLine.count();
  console.log(`\n  전체: 활성 ${totalActive}개, 비활성 ${totalInactive}개, 품목 ${totalLines}개`);
  console.log('\n✅ 케미렌즈 카탈로그 시드 완료!');
}

/**
 * 브랜드에 ProductLine + Product 등록
 */
async function seedBrand(brandId, optionType, lineGroups) {
  let totalCreated = 0;

  for (const group of lineGroups) {
    // ProductLine upsert
    let productLine = await prisma.productLine.findFirst({
      where: { brandId, name: group.lineName }
    });

    if (!productLine) {
      productLine = await prisma.productLine.create({
        data: {
          brandId,
          name: group.lineName,
          code: group.lineCode,
          displayOrder: 0,
        }
      });
      console.log(`  📂 품목 생성: ${group.lineName} (${group.lineCode})`);
    } else {
      // 코드 업데이트
      if (group.lineCode && productLine.code !== group.lineCode) {
        await prisma.productLine.update({
          where: { id: productLine.id },
          data: { code: group.lineCode }
        });
      }
      console.log(`  📂 품목 기존: ${group.lineName}`);
    }

    // 상품 등록
    for (let i = 0; i < group.products.length; i++) {
      const p = group.products[i];
      try {
        await prisma.product.create({
          data: {
            brandId,
            productLineId: productLine.id,
            name: p.name,
            optionType,
            productType: p.productType,
            refractiveIndex: p.refractiveIndex || null,
            sellingPrice: p.sellingPrice,
            purchasePrice: p.purchasePrice,
            isActive: true,
            displayOrder: i,
          }
        });
        totalCreated++;
      } catch (e) {
        console.log(`    ⚠️ 상품 오류: ${p.name} - ${e.message?.substring(0, 80)}`);
      }
    }
  }

  console.log(`  ✅ ${totalCreated}개 상품 생성\n`);
}

main()
  .catch((e) => {
    console.error('❌ 시드 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
