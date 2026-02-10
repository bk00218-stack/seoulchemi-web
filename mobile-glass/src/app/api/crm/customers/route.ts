import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/crm/customers - 고객 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const storeId = searchParams.get('storeId') || '1' // TODO: 세션에서 가져오기
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'lastVisitAt'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      storeId: parseInt(storeId),
      isActive: true,
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const orderBy: any = {}
    if (sortBy === 'name') {
      orderBy.name = 'asc'
    } else if (sortBy === 'lastVisitAt') {
      orderBy.lastVisitAt = 'desc'
    } else if (sortBy === 'totalPurchase') {
      orderBy.totalPurchase = 'desc'
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          phone: true,
          birthDate: true,
          lastVisitAt: true,
          visitCount: true,
          totalPurchase: true,
          totalPoints: true,
          memo: true,
        },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: '고객 목록을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/crm/customers - 신규 고객 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const storeId = body.storeId || 1 // TODO: 세션에서 가져오기

    // 필수 값 검증
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: '고객명을 입력해주세요' },
        { status: 400 }
      )
    }
    if (!body.phone?.trim()) {
      return NextResponse.json(
        { error: '전화번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 전화번호 중복 확인
    const existing = await prisma.customer.findFirst({
      where: {
        storeId,
        phone: body.phone,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 전화번호입니다', existingId: existing.id },
        { status: 409 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        storeId,
        name: body.name.trim(),
        phone: body.phone.trim(),
        phone2: body.phone2?.trim() || null,
        email: body.email?.trim() || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        gender: body.gender || null,
        zipcode: body.zipcode || null,
        address: body.address || null,
        addressDetail: body.addressDetail || null,
        memo: body.memo || null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
        smsAgree: body.smsAgree ?? true,
        emailAgree: body.emailAgree ?? false,
        firstVisitAt: new Date(),
        lastVisitAt: new Date(),
        visitCount: 1,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: '고객 등록에 실패했습니다' },
      { status: 500 }
    )
  }
}
