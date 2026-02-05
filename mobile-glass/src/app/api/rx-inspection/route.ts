import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// RX 검수 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const orderNo = searchParams.get('orderNo');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (orderNo) {
      where.orderNo = { contains: orderNo };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [inspections, total] = await Promise.all([
      prisma.rxInspection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rxInspection.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: inspections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('RX 검수 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// RX 검수 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      orderNo,
      orderItemId,
      sphOrdered,
      cylOrdered,
      axisOrdered,
      sphMeasured,
      cylMeasured,
      axisMeasured,
      centerThickness,
      edgeThickness,
      diameter,
      coating,
      tint,
      inspectedBy,
    } = body;

    // 자동 합격/불합격 판정
    let status = 'passed';
    let failReason = null;
    const failDetails: string[] = [];

    const sphTolerance = 0.12;
    const cylTolerance = 0.12;
    const axisTolerance = 3;

    // SPH 검사
    if (sphOrdered && sphMeasured) {
      const sphDiff = Math.abs(parseFloat(sphOrdered) - parseFloat(sphMeasured));
      if (sphDiff > sphTolerance) {
        status = 'failed';
        failDetails.push(`SPH 오차 ${sphDiff.toFixed(2)} (허용: ${sphTolerance})`);
      }
    }

    // CYL 검사
    if (cylOrdered && cylMeasured) {
      const cylDiff = Math.abs(parseFloat(cylOrdered) - parseFloat(cylMeasured));
      if (cylDiff > cylTolerance) {
        status = 'failed';
        failDetails.push(`CYL 오차 ${cylDiff.toFixed(2)} (허용: ${cylTolerance})`);
      }
    }

    // AXIS 검사
    if (axisOrdered && axisMeasured) {
      let axisDiff = Math.abs(parseInt(axisOrdered) - parseInt(axisMeasured));
      // 180도 경계 처리
      if (axisDiff > 90) axisDiff = 180 - axisDiff;
      if (axisDiff > axisTolerance) {
        status = 'failed';
        failDetails.push(`AXIS 오차 ${axisDiff}° (허용: ${axisTolerance}°)`);
      }
    }

    // 코팅 상태
    if (coating && coating !== 'ok') {
      status = 'failed';
      failDetails.push(`코팅 불량: ${coating}`);
    }

    // 착색 상태
    if (tint && tint !== 'ok') {
      status = 'failed';
      failDetails.push(`착색 불량: ${tint}`);
    }

    if (failDetails.length > 0) {
      failReason = failDetails.join(', ');
    }

    const inspection = await prisma.rxInspection.create({
      data: {
        orderId,
        orderNo,
        orderItemId,
        status,
        sphOrdered,
        cylOrdered,
        axisOrdered,
        sphMeasured,
        cylMeasured,
        axisMeasured,
        sphTolerance,
        cylTolerance,
        axisTolerance,
        centerThickness: centerThickness ? parseFloat(centerThickness) : null,
        edgeThickness: edgeThickness ? parseFloat(edgeThickness) : null,
        diameter: diameter ? parseFloat(diameter) : null,
        coating,
        tint,
        failReason,
        failDetails: failDetails.length > 0 ? JSON.stringify(failDetails) : null,
        inspectedBy,
        inspectedAt: new Date(),
      },
    });

    // 작업 로그 기록
    await prisma.workLog.create({
      data: {
        workType: 'rx_inspection',
        targetType: 'order',
        targetId: orderId,
        targetNo: orderNo,
        description: `RX 검수 ${status === 'passed' ? '합격' : '불합격'}`,
        details: JSON.stringify({ status, failReason }),
        userName: inspectedBy,
      },
    });

    return NextResponse.json({
      success: true,
      data: inspection,
      message: status === 'passed' ? '검수 합격' : '검수 불합격',
    });
  } catch (error: any) {
    console.error('RX 검수 등록 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
