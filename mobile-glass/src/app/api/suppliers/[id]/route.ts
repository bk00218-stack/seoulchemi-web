import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/suppliers/[id] - 매입처 상세
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchases: {
          take: 10,
          orderBy: { purchasedAt: 'desc' },
          include: { items: true }
        }
      }
    })
    
    if (!supplier) {
      return NextResponse.json({ error: '매입처를 찾을 수 없습니다' }, { status: 404 })
    }
    
    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Failed to fetch supplier:', error)
    return NextResponse.json({ error: '매입처 조회에 실패했습니다.' }, { status: 500 })
  }
}

// PATCH /api/suppliers/[id] - 매입처 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, contactName, phone, email, address, bankInfo, memo, isActive } = body
    
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { 
        ...(name && { name }),
        ...(contactName !== undefined && { contactName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(bankInfo !== undefined && { bankInfo }),
        ...(memo !== undefined && { memo }),
        ...(isActive !== undefined && { isActive }),
      }
    })
    
    return NextResponse.json({ success: true, supplier })
  } catch (error) {
    console.error('Failed to update supplier:', error)
    return NextResponse.json({ error: '매입처 수정에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/suppliers/[id] - 매입처 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 매입 내역이 있으면 삭제 불가
    const purchaseCount = await prisma.purchase.count({
      where: { supplierId: parseInt(id) }
    })
    
    if (purchaseCount > 0) {
      return NextResponse.json({ 
        error: `${purchaseCount}건의 매입 내역이 있어 삭제할 수 없습니다. 비활성화를 사용해주세요.` 
      }, { status: 400 })
    }
    
    await prisma.supplier.delete({
      where: { id: parseInt(id) }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete supplier:', error)
    return NextResponse.json({ error: '매입처 삭제에 실패했습니다.' }, { status: 500 })
  }
}
