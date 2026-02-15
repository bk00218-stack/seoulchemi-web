import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PRINT_SERVER_URL = 'http://localhost:9100'

// 출고지시서 텍스트 생성 (POS 프린터용 80mm)
function generateShippingSlip(order: {
  orderNo: string
  storeName: string
  storeCode: string
  orderedAt: Date
  totalAmount: number
  items: {
    productName: string
    brandName: string
    sph?: string | null
    cyl?: string | null
    quantity: number
    unitPrice: number
  }[]
}): string {
  const line = '='.repeat(42)
  const dash = '-'.repeat(42)
  const now = new Date()
  
  let slip = ''
  
  // 헤더
  slip += '\n'
  slip += centerText('출 고 지 시 서', 42) + '\n'
  slip += line + '\n'
  
  // 주문 정보
  slip += `주문번호: ${order.orderNo}\n`
  slip += `거래처: ${order.storeName} (${order.storeCode})\n`
  slip += `주문일: ${formatDate(order.orderedAt)}\n`
  slip += `출력일: ${formatDate(now)} ${formatTime(now)}\n`
  slip += dash + '\n'
  
  // 상품 목록
  slip += padRight('상품명', 20) + padRight('도수', 12) + padLeft('수량', 10) + '\n'
  slip += dash + '\n'
  
  for (const item of order.items) {
    const diopter = [item.sph, item.cyl].filter(Boolean).join('/') || '-'
    slip += padRight(truncate(item.productName, 18), 20)
    slip += padRight(diopter, 12)
    slip += padLeft(item.quantity.toString(), 10) + '\n'
  }
  
  slip += dash + '\n'
  
  // 합계
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0)
  slip += padRight('합계', 32) + padLeft(totalQty.toString() + '개', 10) + '\n'
  slip += padRight('금액', 32) + padLeft(order.totalAmount.toLocaleString() + '원', 10) + '\n'
  
  slip += line + '\n'
  slip += '\n\n\n' // 여백
  
  return slip
}

// 유틸 함수들
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2))
  return ' '.repeat(padding) + text
}

function padRight(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - text.length))
}

function padLeft(text: string, width: number): string {
  return ' '.repeat(Math.max(0, width - text.length)) + text
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen - 2) + '..'
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// POST: 출력 요청
export async function POST(request: NextRequest) {
  try {
    const { orderId, type = 'shipping' } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId 필요' }, { status: 400 })
    }

    // 주문 정보 조회
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
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
    }

    // 출고지시서 생성
    const slipContent = generateShippingSlip({
      orderNo: order.orderNo,
      storeName: order.store.name,
      storeCode: order.store.code,
      orderedAt: order.orderedAt,
      totalAmount: order.totalAmount,
      items: order.items.map(item => ({
        productName: item.product.name,
        brandName: item.product.brand.name,
        sph: item.sph,
        cyl: item.cyl,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    })

    // 프린트 서버로 전송
    try {
      const printRes = await fetch(`${PRINT_SERVER_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          content: slipContent,
          orderNo: order.orderNo
        })
      })

      if (!printRes.ok) {
        const error = await printRes.json()
        return NextResponse.json({ 
          error: '프린트 서버 오류', 
          details: error 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: '출력 요청 완료',
        orderNo: order.orderNo
      })

    } catch (fetchError) {
      // 프린트 서버 연결 실패
      return NextResponse.json({ 
        error: '프린트 서버에 연결할 수 없습니다. print-server.js가 실행 중인지 확인하세요.',
        hint: 'node scripts/print-server.js'
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Print API error:', error)
    return NextResponse.json({ error: '출력 실패' }, { status: 500 })
  }
}

// GET: 프린트 서버 상태 확인
export async function GET() {
  try {
    const res = await fetch(`${PRINT_SERVER_URL}/status`)
    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({ 
        connected: true, 
        ...data 
      })
    }
    return NextResponse.json({ connected: false })
  } catch {
    return NextResponse.json({ 
      connected: false,
      hint: 'node scripts/print-server.js 실행 필요'
    })
  }
}
