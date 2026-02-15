'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
  { href: '/crm', label: '대시보드', icon: '🏠' },
  { href: '/crm/customers', label: '고객관리', icon: '👥' },
  { href: '/crm/sales', label: '판매관리', icon: '💰' },
  { href: '/crm/orders', label: '렌즈주문', icon: '📦' },
  { href: '/crm/reports', label: '통계/리포트', icon: '📊' },
  { href: '/crm/settings', label: '설정', icon: '⚙️' },
]

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 모바일 헤더 */}
      <header className="lg:hidden bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-blue-600">안경원 CRM</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* 로고 */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/crm" className="flex items-center gap-2">
            <span className="text-2xl">👓</span>
            <span className="text-xl font-bold text-blue-600">안경원 CRM</span>
          </Link>
        </div>

        {/* 메뉴 */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/crm' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 하단 정보 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            <p className="font-medium text-gray-700">행복안경원</p>
            <p>서울 강남구 테헤란로 123</p>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* PWA 하단 네비게이션 (모바일) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="flex justify-around">
          {menuItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/crm' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center py-2 px-3 min-w-[64px]
                  ${isActive ? 'text-blue-600' : 'text-gray-500'}
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 모바일 하단 패딩 */}
      <div className="lg:hidden h-16" />
    </div>
  )
}
