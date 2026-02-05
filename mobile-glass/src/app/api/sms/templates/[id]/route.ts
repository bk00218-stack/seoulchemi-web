import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// SMS 템플릿 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const template = await prisma.smsTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  } catch (error: any) {
    console.error('SMS 템플릿 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// SMS 템플릿 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();

    const template = await prisma.smsTemplate.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: '템플릿이 수정되었습니다.',
    });
  } catch (error: any) {
    console.error('SMS 템플릿 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// SMS 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    await prisma.smsTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '템플릿이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('SMS 템플릿 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
