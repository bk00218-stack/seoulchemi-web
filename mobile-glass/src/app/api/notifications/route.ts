import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 알림 타입
type NotificationType = 'order_new' | 'order_shipped' | 'payment_due' | 'low_stock' | 'return_request'

// 알림 설정 (실제로는 DB에서 가져와야 함)
const NOTIFICATION_CONFIG = {
  kakao: {
    enabled: false,
    apiKey: process.env.KAKAO_API_KEY,
    senderId: process.env.KAKAO_SENDER_ID,
  },
  sms: {
    enabled: false,
    apiKey: process.env.SMS_API_KEY,
    senderId: process.env.SMS_SENDER_ID,
  },
  webhook: {
    enabled: true,
    url: process.env.NOTIFICATION_WEBHOOK_URL,
  }
}

// GET /api/notifications - 알림 이력 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // 작업 로그에서 알림 관련 조회
    const logs = await prisma.workLog.findMany({
      where: {
        workType: { startsWith: 'notification_' }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      notifications: logs,
      config: {
        kakao: NOTIFICATION_CONFIG.kakao.enabled,
        sms: NOTIFICATION_CONFIG.sms.enabled,
        webhook: NOTIFICATION_CONFIG.webhook.enabled
      }
    })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ error: '알림 조회에 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/notifications - 알림 전송
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, message, recipients, data } = body

    if (!type || !message) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 })
    }

    const results: { channel: string; success: boolean; error?: string }[] = []

    // 카카오 알림톡
    if (NOTIFICATION_CONFIG.kakao.enabled && recipients?.kakao) {
      try {
        // 실제 카카오 API 호출 코드 (예시)
        // const kakaoResult = await sendKakaoNotification(recipients.kakao, message)
        results.push({ channel: 'kakao', success: true })
      } catch (error: any) {
        results.push({ channel: 'kakao', success: false, error: error.message })
      }
    }

    // SMS
    if (NOTIFICATION_CONFIG.sms.enabled && recipients?.sms) {
      try {
        // 실제 SMS API 호출 코드 (예시)
        // const smsResult = await sendSMS(recipients.sms, message)
        results.push({ channel: 'sms', success: true })
      } catch (error: any) {
        results.push({ channel: 'sms', success: false, error: error.message })
      }
    }

    // Webhook
    if (NOTIFICATION_CONFIG.webhook.enabled && NOTIFICATION_CONFIG.webhook.url) {
      try {
        const webhookRes = await fetch(NOTIFICATION_CONFIG.webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            title,
            message,
            data,
            timestamp: new Date().toISOString()
          })
        })
        results.push({ channel: 'webhook', success: webhookRes.ok })
      } catch (error: any) {
        results.push({ channel: 'webhook', success: false, error: error.message })
      }
    }

    // 로그 기록
    await prisma.workLog.create({
      data: {
        workType: `notification_${type}`,
        targetType: 'notification',
        description: `알림 전송: ${title || type}`,
        details: JSON.stringify({ message, recipients, results })
      }
    })

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
    return NextResponse.json({ error: '알림 전송에 실패했습니다.' }, { status: 500 })
  }
}

// 알림 헬퍼 함수들
export async function sendOrderNotification(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, store: true }
  })

  if (!order) return

  const storeName = order.store?.name || '알 수 없음'
  const message = `[새 주문] ${storeName}\n주문번호: ${order.orderNo}\n금액: ${order.totalAmount.toLocaleString()}원\n품목: ${order.items.length}개`

  // 웹훅으로 알림
  if (NOTIFICATION_CONFIG.webhook.url) {
    try {
      await fetch(NOTIFICATION_CONFIG.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_new',
          title: '새 주문',
          message,
          data: { orderId, orderNo: order.orderNo, storeName, totalAmount: order.totalAmount }
        })
      })
    } catch (error) {
      console.error('Failed to send order notification:', error)
    }
  }
}

export async function sendLowStockNotification(productId: number, productName: string, stock: number) {
  const message = `[재고 부족] ${productName}\n현재 재고: ${stock}개`

  if (NOTIFICATION_CONFIG.webhook.url) {
    try {
      await fetch(NOTIFICATION_CONFIG.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'low_stock',
          title: '재고 부족 알림',
          message,
          data: { productId, productName, stock }
        })
      })
    } catch (error) {
      console.error('Failed to send low stock notification:', error)
    }
  }
}
