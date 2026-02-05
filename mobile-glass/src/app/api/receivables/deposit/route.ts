import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, amount, paymentMethod, memo, depositor, bankName } = body

    if (!storeId || !amount) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: '유효한 금액을 입력해주세요.' }, { status: 400 })
    }

    // 가맹점 조회
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    })

    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 트랜잭션으로 입금 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 미수금 차감
      const newOutstanding = Math.max(0, store.outstandingAmount - amount)
      
      await tx.store.update({
        where: { id: storeId },
        data: {
          outstandingAmount: newOutstanding,
          lastPaymentAt: new Date(),
        }
      })

      // 2. 입출금 내역 기록
      const transaction = await tx.transaction.create({
        data: {
          storeId,
          type: 'deposit',
          amount,
          balanceAfter: newOutstanding,
          paymentMethod: paymentMethod || 'transfer',
          depositor: depositor || memo || null,
          bankName: bankName || null,
          memo,
          processedBy: 'admin', // TODO: 실제 로그인 사용자
          processedAt: new Date(),
        }
      })

      // 3. 작업 로그 기록
      await tx.workLog.create({
        data: {
          workType: 'payment',
          targetType: 'store',
          targetId: storeId,
          description: `입금 처리: ${amount.toLocaleString()}원 (${paymentMethod || 'transfer'})`,
          details: JSON.stringify({
            amount,
            paymentMethod,
            memo,
            previousBalance: store.outstandingAmount,
            newBalance: newOutstanding,
          }),
          userName: 'admin', // TODO: 실제 로그인 사용자
          pcName: 'WEB',
        }
      })

      return { transaction, newOutstanding }
    })

    return NextResponse.json({
      success: true,
      message: '입금이 처리되었습니다.',
      transaction: {
        id: result.transaction.id,
        amount,
        newBalance: result.newOutstanding,
      }
    })
  } catch (error) {
    console.error('Failed to process deposit:', error)
    return NextResponse.json({ error: '입금 처리에 실패했습니다.' }, { status: 500 })
  }
}
