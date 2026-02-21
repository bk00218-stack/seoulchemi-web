'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  id: number
  name: string
  brand: string
  optionType?: string
  price: number
  qty: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'>) => void
  updateQty: (id: number, delta: number) => void
  removeItem: (id: number) => void
  clearCart: () => void
  totalCount: number
  totalPrice: number
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
      const saved = localStorage.getItem('store-cart')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch {
      localStorage.removeItem('store-cart')
    }
    setLoaded(true)
  }, [])

  // 변경될 때마다 localStorage 저장
  useEffect(() => {
    if (loaded) {
      localStorage.setItem('store-cart', JSON.stringify(items))
    }
  }, [items, loaded])

  const addItem = (product: Omit<CartItem, 'qty'>) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
    ))
  }

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem('store-cart')
  }

  const totalCount = items.reduce((sum, item) => sum + item.qty, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}
