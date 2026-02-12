import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface StoreData {
  code: string
  name: string
  ownerName?: string
  businessRegNo?: string
  phone?: string
  address?: string
  businessType?: string
  businessCategory?: string
  billingDay?: number
  outstandingAmount?: number
  storeType?: string
  email?: string
  areaCode?: string
  status?: string
  isActive?: boolean
}

async function main() {
  console.log('Loading store data...')
  
  // Load JSON data
  const jsonPath = path.join(__dirname, '../../stores_import.json')
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const stores: StoreData[] = JSON.parse(rawData)
  
  console.log(`Loaded ${stores.length} stores`)
  
  // Delete existing data
  console.log('Deleting existing data...')
  
  await prisma.storeBrandDiscount.deleteMany({})
  await prisma.storeProductDiscount.deleteMany({})
  await prisma.storeProductPrice.deleteMany({})
  await prisma.storeGroupMember.deleteMany({})
  await prisma.transaction.deleteMany({})
  
  await prisma.shippingSlipItem.deleteMany({})
  await prisma.shippingSlip.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  
  const deleted = await prisma.store.deleteMany({})
  console.log(`Deleted ${deleted.count} existing stores`)
  
  // Insert new stores
  console.log('Inserting new stores...')
  
  const usedCodes = new Set<string>()
  let inserted = 0
  let skipped = 0
  
  for (const store of stores) {
    try {
      if (!store.name) {
        skipped++
        continue
      }
      
      let storeCode = store.code ? String(store.code).trim() : String(Date.now())
      
      // Handle duplicate codes
      if (usedCodes.has(storeCode)) {
        storeCode = storeCode + '_' + Date.now()
      }
      usedCodes.add(storeCode)
      
      await prisma.store.create({
        data: {
          code: storeCode,
          name: String(store.name).trim(),
          ownerName: store.ownerName ? String(store.ownerName).trim() : null,
          phone: store.phone ? String(store.phone).trim() : null,
          address: store.address ? String(store.address).trim() : null,
          businessType: store.businessType ? String(store.businessType).trim() : null,
          businessCategory: store.businessCategory ? String(store.businessCategory).trim() : null,
          businessRegNo: store.businessRegNo ? String(store.businessRegNo).trim() : null,
          email: store.email ? String(store.email).trim() : null,
          billingDay: store.billingDay ? parseInt(String(store.billingDay)) : null,
          outstandingAmount: store.outstandingAmount ? parseInt(String(store.outstandingAmount)) : 0,
          areaCode: store.areaCode ? String(store.areaCode).trim() : null,
          storeType: store.storeType ? String(store.storeType).trim() : null,
          status: store.status || 'active',
          isActive: store.isActive !== false,
          paymentTermDays: 30,
        },
      })
      inserted++
      
      if (inserted % 100 === 0) {
        console.log(`Progress: ${inserted}/${stores.length}`)
      }
    } catch (e: any) {
      console.error(`Error inserting ${store.name}: ${e.message}`)
      skipped++
    }
  }
  
  console.log(`\nDone!`)
  console.log(`Inserted: ${inserted}`)
  console.log(`Skipped: ${skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
