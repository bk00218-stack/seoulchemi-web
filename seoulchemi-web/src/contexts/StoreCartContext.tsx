'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  id: number
  name: string
  brand: string
  optionType?: string
  price: number
  qty: number
  // 도수 정보 (여벌렌즈용)
  sph?: string
  cyl?: string
  axis?: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  addItemWithDiopter: (item: Omit<CartItem, 'qty'>, sph: string, cyl: string, qty: number) => void
  updateQty: (cartKey: string, delta: number) => void
  removeItem: (cartKey: string) => void
  clearCart: () => void
  totalCount: number
  totalPrice: number
}

// 장바구니 아이템의 고유 키 생성 (id + 도수 조합)
function getCartKey(item: { id: number; sph?: string; cyl?: string }): string {
  if (item.sph && item.cyl) {
    return `${item.id}-${item.sph}-${item.cyl}`
  }
  return `${item.id}`
}

const CartContext = createContext<CartContextType | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within StoreCartProvider')
  return ctx
}

export function StoreCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // localStorage에서 초기 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem('store-cart-v2')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch {
      localStorage.removeItem('store-cart-v2')
    }
    setLoaded(true)
  }, [])

  // 변경될 때마다 localStorage 저장
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('store-cart-v2', JSON.stringify(items))
    }
  }, [items, loaded])

  // 일반 상품 추가 (도수 없음 - RX, 콘택트렌즈 등)
  const addItem = (product: Omit<CartItem, 'qty'>, qty: number = 1) => {
    setItems(prev => {
      const key = getCartKey(product)
      const existing = prev.find(item => getCartKey(item) === key)
      if (existing) {
        return prev.map(item =>
          getCartKey(item) === key ? { ...item, qty: item.qty + qty } : item
        )
      }
      return [...prev, { ...product, qty }]
    })
  }

  // 도수 포함 상품 추가 (여벌렌즈)
  const addItemWithDiopter = (product: Omit<CartItem, 'qty'>, sph: string, cyl: string, qty: number) => {
    const itemWithDiopter = { ...product, sph, cyl }
    setItems(prev => {
      const key = getCartKey(itemWithDiopter)
      const existing = prev.find(item => getCartKey(item) === key)
      if (existing) {
        return prev.map(item =>
          getCartKey(item) === key ? { ...item, qty: item.qty + qty } : item
        )
      }
      return [...prev, { ...itemWithDiopter, qty }]
    })
  }

  const updateQty = (cartKey: string, delta: number) => {
    setItems(prev => prev.map(item =>
      getCartKey(item) === cartKey ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ))
  }

  const removeItem = (cartKey: string) => {
    setItems(prev => prev.filter(item => getCartKey(item) !== cartKey))
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem('store-cart-v2')
  }

  const totalCount = items.reduce((sum, item) => sum + item.qty, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      addItemWithDiopter,
      updateQty, 
      removeItem, 
      clearCart, 
      totalCount, 
      totalPrice 
    }}>
      {children}
    </CartContext.Provider>
  )
}
