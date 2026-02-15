import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/stores/bulk-action - 가맹점 일괄 작업 (ID 기준)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ids, action, value } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '선택된 가맹점이 없습니다.' }, { status: 400 })
    }
    
    if (!action) {
      return NextResponse.json({ error: '작업 유형을 선택해주세요.' }, { status: 400 })
    }
    
    let result
    
    switch (action) {
      case 'delete':
        // 일괄 삭제
        result = await prisma.store.deleteMany({
          where: { id: { in: ids } }
        })
        return NextResponse.json({
          success: true,
          message: `${result.count}개 가맹점이 삭제되었습니다.`,
          count: result.count
        })
        
      case 'setGroup':
        // 그룹 설정
        if (value === undefined) {
          return NextResponse.json({ error: '그룹을 선택해주세요.' }, { status: 400 })
        }
        result = await prisma.store.updateMany({
          where: { id: { in: ids } },
          data: { groupId: value || null }
        })
        return NextResponse.json({
          success: true,
          message: `${result.count}개 가맹점의 그룹이 변경되었습니다.`,
          count: result.count
        })
        
      case 'setActive':
        // 활성화
        result = await prisma.store.updateMany({
          where: { id: { in: ids } },
          data: { isActive: true }
        })
        return NextResponse.json({
          success: true,
          message: `${result.count}개 가맹점이 활성화되었습니다.`,
          count: result.count
        })
        
      case 'setInactive':
        // 비활성화
        result = await prisma.store.updateMany({
          where: { id: { in: ids } },
          data: { isActive: false }
        })
        return NextResponse.json({
          success: true,
          message: `${result.count}개 가맹점이 비활성화되었습니다.`,
          count: result.count
        })
        
      default:
        return NextResponse.json({ error: '알 수 없는 작업입니다.' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Failed to bulk action stores:', error)
    return NextResponse.json({ error: error.message || '일괄 작업에 실패했습니다.' }, { status: 500 })
  }
}
