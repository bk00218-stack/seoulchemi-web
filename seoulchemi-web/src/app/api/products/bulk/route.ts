import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, isActive, optionType } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No products selected' }, { status: 400 })
    }

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {}
    if (isActive !== undefined) {
      updateData.isActive = isActive
    }
    if (optionType) {
      updateData.optionType = optionType
      updateData.productType = optionType
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes specified' }, { status: 400 })
    }

    // 일괄 업데이트
    const result = await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: updateData
    })

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('Error bulk updating products:', error)
    return NextResponse.json({ error: 'Failed to bulk update' }, { status: 500 })
  }
}
