import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUserName } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserName(request)
    const body = await request.json()
    const { storeId, amount, memo } = body

    if (!storeId || !amount) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: '유효한 금액을 입력해주세요.' }, { status: 400 })
    }

    if (!memo || !memo.trim()) {
      return NextResponse.json({ error: '할인 사유를 입력해주세요.' }, { status: 400 })
    }

    // 가맹점 조회
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    })

    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 트랜잭션으로 할인 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 미수금 차감
      const newOutstanding = Math.max(0, store.outstandingAmount - amount)

      await tx.store.update({
        where: { id: storeId },
        data: {
          outstandingAmount: newOutstanding,
        }
      })

      // 2. 거래내역 기록 (type: adjustment)
      const transaction = await tx.transaction.create({
        data: {
          storeId,
          type: 'adjustment',
          amount,
          balanceAfter: newOutstanding,
          memo: `할인: ${memo}`,
          processedBy: currentUser,
          processedAt: new Date(),
        }
      })

      // 3. 작업 로그 기록
      await tx.workLog.create({
        data: {
          workType: 'discount',
          targetType: 'store',
          targetId: storeId,
          description: `할인 처리: ${amount.toLocaleString()}원 (${memo})`,
          details: JSON.stringify({
            amount,
            memo,
            previousBalance: store.outstandingAmount,
            newBalance: newOutstanding,
          }),
          userName: currentUser,
          pcName: 'WEB',
        }
      })

      return { transaction, newOutstanding }
    })

    return NextResponse.json({
      success: true,
      message: '할인이 처리되었습니다.',
      transaction: {
        id: result.transaction.id,
        amount,
        newBalance: result.newOutstanding,
      }
    })
  } catch (error) {
    console.error('Failed to process discount:', error)
    return NextResponse.json({ error: '할인 처리에 실패했습니다.' }, { status: 500 })
  }
}
