'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminOrdersNewRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/orders/new')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-500">잠시만 기다려주세요...</div>
    </div>
  )
}
