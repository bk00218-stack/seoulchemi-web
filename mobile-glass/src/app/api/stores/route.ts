import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  const stores = await prisma.store.findMany({
    orderBy: { name: 'asc' }
  })
  
  return NextResponse.json({ stores })
}
