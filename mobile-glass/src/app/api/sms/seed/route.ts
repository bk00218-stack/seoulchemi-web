import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 기본 SMS 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const defaultTemplates = [
      {
        name: '주문 접수 알림',
        code: 'order_confirm',
        category: 'order',
        content: '[렌즈초이스] {storeName}님, 주문번호 {orderNo}가 접수되었습니다. 빠른 시일 내에 출고해드리겠습니다.',
        isActive: true,
        isAuto: true,
      },
      {
        name: '출고 완료 알림',
        code: 'order_shipped',
        category: 'shipping',
        content: '[렌즈초이스] {storeName}님, 주문번호 {orderNo}가 출고되었습니다. 택배사: {courier}, 운송장: {trackingNo}',
        isActive: true,
        isAuto: true,
      },
      {
        name: '배송 완료 알림',
        code: 'order_delivered',
        category: 'shipping',
        content: '[렌즈초이스] {storeName}님, 주문번호 {orderNo}가 배송 완료되었습니다. 감사합니다.',
        isActive: true,
        isAuto: true,
      },
      {
        name: '입금 확인 알림',
        code: 'payment_confirm',
        category: 'payment',
        content: '[렌즈초이스] {storeName}님, {amount}원 입금이 확인되었습니다. 감사합니다.',
        isActive: true,
        isAuto: false,
      },
      {
        name: '미수금 안내',
        code: 'payment_reminder',
        category: 'payment',
        content: '[렌즈초이스] {storeName}님, 미수금 {amount}원이 있습니다. 확인 부탁드립니다. 문의: 02-000-0000',
        isActive: true,
        isAuto: false,
      },
      {
        name: 'RX 검수 완료',
        code: 'rx_passed',
        category: 'order',
        content: '[렌즈초이스] {storeName}님, 주문번호 {orderNo} RX 렌즈 검수가 완료되어 출고됩니다.',
        isActive: true,
        isAuto: true,
      },
      {
        name: 'RX 검수 불합격',
        code: 'rx_failed',
        category: 'order',
        content: '[렌즈초이스] {storeName}님, 주문번호 {orderNo} RX 렌즈 검수 결과 재가공이 필요합니다. 2~3일 추가 소요됩니다.',
        isActive: true,
        isAuto: true,
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const template of defaultTemplates) {
      const existing = await prisma.smsTemplate.findUnique({
        where: { code: template.code },
      });

      if (!existing) {
        await prisma.smsTemplate.create({ data: template });
        created++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `기본 템플릿 생성 완료: ${created}개 생성, ${skipped}개 건너뜀`,
    });
  } catch (error: any) {
    console.error('기본 템플릿 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
