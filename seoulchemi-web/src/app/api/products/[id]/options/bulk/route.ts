import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 도수 옵션 일괄 등록/수정 (배치 처리 최적화)
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

    // 기존 옵션 전체를 한 번에 조회 (N+1 방지)
    const existingOptions = await prisma.productOption.findMany({
      where: { productId },
      select: { id: true, sph: true, cyl: true, axis: true, stock: true, stockType: true, priceAdjustment: true, barcode: true, location: true, memo: true },
    });

    // "sph,cyl,axis" 키로 맵 생성
    const existingMap = new Map(
      existingOptions.map(o => [
        `${o.sph || ''},${o.cyl || ''},${o.axis || ''}`,
        o
      ])
    );

    // 신규 생성 / 업데이트 분류
    const toCreate: typeof options = [];
    const toUpdate: { id: number; data: Record<string, any> }[] = [];

    for (const option of options) {
      const { sph, cyl, stock, stockType, priceAdjustment, axis, barcode, location, memo } = option;
      const key = `${sph?.toString() || ''},${cyl?.toString() || ''},${axis?.toString() || ''}`;
      const existing = existingMap.get(key);

      if (existing) {
        toUpdate.push({
          id: existing.id,
          data: {
            stock: stock ?? existing.stock,
            stockType: stockType || existing.stockType || 'local',
            priceAdjustment: priceAdjustment ?? existing.priceAdjustment,
            barcode: barcode ?? existing.barcode,
            location: location ?? existing.location,
            memo: memo ?? existing.memo,
          },
        });
      } else {
        toCreate.push({
          productId,
          sph: sph?.toString(),
          cyl: cyl?.toString(),
          axis: axis?.toString() || null,
          stock: stock || 0,
          stockType: stockType || 'local',
          priceAdjustment: priceAdjustment || 0,
          barcode,
          location,
          memo,
          isActive: true,
        });
      }
    }

    let created = 0;
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      // 배치 생성 (단일 쿼리)
      if (toCreate.length > 0) {
        const result = await tx.productOption.createMany({
          data: toCreate,
        });
        created = result.count;
      }

      // 업데이트: priceAdjustment 기준으로 그룹핑하여 updateMany
      if (toUpdate.length > 0) {
        // 동일한 데이터로 업데이트할 수 있는 건 그룹핑
        const priceGroups = new Map<number, number[]>();
        for (const item of toUpdate) {
          const price = item.data.priceAdjustment ?? 0;
          const ids = priceGroups.get(price) || [];
          ids.push(item.id);
          priceGroups.set(price, ids);
        }

        for (const [price, ids] of priceGroups) {
          await tx.productOption.updateMany({
            where: { id: { in: ids }, productId },
            data: { priceAdjustment: price },
          });
        }
        updated = toUpdate.length;
      }
    });

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
