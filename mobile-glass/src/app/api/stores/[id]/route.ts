import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/stores/[id] - 가맹점 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        orders: {
          orderBy: { orderedAt: 'desc' },
          take: 10,
          include: {
            items: {
              include: { product: true }
            }
          }
        },
        _count: {
          select: { orders: true }
        }
      }
    })
    
    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    return NextResponse.json({ store })
  } catch (error) {
    console.error('Failed to fetch store:', error)
    return NextResponse.json({ error: '가맹점 정보를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/stores/[id] - 가맹점 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    const body = await request.json()
    
    const { name, ownerName, phone, address, isActive } = body
    
    // 존재 여부 확인
    const existing = await prisma.store.findUnique({ where: { id: storeId } })
    if (!existing) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }
    
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (ownerName !== undefined) updateData.ownerName = ownerName
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (isActive !== undefined) updateData.isActive = isActive
    
    const store = await prisma.store.update({
      where: { id: storeId },
      data: updateData,
    })
    
    return NextResponse.json({ success: true, store })
  } catch (error) {
    console.error('Failed to update store:', error)
    return NextResponse.json({ error: '가맹점 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/stores/[id] - 가맹점 삭제 (비활성화)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storeId = parseInt(id)
    
    // 주문 내역이 있는지 확인
    const orderCount = await prisma.order.count({ where: { storeId } })
    
    if (orderCount > 0) {
      // 주문 내역이 있으면 비활성화만
      await prisma.store.update({
        where: { id: storeId },
        data: { isActive: false },
      })
      return NextResponse.json({ 
        success: true, 
        message: '주문 내역이 있어 비활성화 처리되었습니다.',
        deactivated: true 
      })
    } else {
      // 주문 내역이 없으면 실제 삭제
      await prisma.store.delete({ where: { id: storeId } })
      return NextResponse.json({ 
        success: true, 
        message: '가맹점이 삭제되었습니다.',
        deleted: true 
      })
    }
  } catch (error) {
    console.error('Failed to delete store:', error)
    return NextResponse.json({ error: '가맹점 삭제에 실패했습니다.' }, { status: 500 })
  }
}
