import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/migrate-staff - 기존 가맹점 데이터에서 영업/배송 담당자 마이그레이션
export async function POST() {
  try {
    // 1. 기존 영업담당 이름 수집 (salesRepName)
    const storesWithSalesRep = await prisma.store.findMany({
      where: {
        salesRepName: { not: null },
        salesStaffId: null, // 아직 연결 안된 것만
      },
      select: { id: true, salesRepName: true }
    })

    const uniqueSalesNames = [...new Set(
      storesWithSalesRep
        .map(s => s.salesRepName?.trim())
        .filter((name): name is string => !!name && name !== '-' && name.length > 0)
    )]

    // 2. 기존 배송담당 이름 수집 (deliveryContact 또는 deliveryStaffName)
    const storesWithDelivery = await prisma.store.findMany({
      where: {
        OR: [
          { deliveryContact: { not: null } },
        ],
        deliveryStaffId: null, // 아직 연결 안된 것만
      },
      select: { id: true, deliveryContact: true }
    })

    const uniqueDeliveryNames = [...new Set(
      storesWithDelivery
        .map(s => s.deliveryContact?.trim())
        .filter((name): name is string => !!name && name !== '-' && name.length > 0)
    )]

    // 3. 영업담당자 생성
    let salesCreated = 0
    const salesNameToId: Record<string, number> = {}

    for (const name of uniqueSalesNames) {
      // 이미 존재하는지 확인
      let staff = await prisma.salesStaff.findFirst({ where: { name } })
      if (!staff) {
        staff = await prisma.salesStaff.create({
          data: { name, isActive: true }
        })
        salesCreated++
      }
      salesNameToId[name] = staff.id
    }

    // 4. 배송담당자 생성
    let deliveryCreated = 0
    const deliveryNameToId: Record<string, number> = {}

    for (const name of uniqueDeliveryNames) {
      // 이미 존재하는지 확인
      let staff = await prisma.deliveryStaff.findFirst({ where: { name } })
      if (!staff) {
        staff = await prisma.deliveryStaff.create({
          data: { name, isActive: true }
        })
        deliveryCreated++
      }
      deliveryNameToId[name] = staff.id
    }

    // 5. 가맹점에 담당자 ID 연결 (salesStaffId)
    let salesLinked = 0
    for (const store of storesWithSalesRep) {
      const name = store.salesRepName?.trim()
      if (name && salesNameToId[name]) {
        await prisma.store.update({
          where: { id: store.id },
          data: { salesStaffId: salesNameToId[name] }
        })
        salesLinked++
      }
    }

    // 6. 가맹점에 담당자 ID 연결 (deliveryStaffId)
    let deliveryLinked = 0
    for (const store of storesWithDelivery) {
      const name = store.deliveryContact?.trim()
      if (name && deliveryNameToId[name]) {
        await prisma.store.update({
          where: { id: store.id },
          data: { deliveryStaffId: deliveryNameToId[name] }
        })
        deliveryLinked++
      }
    }

    return NextResponse.json({
      success: true,
      message: '마이그레이션 완료',
      results: {
        salesStaff: {
          uniqueNames: uniqueSalesNames.length,
          created: salesCreated,
          storesLinked: salesLinked,
        },
        deliveryStaff: {
          uniqueNames: uniqueDeliveryNames.length,
          created: deliveryCreated,
          storesLinked: deliveryLinked,
        }
      }
    })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({ error: '마이그레이션 실패' }, { status: 500 })
  }
}

// GET - 마이그레이션 상태 확인
export async function GET() {
  try {
    const [
      totalStores,
      storesWithSalesRepName,
      storesWithSalesStaffId,
      storesWithDeliveryContact,
      storesWithDeliveryStaffId,
      totalSalesStaff,
      totalDeliveryStaff,
    ] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { salesRepName: { not: null } } }),
      prisma.store.count({ where: { salesStaffId: { not: null } } }),
      prisma.store.count({ where: { deliveryContact: { not: null } } }),
      prisma.store.count({ where: { deliveryStaffId: { not: null } } }),
      prisma.salesStaff.count(),
      prisma.deliveryStaff.count(),
    ])

    return NextResponse.json({
      status: 'ok',
      stores: {
        total: totalStores,
        withSalesRepName: storesWithSalesRepName,
        withSalesStaffId: storesWithSalesStaffId,
        withDeliveryContact: storesWithDeliveryContact,
        withDeliveryStaffId: storesWithDeliveryStaffId,
      },
      staff: {
        salesStaff: totalSalesStaff,
        deliveryStaff: totalDeliveryStaff,
      }
    })
  } catch (error) {
    console.error('Status check failed:', error)
    return NextResponse.json({ error: '상태 확인 실패' }, { status: 500 })
  }
}
