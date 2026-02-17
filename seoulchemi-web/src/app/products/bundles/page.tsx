'use client'

import { useToast } from '@/contexts/ToastContext'

import { useState } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

// 목업 데이터
const mockBundles = [
  { 
    id: 1, 
    name: '기본 안경 세트', 
    description: '프레임 + 단초점 렌즈', 
    items: [
      { type: '프레임', name: '메탈 하금테', qty: 1 },
      { type: '렌즈', name: '다비치 단초점 1.60', qty: 2 },
    ],
    bundlePrice: 150000,
    originalPrice: 180000,
    discount: 17,
    isActive: true,
    salesCount: 45,
  },
  { 
    id: 2, 
    name: '프리미엄 누진 세트', 
    description: '고급 프레임 + 누진 렌즈', 
    items: [
      { type: '프레임', name: '티타늄 무테', qty: 1 },
      { type: '렌즈', name: '에실로 누진 1.60', qty: 2 },
    ],
    bundlePrice: 450000,
    originalPrice: 550000,
    discount: 18,
    isActive: true,
    salesCount: 23,
  },
  { 
    id: 3, 
    name: '학생 패키지', 
    description: '학생용 프레임 + 블루라이트 차단', 
    items: [
      { type: '프레임', name: 'TR-90 경량 프레임', qty: 1 },
      { type: '렌즈', name: '블루라이트 차단 1.56', qty: 2 },
      { type: '케이스', name: '하드케이스', qty: 1 },
    ],
    bundlePrice: 89000,
    originalPrice: 120000,
    discount: 26,
    isActive: true,
    salesCount: 128,
  },
  { 
    id: 4, 
    name: '선글라스 도수 세트', 
    description: '선글라스 + 도수렌즈', 
    items: [
      { type: '프레임', name: '선글라스 프레임', qty: 1 },
      { type: '렌즈', name: '틴티드 도수렌즈 1.60', qty: 2 },
    ],
    bundlePrice: 180000,
    originalPrice: 220000,
    discount: 18,
    isActive: false,
    salesCount: 8,
  },
]

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--gray-200)',
  fontSize: 14,
  outline: 'none',
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

export default function BundlesPage() {
  const { toast } = useToast()
  const [bundles] = useState(mockBundles)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [expandedBundle, setExpandedBundle] = useState<number | null>(null)

  const filteredBundles = bundles.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.description.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: bundles.length,
    active: bundles.filter(b => b.isActive).length,
    totalSales: bundles.reduce((sum, b) => sum + b.salesCount, 0),
    avgDiscount: Math.round(bundles.reduce((sum, b) => sum + b.discount, 0) / bundles.length),
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>묶음상품 관리</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          여러 상품을 묶어 할인된 가격으로 판매하는 패키지 상품을 관리합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>전체 묶음상품</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.total}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>판매중</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#34c759' }}>{stats.active}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>누적 판매</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#007aff' }}>{stats.totalSales}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>건</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>평균 할인율</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff3b30' }}>{stats.avgDiscount}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>%</span></div>
        </div>
      </div>

      {/* 필터 및 등록 버튼 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 묶음상품명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 300 }}
        />
        <button
          onClick={() => setShowModal(true)}
          style={{ ...btnStyle, background: '#007aff', color: '#fff' }}
        >
          + 묶음상품 등록
        </button>
      </div>

      {/* 묶음상품 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {filteredBundles.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <p>등록된 묶음상품이 없습니다.</p>
          </div>
        ) : (
          filteredBundles.map(bundle => (
            <div key={bundle.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
              {/* 묶음상품 헤더 */}
              <div
                onClick={() => setExpandedBundle(expandedBundle === bundle.id ? null : bundle.id)}
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: expandedBundle === bundle.id ? 'var(--gray-50)' : '#fff',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--gray-100)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    🎁
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{bundle.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{bundle.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#007aff' }}>{bundle.bundlePrice.toLocaleString()}원</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', textDecoration: 'line-through' }}>{bundle.originalPrice.toLocaleString()}원</div>
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    background: '#ffebee',
                    color: '#ff3b30',
                  }}>
                    -{bundle.discount}%
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    background: bundle.isActive ? '#e8f5e9' : '#fef3e7',
                    color: bundle.isActive ? '#34c759' : '#ff9500',
                  }}>
                    {bundle.isActive ? '판매중' : '중지'}
                  </span>
                  <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>{expandedBundle === bundle.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* 구성 상품 (확장 시) */}
              {expandedBundle === bundle.id && (
                <div style={{ padding: '0 16px 16px', background: 'var(--gray-50)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 12 }}>구성 상품</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {bundle.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#fff', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 11, background: 'var(--gray-100)', color: 'var(--gray-600)' }}>{item.type}</span>
                        <span style={{ flex: 1, fontSize: 14 }}>{item.name}</span>
                        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>x{item.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                      판매 <strong>{bundle.salesCount}</strong>건
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toast.info('수정 기능 준비중')}
                        style={{ padding: '8px 16px', borderRadius: 6, background: '#fff', color: '#007aff', border: '1px solid var(--gray-200)', fontSize: 13, cursor: 'pointer' }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => toast.info('삭제 기능 준비중')}
                        style={{ padding: '8px 16px', borderRadius: 6, background: '#fff0f0', color: '#ff3b30', border: 'none', fontSize: 13, cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 등록 모달 (placeholder) */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 28,
            width: 500,
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, margin: '0 0 24px' }}>묶음상품 등록</h3>
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)', background: 'var(--gray-50)', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
              <p style={{ margin: 0 }}>묶음상품 등록 기능 준비중입니다.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ ...btnStyle, background: 'var(--gray-100)', color: '#1d1d1f' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
