// 공통 사이드바 메뉴 설정
// 모든 페이지에서 동일한 사이드바를 사용하도록 통일

export interface SidebarMenu {
  title: string
  items: { label: string; href: string }[]
}

export const ORDER_SIDEBAR: SidebarMenu[] = [
  {
    title: '주문',
    items: [
      { label: '대시보드', href: '/' },
      { label: '온라인 여벌 주문', href: '/orders/online-spare' },
      { label: '온라인 RX 주문', href: '/orders/rx' },
      { label: '주문 등록', href: '/orders/new' },
      { label: '명세표 출력이력', href: '/orders/print-history' },
    ]
  },
  {
    title: '출고',
    items: [
      { label: '통합 출고', href: '/orders/shipping' },
      { label: '여벌 출고', href: '/orders/shipping/spare' },
      { label: 'RX 출고', href: '/orders/delivery' },
    ]
  }
]

export const PURCHASE_SIDEBAR: SidebarMenu[] = [
  {
    title: '매입관리',
    items: [
      { label: '매입내역', href: '/purchase' },
      { label: '매입등록', href: '/purchase/new' },
    ]
  },
  {
    title: '매입처 관리',
    items: [
      { label: '매입처 목록', href: '/purchase/suppliers' },
      { label: '미납금 관리', href: '/purchase/outstanding' },
    ]
  }
]

export const PRODUCTS_SIDEBAR: SidebarMenu[] = [
  {
    title: '상품관리',
    items: [
      { label: '브랜드 관리', href: '/products/brands' },
      { label: '판매상품 관리', href: '/products' },
      { label: 'RX상품 관리', href: '/products/rx' },
    ]
  },
  {
    title: '재고관리',
    items: [
      { label: '재고 현황', href: '/products/inventory' },
      { label: '재고 조정', href: '/products/stock-adjust' },
    ]
  }
]

export const STORES_SIDEBAR: SidebarMenu[] = [
  {
    title: '관리',
    items: [
      { label: '가맹점 관리', href: '/stores' },
      { label: '담당자 관리', href: '/stores/delivery-staff' },
      { label: '가맹점 거래내역', href: '/stores/transactions' },
      { label: '가맹점 공지사항', href: '/stores/notices' },
    ]
  },
  {
    title: '정산',
    items: [
      { label: '정산관리', href: '/stores/settle' },
    ]
  },
  {
    title: '그룹관리',
    items: [
      { label: '그룹별 가맹점 연결', href: '/stores/groups' },
      { label: '그룹별 할인율 설정', href: '/stores/groups/discounts' },
      { label: '그룹별 타입 설정', href: '/stores/groups/types' },
    ]
  }
]

export const STATS_SIDEBAR: SidebarMenu[] = [
  {
    title: '통계',
    items: [
      { label: '매출 통계', href: '/stats' },
      { label: '상품별 통계', href: '/stats/products' },
      { label: '가맹점별 통계', href: '/stats/stores' },
    ]
  },
  {
    title: '리포트',
    items: [
      { label: '일별 리포트', href: '/stats/daily' },
      { label: '월별 리포트', href: '/stats/monthly' },
    ]
  }
]

export const SETTINGS_SIDEBAR: SidebarMenu[] = [
  {
    title: '기본설정',
    items: [
      { label: '회사정보', href: '/settings' },
      { label: '사용자 관리', href: '/settings/users' },
      { label: '프린터 설정', href: '/settings/printer' },
    ]
  },
  {
    title: '시스템',
    items: [
      { label: '데이터 관리', href: '/settings/data' },
      { label: '백업/복원', href: '/settings/backup' },
    ]
  }
]

// 메뉴 키별 사이드바 매핑
export const SIDEBAR_MAP = {
  order: ORDER_SIDEBAR,
  purchase: PURCHASE_SIDEBAR,
  products: PRODUCTS_SIDEBAR,
  stores: STORES_SIDEBAR,
  stats: STATS_SIDEBAR,
  settings: SETTINGS_SIDEBAR,
} as const

export type MenuKey = keyof typeof SIDEBAR_MAP
