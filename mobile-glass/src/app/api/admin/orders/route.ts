import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  
  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }
  
  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderedAt: 'desc' },
    include: { 
      store: true,
      items: { 
        include: { 
          product: { 
            include: { brand: true } 
          } 
        } 
      }
    },
    take: 100
  })
  
  return NextResponse.json({ orders })
}
