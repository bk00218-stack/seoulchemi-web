import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// RX 검수 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const inspection = await prisma.rxInspection.findUnique({
      where: { id },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: '검수 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: inspection });
  } catch (error: any) {
    console.error('RX 검수 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// RX 검수 상태 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { status, failReason, reprocessMemo, inspectedBy } = body;

    const existing = await prisma.rxInspection.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '검수 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      inspectedBy,
      inspectedAt: new Date(),
    };

    if (status === 'failed') {
      updateData.failReason = failReason;
    }

    if (status === 'reprocess') {
      updateData.reprocessCount = existing.reprocessCount + 1;
      updateData.reprocessMemo = reprocessMemo;
    }

    const inspection = await prisma.rxInspection.update({
      where: { id },
      data: updateData,
    });

    // 작업 로그 기록
    const statusLabel: Record<string, string> = {
      passed: '합격',
      failed: '불합격',
      reprocess: '재가공',
    };

    await prisma.workLog.create({
      data: {
        workType: 'rx_inspection_update',
        targetType: 'order',
        targetId: existing.orderId,
        targetNo: existing.orderNo,
        description: `RX 검수 상태 변경: ${statusLabel[status] || status}`,
        details: JSON.stringify({ status, failReason, reprocessMemo }),
        userName: inspectedBy,
      },
    });

    return NextResponse.json({
      success: true,
      data: inspection,
      message: `검수 상태가 '${statusLabel[status] || status}'(으)로 변경되었습니다.`,
    });
  } catch (error: any) {
    console.error('RX 검수 상태 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// RX 검수 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    await prisma.rxInspection.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '검수 기록이 삭제되었습니다.',
    });
  } catch (error: any) {
    console.error('RX 검수 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
