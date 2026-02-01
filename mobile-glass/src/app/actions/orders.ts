'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// 주문번호 생성
function generateOrderNo() {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = (now.getMonth() + 1).toString().padStart(2, '0')
  const d = now.getDate().toString().padStart(2, '0')
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `MG${y}${m}${d}-${rand}`
}

export async function createOrder(formData: FormData) {
  const storeId = parseInt(formData.get('storeId') as string)
  const memo = formData.get('memo') as string
  const productIds = formData.getAll('productIds').map(id => parseInt(id as string))
  
  if (!storeId) {
    return { error: '가맹점을 선택해주세요.' }
  }
  
  if (productIds.length === 0) {
    return { error: '상품을 선택해주세요.' }
  }
  
  // 선택된 상품 조회
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  })
  
  // 총 금액 계산
  const totalAmount = products.reduce((sum, p) => sum + p.sellingPrice, 0)
  
  // 주문 생성
  const order = await prisma.order.create({
    data: {
      orderNo: generateOrderNo(),
      storeId,
      status: 'pending',
      totalAmount,
      memo: memo || null,
      orderedAt: new Date(),
      items: {
        create: products.map((p) => ({
          productId: p.id,
          quantity: 1,
          unitPrice: p.sellingPrice,
          totalPrice: p.sellingPrice
        }))
      }
    },
    include: {
      store: true,
      items: { include: { product: true } }
    }
  })
  
  revalidatePath('/orders')
  
  return { success: true, order }
}

export async function getRecentOrders() {
  return await prisma.order.findMany({
    orderBy: { orderedAt: 'desc' },
    include: {
      store: true,
      items: { include: { product: true } }
    },
    take: 20
  })
}

export async function updateOrderStatus(orderId: number, status: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status }
  })
  revalidatePath('/orders')
  return { success: true }
}
