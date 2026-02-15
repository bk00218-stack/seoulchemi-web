import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// SMS 발송 이력 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (storeId) {
      where.storeId = parseInt(storeId);
    }

    if (status) {
      where.status = status;
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

    const [histories, total] = await Promise.all([
      prisma.smsHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.smsHistory.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: histories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('SMS 이력 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// SMS 발송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phone,
      storeId,
      storeName,
      templateId,
      templateCode,
      message,
      orderId,
      orderNo,
      sentBy,
      variables, // 템플릿 치환 변수 { storeName, orderNo, amount, trackingNo, ... }
    } = body;

    let finalMessage = message;
    let templateName = null;

    // 템플릿 사용 시
    if (templateCode) {
      const template = await prisma.smsTemplate.findUnique({
        where: { code: templateCode },
      });

      if (template) {
        templateName = template.name;
        finalMessage = template.content;

        // 변수 치환
        if (variables) {
          Object.entries(variables).forEach(([key, value]) => {
            finalMessage = finalMessage.replace(
              new RegExp(`{${key}}`, 'g'),
              String(value)
            );
          });
        }
      }
    }

    // 메시지 길이에 따라 타입 결정
    const sendType = finalMessage.length > 90 ? 'lms' : 'sms';

    // SMS 발송 기록 생성 (실제 발송은 외부 API 연동 필요)
    const smsHistory = await prisma.smsHistory.create({
      data: {
        phone: phone.replace(/-/g, ''),
        storeId,
        storeName,
        templateId,
        templateName,
        message: finalMessage,
        orderId,
        orderNo,
        status: 'pending', // 실제 발송 전 상태
        sendType,
        sentBy,
      },
    });

    // TODO: 실제 SMS 발송 API 연동
    // 여기에 외부 SMS API (알리고, 카카오 등) 연동 코드 추가
    // 예시:
    // const result = await sendSmsApi(phone, finalMessage);
    
    // 임시로 발송 성공 처리 (테스트용)
    const updatedHistory = await prisma.smsHistory.update({
      where: { id: smsHistory.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        resultCode: '0000',
        resultMessage: '발송 성공 (테스트)',
      },
    });

    // 작업 로그
    await prisma.workLog.create({
      data: {
        workType: 'sms_send',
        targetType: orderId ? 'order' : 'store',
        targetId: orderId || storeId,
        targetNo: orderNo,
        description: `SMS 발송: ${phone}`,
        details: JSON.stringify({ phone, message: finalMessage.substring(0, 50) + '...' }),
        userName: sentBy,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedHistory,
      message: 'SMS가 발송되었습니다.',
    });
  } catch (error: any) {
    console.error('SMS 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
