const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // 케미그라스 매입처 찾기 또는 생성
  let supplier = await prisma.supplier.findFirst({
    where: { name: '케미그라스' }
  })
  
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: { name: '케미그라스', code: 'CHEMIGLASS', isActive: true }
    })
    console.log('Created supplier:', supplier)
  } else {
    console.log('Found supplier:', supplier)
  }
  
  // 케미 브랜드 찾기
  const kemiBrand = await prisma.brand.findFirst({
    where: { name: '케미' }
  })
  
  if (kemiBrand) {
    // 케미 브랜드에 매입처 연결
    await prisma.brand.update({
      where: { id: kemiBrand.id },
      data: { supplierId: supplier.id }
    })
    console.log(`Updated 케미 brand (id: ${kemiBrand.id}) with supplierId: ${supplier.id}`)
  } else {
    console.log('케미 brand not found!')
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
