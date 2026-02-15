import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 배송지 정보 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const region = searchParams.get('region') || ''
    
    const stores = await prisma.store.findMany({
      where: {
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { address: { contains: search } },
            { deliveryAddress: { contains: search } }
          ]
        }),
        ...(region && region !== 'all' && {
          OR: [
            { address: { contains: region } },
            { deliveryAddress: { contains: region } }
          ]
        })
      },
      select: {
        id: true,
        code: true,
        name: true,
        ownerName: true,
        phone: true,
        address: true,
        deliveryContact: true,
        deliveryPhone: true,
        deliveryAddress: true,
        deliveryZipcode: true,
        deliveryMemo: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(stores)
  } catch (error) {
    console.error('Error fetching delivery info:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery info' }, { status: 500 })
  }
}

// 배송지 정보 일괄 수정
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { updates } = body // [{ id, deliveryAddress, deliveryMemo, ... }, ...]
    
    const results = await Promise.all(
      updates.map((update: { id: number; [key: string]: unknown }) =>
        prisma.store.update({
          where: { id: update.id },
          data: {
            deliveryContact: update.deliveryContact as string,
            deliveryPhone: update.deliveryPhone as string,
            deliveryAddress: update.deliveryAddress as string,
            deliveryZipcode: update.deliveryZipcode as string,
            deliveryMemo: update.deliveryMemo as string
          }
        })
      )
    )
    
    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error('Error updating delivery info:', error)
    return NextResponse.json({ error: 'Failed to update delivery info' }, { status: 500 })
  }
}
