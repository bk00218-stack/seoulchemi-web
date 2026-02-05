import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tax-invoices - 세금계산서 목록
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (storeId) {
      where.storeId = parseInt(storeId)
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (startDate || endDate) {
      where.issueDate = {}
      if (startDate) {
        where.issueDate.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.issueDate.lte = end
      }
    }

    const total = await prisma.taxInvoice.count({ where })

    const invoices = await prisma.taxInvoice.findMany({
      where,
      include: {
        items: true
      },
      orderBy: { issueDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // 통계
    const stats = await prisma.taxInvoice.groupBy({
      by: ['status'],
      _count: true,
      _sum: { totalAmount: true }
    })

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        issued: stats.find(s => s.status === 'issued')?._count || 0,
        sent: stats.find(s => s.status === 'sent')?._count || 0,
        cancelled: stats.find(s => s.status === 'cancelled')?._count || 0,
        totalAmount: stats
          .filter(s => s.status !== 'cancelled')
          .reduce((sum, s) => sum + (s._sum.totalAmount || 0), 0)
      }
    })
  } catch (error) {
    console.error('Failed to fetch tax invoices:', error)
    return NextResponse.json({ error: '세금계산서 조회에 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/tax-invoices - 세금계산서 발행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, supplyDate, items, memo } = body

    if (!storeId || !items || items.length === 0) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    // 가맹점 정보
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    })

    if (!store) {
      return NextResponse.json({ error: '가맹점을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 계산서 번호 생성
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const count = await prisma.taxInvoice.count({
      where: {
        issueDate: {
          gte: new Date(year, today.getMonth(), 1),
          lt: new Date(year, today.getMonth() + 1, 1)
        }
      }
    })
    const invoiceNo = `TX${year}${month}-${String(count + 1).padStart(5, '0')}`

    // 금액 계산
    const supplyAmount = items.reduce((sum: number, item: any) => sum + item.supplyAmount, 0)
    const taxAmount = Math.round(supplyAmount * 0.1)
    const totalAmount = supplyAmount + taxAmount

    // 세금계산서 생성
    const invoice = await prisma.taxInvoice.create({
      data: {
        invoiceNo,
        storeId,
        // 공급자 정보 (설정에서 가져와야 하지만 하드코딩)
        supplierBizNo: '123-45-67890',
        supplierName: '서울케미',
        supplierCeoName: '홍길동',
        supplierAddress: '서울시 강남구',
        supplierBizType: '도매업',
        supplierBizItem: '안경렌즈',
        // 공급받는자 정보
        buyerBizNo: store.bizNo || '',
        buyerName: store.name,
        buyerCeoName: store.ownerName || '',
        buyerAddress: store.address || '',
        // 금액
        supplyAmount,
        taxAmount,
        totalAmount,
        // 날짜
        issueDate: today,
        supplyDate: supplyDate ? new Date(supplyDate) : today,
        // 상태
        status: 'issued',
        memo,
        // 품목
        items: {
          create: items.map((item: any, idx: number) => ({
            seq: idx + 1,
            itemDate: supplyDate ? new Date(supplyDate) : today,
            itemName: item.itemName,
            specification: item.specification || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            supplyAmount: item.supplyAmount,
            taxAmount: Math.round(item.supplyAmount * 0.1),
            memo: item.memo
          }))
        }
      },
      include: {
        items: true
      }
    })

    // 작업 로그
    await prisma.workLog.create({
      data: {
        workType: 'tax_invoice_create',
        targetType: 'tax_invoice',
        targetId: invoice.id,
        targetNo: invoiceNo,
        description: `세금계산서 발행: ${store.name} - ${totalAmount.toLocaleString()}원`
      }
    })

    return NextResponse.json({
      success: true,
      invoice
    })
  } catch (error) {
    console.error('Failed to create tax invoice:', error)
    return NextResponse.json({ error: '세금계산서 발행에 실패했습니다.' }, { status: 500 })
  }
}
