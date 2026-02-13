/**
 * 데이터베이스 백업 스크립트
 * Neon PostgreSQL → JSON 파일 백업
 * 
 * 사용: npx tsx scripts/backup-db.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupDir = path.join(process.cwd(), 'backups')
  
  // 백업 디렉토리 생성
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  console.log('📦 데이터베이스 백업 시작...\n')

  const data: Record<string, unknown[]> = {}
  const counts: Record<string, number> = {}

  try {
    // 각 테이블 백업
    const tables = [
      { name: 'brands', query: () => prisma.brand.findMany() },
      { name: 'products', query: () => prisma.product.findMany() },
      { name: 'productOptions', query: () => prisma.productOption.findMany() },
      { name: 'stores', query: () => prisma.store.findMany() },
      { name: 'storeGroups', query: () => prisma.storeGroup.findMany() },
      { name: 'orders', query: () => prisma.order.findMany() },
      { name: 'orderItems', query: () => prisma.orderItem.findMany() },
      { name: 'suppliers', query: () => prisma.supplier.findMany() },
      { name: 'purchases', query: () => prisma.purchase.findMany() },
      { name: 'purchaseItems', query: () => prisma.purchaseItem.findMany() },
      { name: 'transactions', query: () => prisma.transaction.findMany() },
      { name: 'categories', query: () => prisma.category.findMany() },
      { name: 'settings', query: () => prisma.setting.findMany() },
      { name: 'users', query: () => prisma.user.findMany({ 
        select: { 
          id: true, email: true, username: true, name: true, 
          role: true, permissions: true, storeId: true, isActive: true,
          createdAt: true, updatedAt: true
          // password 제외
        }
      })},
      { name: 'notices', query: () => prisma.notice.findMany() },
      { name: 'smsTemplates', query: () => prisma.smsTemplate.findMany() },
      { name: 'shippingZones', query: () => prisma.shippingZone.findMany() },
      { name: 'diopterRanges', query: () => prisma.diopterRange.findMany() },
      { name: 'deliveryStaff', query: () => prisma.deliveryStaff.findMany() },
      { name: 'salesStaff', query: () => prisma.salesStaff.findMany() },
    ]

    for (const table of tables) {
      process.stdout.write(`  백업 중: ${table.name}... `)
      const rows = await table.query()
      data[table.name] = rows
      counts[table.name] = rows.length
      console.log(`${rows.length}건`)
    }

    // JSON 파일로 저장
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`)
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf-8')

    // 메타데이터
    const meta = {
      timestamp,
      tables: counts,
      totalRecords: Object.values(counts).reduce((a, b) => a + b, 0),
      file: backupFile,
      size: fs.statSync(backupFile).size
    }

    const metaFile = path.join(backupDir, `backup-${timestamp}.meta.json`)
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2), 'utf-8')

    console.log('\n✅ 백업 완료!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`📁 파일: ${backupFile}`)
    console.log(`📊 총 레코드: ${meta.totalRecords}`)
    console.log(`💾 파일 크기: ${(meta.size / 1024).toFixed(2)} KB`)

    // 오래된 백업 정리 (7일 이상)
    const files = fs.readdirSync(backupDir)
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    let deleted = 0
    
    for (const file of files) {
      const filePath = path.join(backupDir, file)
      const stat = fs.statSync(filePath)
      if (stat.mtime.getTime() < cutoff) {
        fs.unlinkSync(filePath)
        deleted++
      }
    }
    
    if (deleted > 0) {
      console.log(`🗑️ 오래된 백업 ${deleted}개 삭제`)
    }

  } catch (error) {
    console.error('\n❌ 백업 실패:', error)
    process.exit(1)
  }
}

backup()
  .finally(() => prisma.$disconnect())
