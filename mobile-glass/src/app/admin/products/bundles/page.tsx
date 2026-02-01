'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../components/DataTable'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'

interface Bundle {
  id: number
  name: string
  products: string[]
  regularPrice: number
  bundlePrice: number
  discount: number
  stock: number
  status: string
}

const sampleData: Bundle[] = [
  { id: 1, name: '에실로 베스트 세트', products: ['크리잘 사파이어', '크리잘 블루컷'], regularPrice: 160000, bundlePrice: 140000, discount: 12.5, stock: 30, status: 'active' },
  { id: 2, name: '호야 인기상품 세트', products: ['블루컨트롤', '루스나'], regularPrice: 148000, bundlePrice: 125000, discount: 15.5, stock: 25, status: 'active' },
  { id: 3, name: '프리미엄 누진 세트', products: ['바리락스 X', '드라이브세이프'], regularPrice: 670000, bundlePrice: 580000, discount: 13.4, stock: 10, status: 'active' },
  { id: 4, name: '신규 가맹점 패키지', products: ['크리잘 블루컷', '블루컨트롤', '씨맥스'], regularPrice: 215000, bundlePrice: 180000, discount: 16.3, stock: 0, status: 'inactive' },
]

export default function BundlesPage() {
  const [showModal, setShowModal] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null)

  const columns: Column<Bundle>[] = [
    { key: 'name', label: '묶음상품명', render: (v) => (
      <span style={{ fontWeight: 500 }}>{v as string}</span>
    )},
    { key: 'products', label: '구성 상품', width: '250px', render: (v) => (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {(v as string[]).map((product, idx) => (
          <span key={idx} style={{ 
            background: '#f5f5f7', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '11px',
            color: '#666'
          }}>
            {product}
          </span>
        ))}
      </div>
    )},
    { key: 'regularPrice', label: '정가', align: 'right', render: (v) => (
      <span style={{ color: '#86868b', textDecoration: 'line-through' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'bundlePrice', label: '묶음가', align: 'right', render: (v) => (
      <span style={{ fontWeight: 600, color: '#007aff' }}>{(v as number).toLocaleString()}원</span>
    )},
    { key: 'discount', label: '할인율', align: 'center', render: (v) => (
      <span style={{ 
        background: '#ffebee', 
        color: '#ff3b30', 
        padding: '2px 8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        fontWeight: 500
      }}>
        -{v}%
      </span>
    )},
    { key: 'stock', label: '재고', align: 'center', render: (v) => (
      <span style={{ 
        fontWeight: 600, 
        color: (v as number) === 0 ? '#ff3b30' : '#34c759' 
      }}>
        {v as number}
      </span>
    )},
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v as string} /> },
    { key: 'id', label: '관리', align: 'center', render: (_, row) => (
      <button
        onClick={() => { setEditingBundle(row); setShowModal(true); }}
        style={{
          padding: '4px 10px',
          borderRadius: '4px',
          background: '#f5f5f7',
          color: '#007aff',
          border: 'none',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        수정
      </button>
    )},
  ]

  return (
    <AdminLayout activeMenu="products">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        묶음상품 설정
      </h2>

      <div style={{ 
        background: '#f0f7ff', 
        borderRadius: '12px', 
        padding: '16px 20px', 
        marginBottom: '24px',
        border: '1px solid #007aff20'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🎁</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#007aff' }}>묶음상품 안내</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              여러 상품을 하나의 세트로 묶어 할인된 가격에 판매할 수 있습니다. 
              가맹점에서 인기 상품 조합을 확인하고 묶음 상품을 구성해보세요.
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 묶음상품</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#1d1d1f' }}>
            {sampleData.length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>
            {sampleData.filter(b => b.status === 'active').length}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>개</span>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>평균 할인율</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff3b30' }}>
            {(sampleData.reduce((sum, b) => sum + b.discount, 0) / sampleData.length).toFixed(1)}
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>%</span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="묶음상품명 검색"
        actions={
          <button
            onClick={() => { setEditingBundle(null); setShowModal(true); }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + 묶음상품 등록
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={sampleData}
        emptyMessage="등록된 묶음상품이 없습니다"
      />

      {/* 등록/수정 모달 */}
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
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingBundle ? '묶음상품 수정' : '묶음상품 등록'}
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>묶음상품명 *</label>
              <input type="text" defaultValue={editingBundle?.name} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>구성 상품 *</label>
              <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>상품을 선택하여 추가하세요</div>
              <select style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                <option value="">상품 선택</option>
                <option value="1">크리잘 사파이어</option>
                <option value="2">크리잘 블루컷</option>
                <option value="3">블루컨트롤</option>
                <option value="4">바리락스 X</option>
              </select>
              {editingBundle && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {editingBundle.products.map((p, idx) => (
                    <span key={idx} style={{ background: '#e3f2fd', color: '#007aff', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {p}
                      <button style={{ background: 'none', border: 'none', color: '#007aff', cursor: 'pointer', fontSize: '14px' }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>정가</label>
                <input type="number" defaultValue={editingBundle?.regularPrice} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>묶음가 *</label>
                <input type="number" defaultValue={editingBundle?.bundlePrice} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>재고</label>
                <input type="number" defaultValue={editingBundle?.stock} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>상태</label>
                <select defaultValue={editingBundle?.status || 'active'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '14px' }}>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}>취소</button>
              <button onClick={() => { alert('저장되었습니다.'); setShowModal(false); }} style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
