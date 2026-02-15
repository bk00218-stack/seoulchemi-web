import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/crm/customers/[id]/prescriptions - 도수 기록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customerId = parseInt(id)
    
    const prescriptions = await prisma.customerPrescription.findMany({
      where: { customerId },
      orderBy: { measuredAt: 'desc' },
    })

    return NextResponse.json(prescriptions)
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return NextResponse.json(
      { error: '도수 기록을 불러오는데 실패했습니다' },
      { status: 500 }
    )
  }
}

// POST /api/crm/customers/[id]/prescriptions - 도수 기록 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const customerId = parseInt(id)
    const body = await request.json()

    // 고객 존재 확인
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: '고객을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const prescription = await prisma.customerPrescription.create({
      data: {
        customerId,
        measuredAt: body.measuredAt ? new Date(body.measuredAt) : new Date(),
        measuredBy: body.measuredBy || null,
        
        // 우안 (OD)
        odSph: body.odSph || null,
        odCyl: body.odCyl || null,
        odAxis: body.odAxis || null,
        odAdd: body.odAdd || null,
        odPd: body.odPd || null,
        odVa: body.odVa || null,
        odBc: body.odBc || null,
        odDia: body.odDia || null,
        
        // 좌안 (OS)
        osSph: body.osSph || null,
        osCyl: body.osCyl || null,
        osAxis: body.osAxis || null,
        osAdd: body.osAdd || null,
        osPd: body.osPd || null,
        osVa: body.osVa || null,
        osBc: body.osBc || null,
        osDia: body.osDia || null,
        
        // 양안 PD
        pdFar: body.pdFar || null,
        pdNear: body.pdNear || null,
        
        prescType: body.prescType || 'glasses',
        dominantEye: body.dominantEye || null,
        occupation: body.occupation || null,
        hobbies: body.hobbies || null,
        currentGlasses: body.currentGlasses || null,
        wearingTime: body.wearingTime || null,
        complaints: body.complaints || null,
        eyeConditions: body.eyeConditions || null,
        medicalHistory: body.medicalHistory || null,
        memo: body.memo || null,
      },
    })

    // 고객 최근 방문일 업데이트
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        lastVisitAt: new Date(),
        visitCount: { increment: 1 },
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    console.error('Error creating prescription:', error)
    return NextResponse.json(
      { error: '도수 기록 저장에 실패했습니다' },
      { status: 500 }
    )
  }
}
