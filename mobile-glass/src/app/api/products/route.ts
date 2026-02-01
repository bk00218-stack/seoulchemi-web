import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: [{ brand: { displayOrder: 'asc' } }, { name: 'asc' }],
    include: { brand: true }
  })
  
  return NextResponse.json(products.map(p => ({
    id: p.id,
    name: p.name,
    brandName: p.brand.name,
    optionType: p.optionType,
    refractiveIndex: p.refractiveIndex,
    sellingPrice: p.sellingPrice,
    hasSph: p.hasSph,
    hasCyl: p.hasCyl,
    hasAxis: p.hasAxis
  })))
}
