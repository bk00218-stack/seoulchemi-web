import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stores/bulk-import - 가맹점 일괄 등록
export async function POST(request: Request) {
  try {
    const { stores } = await request.json()
    
    if (!stores || !Array.isArray(stores) || stores.length === 0) {
      return NextResponse.json({ error: '등록할 데이터가 없습니다.', success: 0, failed: 0, errors: [] }, { status: 400 })
    }

    // 그룹 목록 미리 조회 (이름으로 매칭용)
    const allGroups = await prisma.storeGroup.findMany({
      select: { id: true, name: true }
    })
    const groupMap = new Map(allGroups.map(g => [g.name, g.id]))

    // 마지막 ID 조회 (코드 자동생성용)
    const lastStore = await prisma.store.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    })
    let nextId = (lastStore?.id || 0) + 1

    const results = { success: 0, failed: 0, errors: [] as string[] }
    
    // 컬럼명 매핑 (한글 → 영문)
    const columnMap: Record<string, string> = {
      '안경원명': 'name',
      '가맹점명': 'name',
      '이름': 'name',
      '대표자': 'ownerName',
      '대표자명': 'ownerName',
      '전화': 'phone',
      '연락처': 'phone',
      '전화번호': 'phone',
      '주소': 'address',
      '사업자등록번호': 'businessRegNo',
      '사업자번호': 'businessRegNo',
      '업태': 'businessCategory',
      '업종': 'businessType',
      '이메일': 'email',
      '메일': 'email',
      '그룹': 'groupName',
      '그룹명': 'groupName',
      '거래처유형': 'storeType',
      '유형': 'storeType',
      '코드': 'code',
      '배송연락처': 'deliveryContact',
      '배송주소': 'deliveryAddress',
      '기본할인율': 'discountRate',
      '할인율': 'discountRate',
      '메모': 'memo',
      '비고': 'memo',
    }

    for (let i = 0; i < stores.length; i++) {
      const row = stores[i]
      const rowNum = i + 2 // 헤더 제외 2번째 줄부터
      
      try {
        // 컬럼 매핑
        const mapped: Record<string, any> = {}
        for (const [key, value] of Object.entries(row)) {
          const mappedKey = columnMap[key] || key
          mapped[mappedKey] = value
        }
        
        // 필수 필드 체크
        if (!mapped.name || !String(mapped.name).trim()) {
          results.failed++
          results.errors.push(`${rowNum}행: 안경원명이 없습니다`)
          continue
        }
        
        // 코드 생성 (없으면)
        let storeCode = mapped.code ? String(mapped.code).trim() : ''
        if (!storeCode) {
          storeCode = String(nextId + 10000)
          nextId++
        }
        
        // 코드 중복 체크
        const existing = await prisma.store.findUnique({ where: { code: storeCode } })
        if (existing) {
          // 코드 중복이면 새 코드 생성
          storeCode = String(nextId + 10000)
          nextId++
        }
        
        // 그룹 ID 찾기
        let groupId = null
        if (mapped.groupName) {
          groupId = groupMap.get(String(mapped.groupName).trim()) || null
        }
        
        // 생성
        await prisma.store.create({
          data: {
            code: storeCode,
            name: String(mapped.name).trim(),
            ownerName: mapped.ownerName ? String(mapped.ownerName).trim() : null,
            phone: mapped.phone ? String(mapped.phone).trim() : null,
            address: mapped.address ? String(mapped.address).trim() : null,
            businessRegNo: mapped.businessRegNo ? String(mapped.businessRegNo).trim() : null,
            businessCategory: mapped.businessCategory ? String(mapped.businessCategory).trim() : null,
            businessType: mapped.businessType ? String(mapped.businessType).trim() : null,
            email: mapped.email ? String(mapped.email).trim() : null,
            storeType: mapped.storeType ? String(mapped.storeType).trim() : '소매',
            deliveryContact: mapped.deliveryContact ? String(mapped.deliveryContact).trim() : null,
            deliveryAddress: mapped.deliveryAddress ? String(mapped.deliveryAddress).trim() : null,
            discountRate: mapped.discountRate ? parseFloat(String(mapped.discountRate)) : 0,
            memo: mapped.memo ? String(mapped.memo).trim() : null,
            groupId,
            isActive: true,
          }
        })
        
        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`${rowNum}행: ${error.message || '등록 실패'}`)
      }
    }
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Bulk import failed:', error)
    return NextResponse.json({ error: '일괄 등록에 실패했습니다.', success: 0, failed: 0, errors: [] }, { status: 500 })
  }
}
