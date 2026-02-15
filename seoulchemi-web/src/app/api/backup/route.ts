import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// GET /api/backup - 백업 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 백업 폴더 확인/생성
    try {
      await fs.access(BACKUP_DIR)
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true })
    }

    // 백업 파일 목록
    const files = await fs.readdir(BACKUP_DIR)
    const backups = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const stat = await fs.stat(path.join(BACKUP_DIR, f))
          return {
            filename: f,
            size: stat.size,
            createdAt: stat.birthtime.toISOString()
          }
        })
    )

    // 최신순 정렬
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      backups,
      backupDir: BACKUP_DIR
    })
  } catch (error) {
    console.error('Failed to list backups:', error)
    return NextResponse.json({ error: '백업 목록 조회에 실패했습니다.' }, { status: 500 })
  }
}

// POST /api/backup - 백업 생성
export async function POST(request: NextRequest) {
  try {
    // 백업 폴더 확인/생성
    try {
      await fs.access(BACKUP_DIR)
    } catch {
      await fs.mkdir(BACKUP_DIR, { recursive: true })
    }

    // 전체 데이터 조회
    const [
      brands,
      products,
      productOptions,
      stores,
      storeGroups,
      orders,
      orderItems,
      transactions,
      users,
      settings
    ] = await Promise.all([
      prisma.brand.findMany(),
      prisma.product.findMany(),
      prisma.productOption.findMany(),
      prisma.store.findMany(),
      prisma.storeGroup.findMany(),
      prisma.order.findMany(),
      prisma.orderItem.findMany(),
      prisma.transaction.findMany(),
      prisma.user.findMany({ select: { id: true, email: true, username: true, name: true, role: true, storeId: true, isActive: true, createdAt: true } }),
      prisma.setting.findMany()
    ])

    const backupData = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      data: {
        brands,
        products,
        productOptions,
        stores,
        storeGroups,
        orders,
        orderItems,
        transactions,
        users,
        settings
      },
      counts: {
        brands: brands.length,
        products: products.length,
        productOptions: productOptions.length,
        stores: stores.length,
        orders: orders.length,
        users: users.length
      }
    }

    // 파일 저장
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `backup-${timestamp}.json`
    const filepath = path.join(BACKUP_DIR, filename)

    await fs.writeFile(filepath, JSON.stringify(backupData, null, 2))

    // 오래된 백업 정리 (최근 10개만 유지)
    const files = await fs.readdir(BACKUP_DIR)
    const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json')).sort().reverse()
    
    for (let i = 10; i < backupFiles.length; i++) {
      await fs.unlink(path.join(BACKUP_DIR, backupFiles[i]))
    }

    // 로그 기록
    await prisma.workLog.create({
      data: {
        workType: 'backup_create',
        targetType: 'system',
        description: `백업 생성: ${filename}`,
        details: JSON.stringify(backupData.counts)
      }
    })

    return NextResponse.json({
      success: true,
      filename,
      counts: backupData.counts
    })
  } catch (error) {
    console.error('Failed to create backup:', error)
    return NextResponse.json({ error: '백업 생성에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/backup - 백업 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json({ error: '파일명이 필요합니다.' }, { status: 400 })
    }

    // 경로 검증 (보안)
    if (filename.includes('..') || !filename.endsWith('.json')) {
      return NextResponse.json({ error: '잘못된 파일명입니다.' }, { status: 400 })
    }

    const filepath = path.join(BACKUP_DIR, filename)
    await fs.unlink(filepath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete backup:', error)
    return NextResponse.json({ error: '백업 삭제에 실패했습니다.' }, { status: 500 })
  }
}
