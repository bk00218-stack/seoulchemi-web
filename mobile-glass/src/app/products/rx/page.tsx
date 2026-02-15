'use client'

import { useState } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

// 목업 데이터
const mockRxProducts = [
  { id: 1, name: '다비치 단초점 1.60', brand: '다비치', type: '단초점', index: '1.60', sphRange: '-8.00 ~ +6.00', cylRange: '0.00 ~ -4.00', price: 80000, isActive: true },
  { id: 2, name: '다비치 단초점 1.67', brand: '다비치', type: '단초점', index: '1.67', sphRange: '-10.00 ~ +8.00', cylRange: '0.00 ~ -4.00', price: 120000, isActive: true },
  { id: 3, name: '에실로 누진 1.60', brand: '에실로', type: '누진', index: '1.60', sphRange: '-6.00 ~ +4.00', cylRange: '0.00 ~ -2.00', price: 250000, isActive: true },
  { id: 4, name: '호야 누진 1.67', brand: '호야', type: '누진', index: '1.67', sphRange: '-8.00 ~ +6.00', cylRange: '0.00 ~ -3.00', price: 350000, isActive: false },
  { id: 5, name: '자이스 중근용 1.60', brand: '자이스', type: '중근용', index: '1.60', sphRange: '-4.00 ~ +4.00', cylRange: '0.00 ~ -2.00', price: 180000, isActive: true },
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

export default function RxProductsPage() {
  const [products] = useState(mockRxProducts)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.brand.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || p.type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: products.length,
    active: products.filter(p => p.isActive).length,
    single: products.filter(p => p.type === '단초점').length,
    progressive: products.filter(p => p.type === '누진').length,
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>RX상품 관리</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          처방 렌즈 상품을 관리합니다. 도수 범위, 굴절률, 가격 등을 설정할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>전체 RX상품</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.total}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>활성 상품</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#34c759' }}>{stats.active}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>단초점</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#007aff' }}>{stats.single}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>누진/중근용</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#5856d6' }}>{stats.progressive}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
      </div>

      {/* 필터 및 등록 버튼 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 상품명, 브랜드 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 280 }}
          />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ ...inputStyle, minWidth: 120 }}
          >
            <option value="all">전체 타입</option>
            <option value="단초점">단초점</option>
            <option value="누진">누진</option>
            <option value="중근용">중근용</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ ...btnStyle, background: '#007aff', color: '#fff' }}
        >
          + RX상품 등록
        </button>
      </div>

      {/* 상품 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👓</div>
            <p>등록된 RX상품이 없습니다.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>상품명</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 80 }}>브랜드</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 70 }}>타입</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 60 }}>굴절률</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 140 }}>SPH 범위</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 140 }}>CYL 범위</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>기본가</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 70 }}>상태</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 500 }}>{product.name}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--gray-500)' }}>{product.brand}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      background: product.type === '단초점' ? '#e3f2fd' : product.type === '누진' ? '#f3e5f5' : '#e8f5e9',
                      color: product.type === '단초점' ? '#1976d2' : product.type === '누진' ? '#7b1fa2' : '#388e3c',
                    }}>
                      {product.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace' }}>{product.index}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'monospace', color: 'var(--gray-600)' }}>{product.sphRange}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'monospace', color: 'var(--gray-600)' }}>{product.cylRange}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500 }}>{product.price.toLocaleString()}원</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      background: product.isActive ? '#e8f5e9' : '#fef3e7',
                      color: product.isActive ? '#34c759' : '#ff9500',
                    }}>
                      {product.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => alert('수정 기능 준비중')}
                      style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--gray-100)', color: '#007aff', border: 'none', fontSize: 12, cursor: 'pointer' }}
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, margin: '0 0 24px' }}>RX상품 등록</h3>
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)', background: 'var(--gray-50)', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
              <p style={{ margin: 0 }}>RX상품 등록 기능 준비중입니다.</p>
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
