import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 상품 옵션 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    const options = await prisma.productOption.findMany({
      where: { productId },
      orderBy: [{ sph: 'asc' }, { cyl: 'asc' }, { axis: 'asc' }],
    });

    return NextResponse.json({ success: true, data: options });
  } catch (error: any) {
    console.error('상품 옵션 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 상품 옵션 단건 등록
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();

    const option = await prisma.productOption.create({
      data: {
        productId,
        sph: body.sph?.toString(),
        cyl: body.cyl?.toString(),
        axis: body.axis?.toString(),
        optionName: body.optionName,
        stock: body.stock || 0,
        priceAdjustment: body.priceAdjustment || 0,
        barcode: body.barcode,
        location: body.location,
        memo: body.memo,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({
      success: true,
      data: option,
      message: '옵션이 등록되었습니다.',
    });
  } catch (error: any) {
    console.error('상품 옵션 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// 상품 옵션 전체 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    const result = await prisma.productOption.deleteMany({
      where: { productId },
    });

    return NextResponse.json({
      success: true,
      message: `${result.count}개 옵션이 삭제되었습니다.`,
    });
  } catch (error: any) {
    console.error('상품 옵션 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
