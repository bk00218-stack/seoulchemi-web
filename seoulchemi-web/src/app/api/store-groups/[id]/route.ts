import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/store-groups/[id] - 그룹 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const groupId = parseInt(id)
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    
    const group = await prisma.storeGroup.findUnique({
      where: { id: groupId },
      include: {
        stores: {
          select: { id: true, name: true, code: true }
        },
        brandDiscounts: true
      }
    })
    
    if (!group) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json(group)
  } catch (error) {
    console.error('Failed to fetch store group:', error)
    return NextResponse.json({ error: '그룹 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PUT /api/store-groups/[id] - 그룹 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const groupId = parseInt(id)
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    
    const body = await request.json()
    const { name, description, discountRate, storeType, isActive } = body
    
    if (!name) {
      return NextResponse.json({ error: '그룹명은 필수입니다.' }, { status: 400 })
    }
    
    const group = await prisma.storeGroup.update({
      where: { id: groupId },
      data: {
        name,
        description,
        discountRate: discountRate || 0,
        storeType: storeType || 'normal',
        isActive: isActive !== undefined ? isActive : true,
      }
    })
    
    return NextResponse.json({ success: true, group })
  } catch (error) {
    console.error('Failed to update store group:', error)
    return NextResponse.json({ error: '그룹 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/store-groups/[id] - 그룹 비활성화
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const groupId = parseInt(id)
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 })
    }
    
    const group = await prisma.storeGroup.update({
      where: { id: groupId },
      data: { isActive: false }
    })
    
    return NextResponse.json({ success: true, message: '그룹이 비활성화되었습니다.', group })
  } catch (error) {
    console.error('Failed to deactivate store group:', error)
    return NextResponse.json({ error: '그룹 비활성화에 실패했습니다.' }, { status: 500 })
  }
}
