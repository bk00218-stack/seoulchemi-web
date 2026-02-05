// 매입처 관리 API
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 매입처 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // active, inactive, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { contactName: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { purchases: true }
          }
        }
      }),
      prisma.supplier.count({ where })
    ])

    // 통계 추가
    const stats = await prisma.supplier.aggregate({
      _sum: { outstandingAmount: true },
      _count: { id: true }
    })

    return NextResponse.json({
      suppliers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalSuppliers: stats._count.id,
        totalOutstanding: stats._sum.outstandingAmount || 0
      }
    })
  } catch (error) {
    console.error('Failed to fetch suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

// 매입처 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, code, contactName, phone, email, address, bankInfo, memo, creditLimit, paymentTermDays } = body

    if (!name || !code) {
      return NextResponse.json({ error: '매입처명과 코드는 필수입니다' }, { status: 400 })
    }

    // 코드 중복 체크
    const existing = await prisma.supplier.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: '이미 존재하는 매입처 코드입니다' }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code,
        contactName,
        phone,
        email,
        address,
        bankInfo,
        memo,
        creditLimit: creditLimit || 0,
        paymentTermDays: paymentTermDays || 30,
      }
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Failed to create supplier:', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
