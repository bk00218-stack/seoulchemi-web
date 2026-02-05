// 매입처 미납금 결제 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 결제 처리
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplierId = parseInt(id)
    const body = await request.json()
    const { amount, paymentMethod, bankName, memo } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '결제 금액을 입력해주세요' }, { status: 400 })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json({ error: '매입처를 찾을 수 없습니다' }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 미납금 차감
      const updatedSupplier = await tx.supplier.update({
        where: { id: supplierId },
        data: {
          outstandingAmount: { decrement: amount },
          lastPaymentAt: new Date()
        }
      })

      // 작업 로그
      await tx.workLog.create({
        data: {
          workType: 'supplier_payment',
          targetType: 'supplier',
          targetId: supplierId,
          description: `매입처 결제 - ${supplier.name}`,
          details: JSON.stringify({
            amount,
            paymentMethod,
            bankName,
            memo,
            beforeAmount: supplier.outstandingAmount,
            afterAmount: updatedSupplier.outstandingAmount
          })
        }
      })

      return updatedSupplier
    })

    return NextResponse.json({
      message: '결제 처리되었습니다',
      supplier: result
    })
  } catch (error) {
    console.error('Failed to process payment:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
