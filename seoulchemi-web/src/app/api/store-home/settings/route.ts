import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// 기본값 정의
const DEFAULTS = {
  banners: [] as any[],
  bannerAutoPlay: true,
  bannerInterval: 5,
  hero: {
    topLabel: '안경렌즈 전문 주문 시스템',
    title: 'LensChoice',
    subtitle: '{count}개 상품을 간편하게 주문하세요',
    buttonText: '전체 상품 보기 →',
    buttonLink: '/store/products',
    gradientStart: '#007aff',
    gradientEnd: '#0056b3',
    isVisible: true,
  },
  categories: {
    showAll: true,
    selectedIds: [] as number[],
    customMeta: {} as Record<string, { icon: string; color: string; bg: string }>,
    sectionTitle: '카테고리별 주문',
    isVisible: true,
  },
  quickMenu: [
    { id: 'products', icon: '🛒', label: '상품주문', sub: '전체 상품', href: '/store/products', color: '#007aff', bg: '#e3f2fd', isVisible: true, order: 1 },
    { id: 'orders', icon: '📋', label: '주문내역', sub: '주문 확인', href: '/store/orders', color: '#34c759', bg: '#e8f5e9', isVisible: true, order: 2 },
    { id: 'account', icon: '💰', label: '잔액조회', sub: '미수금 확인', href: '/store/account', color: '#ff9500', bg: '#fff3e0', isVisible: true, order: 3 },
  ],
}

function safeJsonParse(str: string | undefined, fallback: any) {
  if (!str) return fallback
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

// GET: 스토어 홈 설정 조회 (public - 인증 불필요)
export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { startsWith: 'storeHome.' } },
    })

    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }

    return NextResponse.json({
      banners: safeJsonParse(map['storeHome.banners'], DEFAULTS.banners),
      bannerAutoPlay: map['storeHome.bannerAutoPlay'] !== undefined
        ? map['storeHome.bannerAutoPlay'] === 'true'
        : DEFAULTS.bannerAutoPlay,
      bannerInterval: map['storeHome.bannerInterval']
        ? Number(map['storeHome.bannerInterval'])
        : DEFAULTS.bannerInterval,
      hero: {
        ...DEFAULTS.hero,
        ...safeJsonParse(map['storeHome.hero'], {}),
      },
      categories: {
        ...DEFAULTS.categories,
        ...safeJsonParse(map['storeHome.categories'], {}),
      },
      quickMenu: safeJsonParse(map['storeHome.quickMenu'], DEFAULTS.quickMenu),
    })
  } catch (error) {
    console.error('Store home settings fetch failed:', error)
    // 에러 시에도 기본값 반환
    return NextResponse.json(DEFAULTS)
  }
}
