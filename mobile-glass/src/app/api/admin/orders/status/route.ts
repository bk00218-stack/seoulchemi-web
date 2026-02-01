import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { orderIds, status } = await request.json()
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: '주문을 선택해주세요.' }, { status: 400 })
    }
    
    // 상태에 따른 타임스탬프 업데이트
    const data: any = { status }
    const now = new Date()
    
    if (status === 'confirmed') data.confirmedAt = now
    if (status === 'shipped') data.shippedAt = now
    if (status === 'delivered') data.deliveredAt = now
    
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data
    })
    
    return NextResponse.json({ 
      success: true, 
      message: `${orderIds.length}건의 주문 상태가 변경되었습니다.` 
    })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: '상태 변경 실패' }, { status: 500 })
  }
}
