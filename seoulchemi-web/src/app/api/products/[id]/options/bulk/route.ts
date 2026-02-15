import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 도수 옵션 일괄 등록/수정
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();
    const { options } = body;

    if (!options || !Array.isArray(options)) {
      return NextResponse.json(
        { success: false, error: '옵션 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 상품 확인
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let created = 0;
    let updated = 0;

    for (const option of options) {
      const { sph, cyl, stock, priceAdjustment, axis, barcode, location, memo } = option;

      // 기존 옵션 확인
      const existing = await prisma.productOption.findFirst({
        where: {
          productId,
          sph: sph?.toString(),
          cyl: cyl?.toString(),
          axis: axis?.toString() || null,
        },
      });

      if (existing) {
        // 업데이트
        await prisma.productOption.update({
          where: { id: existing.id },
          data: {
            stock: stock || 0,
            priceAdjustment: priceAdjustment || 0,
            barcode,
            location,
            memo,
          },
        });
        updated++;
      } else {
        // 새로 생성
        await prisma.productOption.create({
          data: {
            productId,
            sph: sph?.toString(),
            cyl: cyl?.toString(),
            axis: axis?.toString() || null,
            stock: stock || 0,
            priceAdjustment: priceAdjustment || 0,
            barcode,
            location,
            memo,
            isActive: true,
          },
        });
        created++;
      }
    }

    // 작업 로그
    await prisma.workLog.create({
      data: {
        workType: 'product_option_bulk',
        targetType: 'product',
        targetId: productId,
        description: `도수 옵션 일괄 등록: ${created}개 생성, ${updated}개 수정`,
        details: JSON.stringify({ created, updated, total: options.length }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${created}개 생성, ${updated}개 수정되었습니다.`,
      data: { created, updated, total: options.length },
    });
  } catch (error: any) {
    console.error('도수 옵션 일괄 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 특정 범위의 옵션 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const sphMin = searchParams.get('sphMin');
    const sphMax = searchParams.get('sphMax');
    const cylMin = searchParams.get('cylMin');
    const cylMax = searchParams.get('cylMax');

    const where: any = { productId };

    // SPH 범위 필터 (문자열 비교 - 숫자로 변환 필요)
    // SQLite에서는 CAST 사용이 어려우므로 전체 조회 후 필터링

    const options = await prisma.productOption.findMany({
      where,
      orderBy: [{ sph: 'asc' }, { cyl: 'asc' }],
    });

    // 범위 필터링
    let filtered = options;
    if (sphMin || sphMax || cylMin || cylMax) {
      filtered = options.filter((opt) => {
        const sph = parseFloat(opt.sph || '0');
        const cyl = parseFloat(opt.cyl || '0');

        if (sphMin && sph < parseFloat(sphMin)) return false;
        if (sphMax && sph > parseFloat(sphMax)) return false;
        if (cylMin && cyl < parseFloat(cylMin)) return false;
        if (cylMax && cyl > parseFloat(cylMax)) return false;

        return true;
      });
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch (error: any) {
    console.error('도수 옵션 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
