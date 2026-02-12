import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stores/bulk-update - 거래처 일괄 수정 (코드 기준)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stores } = body
    
    if (!stores || !Array.isArray(stores)) {
      return NextResponse.json({ error: 'stores 배열이 필요합니다.' }, { status: 400 })
    }
    
    let updatedCount = 0
    let skippedCount = 0
    let notFoundCount = 0
    const errors: string[] = []
    
    for (const store of stores) {
      try {
        if (!store.code) {
          skippedCount++
          continue
        }
        
        const code = String(store.code).trim()
        
        // 기존 거래처 찾기
        const existing = await prisma.store.findUnique({ where: { code } })
        
        if (!existing) {
          notFoundCount++
          errors.push(`코드 ${code}: 존재하지 않음`)
          continue
        }
        
        // 업데이트할 데이터 구성
        const updateData: any = {}
        
        if (store.name !== undefined) updateData.name = String(store.name).trim()
        if (store.ownerName !== undefined) updateData.ownerName = store.ownerName ? String(store.ownerName).trim() : null
        if (store.phone !== undefined) updateData.phone = store.phone ? String(store.phone).trim() : null
        if (store.address !== undefined) updateData.address = store.address ? String(store.address).trim() : null
        if (store.businessRegNo !== undefined) updateData.businessRegNo = store.businessRegNo ? String(store.businessRegNo).trim() : null
        if (store.businessType !== undefined) updateData.businessType = store.businessType ? String(store.businessType).trim() : null
        if (store.businessCategory !== undefined) updateData.businessCategory = store.businessCategory ? String(store.businessCategory).trim() : null
        if (store.email !== undefined) updateData.email = store.email ? String(store.email).trim() : null
        if (store.billingDay !== undefined) updateData.billingDay = store.billingDay ? parseInt(String(store.billingDay)) : null
        if (store.areaCode !== undefined) updateData.areaCode = store.areaCode ? String(store.areaCode).trim() : null
        if (store.storeType !== undefined) updateData.storeType = store.storeType ? String(store.storeType).trim() : null
        if (store.outstandingAmount !== undefined) updateData.outstandingAmount = store.outstandingAmount ? parseInt(String(store.outstandingAmount)) : 0
        if (store.paymentTermDays !== undefined) updateData.paymentTermDays = store.paymentTermDays ? parseInt(String(store.paymentTermDays)) : 30
        if (store.memo !== undefined) updateData.memo = store.memo ? String(store.memo).trim() : null
        if (store.status !== undefined) updateData.status = store.status || 'active'
        if (store.isActive !== undefined) updateData.isActive = store.isActive === 'Y' || store.isActive === true || store.isActive === '활성'
        
        // 업데이트 실행
        if (Object.keys(updateData).length > 0) {
          await prisma.store.update({
            where: { code },
            data: updateData
          })
          updatedCount++
        } else {
          skippedCount++
        }
      } catch (e: any) {
        errors.push(`${store.code}: ${e.message}`)
        skippedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      updatedCount,
      skippedCount,
      notFoundCount,
      totalInput: stores.length,
      errors: errors.slice(0, 10),
    })
  } catch (error: any) {
    console.error('Failed to bulk update stores:', error)
    return NextResponse.json({ error: error.message || '일괄 수정에 실패했습니다.' }, { status: 500 })
  }
}
