import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/[id]/print - 출력용 데이터 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'delivery' // delivery, shipping, receipt

    if (isNaN(orderId)) {
      return NextResponse.json({ error: '잘못된 주문 ID입니다.' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        items: {
          include: {
            product: {
              include: { brand: true }
            }
          }
        },
        shippingSlips: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 공급자 정보 (설정에서 가져오기)
    const supplierSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['company_name', 'company_bizno', 'company_ceo', 'company_address', 'company_phone', 'company_fax']
        }
      }
    })

    const supplier = {
      name: supplierSettings.find(s => s.key === 'company_name')?.value || '서울케미',
      bizNo: supplierSettings.find(s => s.key === 'company_bizno')?.value || '',
      ceo: supplierSettings.find(s => s.key === 'company_ceo')?.value || '',
      address: supplierSettings.find(s => s.key === 'company_address')?.value || '',
      phone: supplierSettings.find(s => s.key === 'company_phone')?.value || '',
      fax: supplierSettings.find(s => s.key === 'company_fax')?.value || '',
    }

    // 출력 이력 기록
    await prisma.printHistory.create({
      data: {
        orderId: order.id,
        orderNo: order.orderNo,
        storeName: order.store.name,
        printType: type === 'delivery' ? '거래명세서' : type === 'shipping' ? '출고지시서' : '납품확인서',
        printedBy: 'admin',
        pageCount: 1,
      }
    })

    // VAT 계산
    const supplyAmount = Math.round(order.totalAmount / 1.1)
    const taxAmount = order.totalAmount - supplyAmount

    return NextResponse.json({
      type,
      printDate: new Date().toISOString(),
      supplier,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        orderType: order.orderType,
        status: order.status,
        totalAmount: order.totalAmount,
        supplyAmount,
        taxAmount,
        memo: order.memo,
        orderedAt: order.orderedAt.toISOString(),
        shippedAt: order.shippedAt?.toISOString() || null,
      },
      store: {
        id: order.store.id,
        code: order.store.code,
        name: order.store.name,
        ownerName: order.store.ownerName,
        phone: order.store.phone,
        address: order.store.address,
        deliveryContact: order.store.deliveryContact,
        deliveryPhone: order.store.deliveryPhone,
        deliveryAddress: order.store.deliveryAddress || order.store.address,
        deliveryZipcode: order.store.deliveryZipcode,
        deliveryMemo: order.store.deliveryMemo,
      },
      items: order.items.map((item, index) => ({
        seq: index + 1,
        brandName: item.product.brand.name,
        productName: item.product.name,
        spec: [item.sph, item.cyl, item.axis].filter(Boolean).join(' / ') || '-',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        sph: item.sph,
        cyl: item.cyl,
        axis: item.axis,
        memo: item.memo,
      })),
      shippingSlip: order.shippingSlips[0] ? {
        slipNo: order.shippingSlips[0].slipNo,
        status: order.shippingSlips[0].status,
        courier: order.shippingSlips[0].courier,
        trackingNo: order.shippingSlips[0].trackingNo,
      } : null,
    })
  } catch (error) {
    console.error('Failed to get print data:', error)
    return NextResponse.json({ error: '출력 데이터를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}
