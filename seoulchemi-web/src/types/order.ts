// 주문 관련 타입 정의

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type OrderType = 'stock' | 'rx'
export type ShippingStatus = 'pending' | 'picking' | 'packed' | 'shipped'
export type TransactionType = 'sale' | 'deposit' | 'return' | 'adjustment'
export type PaymentMethod = 'transfer' | 'cash' | 'card' | 'check'

export interface OrderItem {
  id: number
  productId: number
  productName: string
  brandName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sph?: string | null
  cyl?: string | null
  axis?: string | null
  bc?: string | null
  dia?: string | null
  memo?: string | null
}

export interface Order {
  id: number
  orderNo: string
  orderType: OrderType
  status: OrderStatus
  storeId: number
  storeName: string
  storeCode: string
  totalAmount: number
  memo?: string | null
  orderedAt: string
  confirmedAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  items: OrderItem[]
}

export interface ShippingSlip {
  id: number
  slipNo: string
  orderId: number
  status: ShippingStatus
  pickedBy?: string | null
  pickedAt?: string | null
  packedBy?: string | null
  packedAt?: string | null
  shippedBy?: string | null
  shippedAt?: string | null
  courier?: string | null
  trackingNo?: string | null
  items: ShippingSlipItem[]
}

export interface ShippingSlipItem {
  id: number
  slipId: number
  orderItemId: number
  productId: number
  productName: string
  optionName?: string | null
  sph?: string | null
  cyl?: string | null
  axis?: string | null
  quantity: number
  location?: string | null
  barcode?: string | null
  isPicked: boolean
  pickedAt?: string | null
}

export interface Store {
  id: number
  code: string
  name: string
  phone?: string | null
  address?: string | null
  ownerName?: string | null
  isActive: boolean
  outstandingAmount: number
  creditLimit: number
  paymentTermDays: number
  lastPaymentAt?: string | null
}

export interface Transaction {
  id: number
  storeId: number
  type: TransactionType
  amount: number
  balanceAfter: number
  orderId?: number | null
  orderNo?: string | null
  paymentMethod?: PaymentMethod | null
  bankName?: string | null
  depositor?: string | null
  memo?: string | null
  processedBy?: string | null
  processedAt: string
}

export interface WorkLog {
  id: number
  workType: string
  targetType: string
  targetId?: number | null
  targetNo?: string | null
  description: string
  details?: string | null
  userName?: string | null
  pcName?: string | null
  createdAt: string
}

// API 응답 타입
export interface OrderListResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    todayOrders: number
    pending: number
    confirmed: number
    shipped: number
    delivered: number
    todayTotal: number
  }
  brands?: { id: number; name: string }[]
}

export interface OrderDetailResponse {
  order: Order & {
    store: Store
    shippingSlips: ShippingSlip[]
  }
  workLogs: WorkLog[]
}

export interface DashboardResponse {
  summary: {
    today: { orders: number; amount: number }
    yesterday: { orders: number; amount: number }
    thisWeek: { orders: number; amount: number }
    thisMonth: { orders: number; amount: number }
    lastMonth: { orders: number; amount: number }
  }
  status: {
    pending: number
    confirmed: number
    shipped: number
    delivered: number
    cancelled: number
  }
  pendingOrders: {
    id: number
    orderNo: string
    storeName: string
    storeCode: string
    itemCount: number
    totalAmount: number
    orderedAt: string
  }[]
  todayShipping: {
    id: number
    orderNo: string
    storeName: string
    totalAmount: number
  }[]
  dailyTrend: {
    date: string
    orders: number
    amount: number
  }[]
  alerts: {
    overLimitStores: {
      id: number
      name: string
      code: string
      outstanding: number
      limit: number
      overBy: number
    }[]
  }
}

// 상태 라벨 및 색상
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '대기', color: '#f59e0b', bg: '#fef3c7' },
  confirmed: { label: '확인', color: '#3b82f6', bg: '#dbeafe' },
  shipped: { label: '출고', color: '#8b5cf6', bg: '#ede9fe' },
  delivered: { label: '완료', color: '#10b981', bg: '#d1fae5' },
  cancelled: { label: '취소', color: '#ef4444', bg: '#fee2e2' },
}

export const SHIPPING_STATUS_CONFIG: Record<ShippingStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '대기', color: '#6b7280', bg: '#f3f4f6' },
  picking: { label: '피킹중', color: '#f59e0b', bg: '#fef3c7' },
  packed: { label: '포장완료', color: '#3b82f6', bg: '#dbeafe' },
  shipped: { label: '출고완료', color: '#10b981', bg: '#d1fae5' },
}

export const TRANSACTION_TYPE_CONFIG: Record<TransactionType, { label: string; color: string; bg: string }> = {
  sale: { label: '매출', color: '#ef4444', bg: '#fee2e2' },
  deposit: { label: '입금', color: '#10b981', bg: '#d1fae5' },
  return: { label: '반품', color: '#f59e0b', bg: '#fef3c7' },
  adjustment: { label: '조정', color: '#3b82f6', bg: '#dbeafe' },
}
