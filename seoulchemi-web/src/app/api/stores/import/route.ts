import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stores/import - 거래처 일괄 임포트 (기존 삭제 후 새로 등록)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stores, deleteExisting = true } = body
    
    if (!stores || !Array.isArray(stores)) {
      return NextResponse.json({ error: 'stores 배열이 필요합니다.' }, { status: 400 })
    }
    
    let deletedCount = 0
    let insertedCount = 0
    let skippedCount = 0
    const errors: string[] = []
    
    // 기존 데이터 삭제
    if (deleteExisting) {
      // 관련 테이블 먼저 삭제 (외래키 제약)
      await prisma.storeBrandDiscount.deleteMany({})
      await prisma.storeProductDiscount.deleteMany({})
      await prisma.storeProductPrice.deleteMany({})
      await prisma.storeGroupMember.deleteMany({})
      await prisma.transaction.deleteMany({})
      
      // 주문 관련 삭제
      await prisma.shippingSlipItem.deleteMany({})
      await prisma.shippingSlip.deleteMany({})
      await prisma.orderItem.deleteMany({})
      await prisma.order.deleteMany({})
      
      // 거래처 삭제
      const deleted = await prisma.store.deleteMany({})
      deletedCount = deleted.count
    }
    
    // 새 거래처 등록
    const usedCodes = new Set<string>()
    
    for (const store of stores) {
      try {
        if (!store.name) {
          skippedCount++
          continue
        }
        
        // 코드 처리 - 중복 방지
        let storeCode = store.code ? String(store.code).trim() : null
        
        if (!storeCode) {
          // 코드 없으면 자동생성
          const lastStore = await prisma.store.findFirst({
            orderBy: { id: 'desc' },
            select: { code: true }
          })
          storeCode = String(parseInt(lastStore?.code || '10000') + 1)
        }
        
        // 이미 사용된 코드면 스킵
        if (usedCodes.has(storeCode)) {
          storeCode = storeCode + '_' + Date.now()
        }
        usedCodes.add(storeCode)
        
        // 기존 코드 존재 확인
        const existing = await prisma.store.findUnique({ where: { code: storeCode } })
        if (existing) {
          storeCode = storeCode + '_dup'
        }
        
        await prisma.store.create({
          data: {
            code: storeCode,
            name: String(store.name).trim(),
            ownerName: store.ownerName ? String(store.ownerName).trim() : null,
            phone: store.phone ? String(store.phone).trim() : null,
            address: store.address ? String(store.address).trim() : null,
            businessType: store.businessType ? String(store.businessType).trim() : null,
            businessCategory: store.businessCategory ? String(store.businessCategory).trim() : null,
            businessRegNo: store.businessRegNo ? String(store.businessRegNo).trim() : null,
            email: store.email ? String(store.email).trim() : null,
            billingDay: store.billingDay ? parseInt(String(store.billingDay)) : null,
            outstandingAmount: store.outstandingAmount ? parseInt(String(store.outstandingAmount)) : 0,
            areaCode: store.areaCode ? String(store.areaCode).trim() : null,
            storeType: store.storeType ? String(store.storeType).trim() : null,
            status: store.status || 'active',
            isActive: store.isActive !== false,
            paymentTermDays: store.paymentTermDays || 30,
          },
        })
        insertedCount++
      } catch (e: any) {
        errors.push(`${store.name}: ${e.message}`)
        skippedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      deletedCount,
      insertedCount,
      skippedCount,
      totalInput: stores.length,
      errors: errors.slice(0, 10), // 처음 10개 에러만 반환
    })
  } catch (error: any) {
    console.error('Failed to import stores:', error)
    return NextResponse.json({ error: error.message || '임포트에 실패했습니다.' }, { status: 500 })
  }
}
