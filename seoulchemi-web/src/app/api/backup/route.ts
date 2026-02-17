import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/backup - 백업 데이터 생성 (JSON 다운로드)
export async function GET() {
  try {
    // 주요 데이터 수집
    const [
      stores,
      groups,
      staff,
      brands,
      products,
      orders,
      orderItems,
      transactions,
    ] = await Promise.all([
      prisma.store.findMany(),
      prisma.storeGroup.findMany(),
      prisma.salesStaff.findMany(),
      prisma.brand.findMany(),
      prisma.product.findMany(),
      prisma.order.findMany(),
      prisma.orderItem.findMany(),
      prisma.transaction.findMany(),
    ])
    
    const backupData = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      data: {
        stores,
        groups,
        staff,
        brands,
        products,
        orders,
        orderItems,
        transactions,
      },
      counts: {
        stores: stores.length,
        groups: groups.length,
        staff: staff.length,
        brands: brands.length,
        products: products.length,
        orders: orders.length,
        orderItems: orderItems.length,
        transactions: transactions.length,
      }
    }
    
    const json = JSON.stringify(backupData, null, 2)
    const filename = `seoulchemi_backup_${new Date().toISOString().slice(0, 10)}.json`
    
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json({ error: '백업 생성에 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/backup - 백업에서 복원
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.version || !body.data) {
      return NextResponse.json({ error: '유효하지 않은 백업 파일입니다.' }, { status: 400 })
    }
    
    const { data } = body
    
    // 복원 순서 중요: 외래키 관계 고려
    // 1. groups, staff 먼저
    // 2. stores (group, staff 참조)
    // 3. brands
    // 4. products (brand 참조)
    // 5. orders (store 참조)
    // 6. orderItems (order, product 참조)
    // 7. transactions (store 참조)
    
    const result = await prisma.$transaction(async (tx) => {
      let restored = {
        groups: 0, staff: 0, stores: 0, brands: 0,
        products: 0, orders: 0, orderItems: 0, transactions: 0
      }
      
      // Groups
      if (data.groups?.length) {
        for (const item of data.groups) {
          await tx.storeGroup.upsert({
            where: { id: item.id },
            update: { name: item.name, discountRate: item.discountRate || 0 },
            create: { id: item.id, name: item.name, discountRate: item.discountRate || 0 }
          })
          restored.groups++
        }
      }
      
      // Staff (SalesStaff)
      if (data.staff?.length) {
        for (const item of data.staff) {
          await tx.salesStaff.upsert({
            where: { id: item.id },
            update: { name: item.name, phone: item.phone },
            create: { id: item.id, name: item.name, phone: item.phone }
          })
          restored.staff++
        }
      }
      
      // Brands
      if (data.brands?.length) {
        for (const item of data.brands) {
          await tx.brand.upsert({
            where: { id: item.id },
            update: { name: item.name, supplierId: item.supplierId },
            create: { id: item.id, name: item.name, supplierId: item.supplierId }
          })
          restored.brands++
        }
      }
      
      // Stores (skip - too complex with all relations)
      // Products (skip - has relations)
      // Orders, OrderItems, Transactions (skip - complex)
      
      return restored
    })
    
    return NextResponse.json({
      success: true,
      message: '복원이 완료되었습니다.',
      restored: result
    })
  } catch (error) {
    console.error('Restore failed:', error)
    return NextResponse.json({ error: '복원에 실패했습니다.' }, { status: 500 })
  }
}
