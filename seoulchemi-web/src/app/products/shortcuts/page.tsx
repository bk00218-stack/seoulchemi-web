'use client'

import { useState } from 'react'
import Layout, { cardStyle } from '../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../constants/sidebar'

// 목업 데이터
const mockShortcuts = [
  { id: 1, key: 'F1', product: '다비치 단초점 1.60', brand: '다비치', price: 80000, category: '렌즈' },
  { id: 2, key: 'F2', product: '다비치 단초점 1.67', brand: '다비치', price: 120000, category: '렌즈' },
  { id: 3, key: 'F3', product: '에실로 누진 1.60', brand: '에실로', price: 250000, category: '렌즈' },
  { id: 4, key: 'F4', product: '블루라이트 코팅', brand: '-', price: 30000, category: '코팅' },
  { id: 5, key: 'F5', product: '변색 코팅', brand: '-', price: 50000, category: '코팅' },
  { id: 6, key: 'F6', product: '메탈 하금테', brand: '자체', price: 50000, category: '프레임' },
  { id: 7, key: 'F7', product: '티타늄 무테', brand: '자체', price: 150000, category: '프레임' },
  { id: 8, key: 'F8', product: null, brand: null, price: null, category: null },
  { id: 9, key: 'F9', product: null, brand: null, price: null, category: null },
  { id: 10, key: 'F10', product: null, brand: null, price: null, category: null },
  { id: 11, key: 'F11', product: null, brand: null, price: null, category: null },
  { id: 12, key: 'F12', product: null, brand: null, price: null, category: null },
]

const numpadShortcuts = [
  { id: 101, key: 'Num1', product: '콘택트렌즈 1Day', brand: '아큐브', price: 35000, category: '콘택트' },
  { id: 102, key: 'Num2', product: '콘택트렌즈 2Week', brand: '아큐브', price: 25000, category: '콘택트' },
  { id: 103, key: 'Num3', product: '콘택트렌즈 Monthly', brand: '바슈롬', price: 20000, category: '콘택트' },
  { id: 104, key: 'Num4', product: null, brand: null, price: null, category: null },
  { id: 105, key: 'Num5', product: null, brand: null, price: null, category: null },
  { id: 106, key: 'Num6', product: null, brand: null, price: null, category: null },
  { id: 107, key: 'Num7', product: null, brand: null, price: null, category: null },
  { id: 108, key: 'Num8', product: null, brand: null, price: null, category: null },
  { id: 109, key: 'Num9', product: null, brand: null, price: null, category: null },
]

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

export default function ShortcutsPage() {
  const [shortcuts, setShortcuts] = useState(mockShortcuts)
  const [numpad] = useState(numpadShortcuts)
  const [selectedShortcut, setSelectedShortcut] = useState<typeof mockShortcuts[0] | null>(null)
  const [showModal, setShowModal] = useState(false)

  const assignedCount = shortcuts.filter(s => s.product).length
  const numpadAssigned = numpad.filter(s => s.product).length

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case '렌즈': return { bg: '#e3f2fd', color: '#1976d2' }
      case '코팅': return { bg: '#f3e5f5', color: '#7b1fa2' }
      case '프레임': return { bg: '#e8f5e9', color: '#388e3c' }
      case '콘택트': return { bg: '#fff3e0', color: '#f57c00' }
      default: return { bg: 'var(--gray-100)', color: 'var(--gray-500)' }
    }
  }

  const handleShortcutClick = (shortcut: typeof mockShortcuts[0]) => {
    setSelectedShortcut(shortcut)
    setShowModal(true)
  }

  const handleClear = () => {
    if (selectedShortcut) {
      setShortcuts(shortcuts.map(s => 
        s.id === selectedShortcut.id 
          ? { ...s, product: null, brand: null, price: null, category: null }
          : s
      ))
      setShowModal(false)
    }
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>단축키 설정</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          POS에서 빠르게 상품을 선택할 수 있도록 키보드 단축키를 설정합니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>펑션키 (F1-F12)</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            <span style={{ color: '#007aff' }}>{assignedCount}</span>
            <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--gray-400)' }}> / 12 설정됨</span>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>넘패드 (Num1-9)</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            <span style={{ color: '#34c759' }}>{numpadAssigned}</span>
            <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--gray-400)' }}> / 9 설정됨</span>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>미설정 슬롯</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff9500' }}>
            {21 - assignedCount - numpadAssigned}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span>
          </div>
        </div>
      </div>

      {/* 펑션키 단축키 */}
      <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>⌨️ 펑션키 (F1 - F12)</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {shortcuts.map(shortcut => (
            <div
              key={shortcut.id}
              onClick={() => handleShortcutClick(shortcut)}
              style={{
                padding: 16,
                borderRadius: 12,
                border: shortcut.product ? '2px solid #007aff' : '2px dashed var(--gray-200)',
                background: shortcut.product ? '#f0f8ff' : 'var(--gray-50)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: shortcut.product ? '#007aff' : 'var(--gray-300)',
                  color: '#fff',
                }}>
                  {shortcut.key}
                </span>
                {shortcut.category && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    ...getCategoryColor(shortcut.category),
                  }}>
                    {shortcut.category}
                  </span>
                )}
              </div>
              {shortcut.product ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{shortcut.product}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{shortcut.brand}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#007aff', marginTop: 8 }}>
                    {shortcut.price?.toLocaleString()}원
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--gray-400)', padding: '8px 0' }}>
                  클릭하여 상품 등록
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 넘패드 단축키 */}
      <div style={{ ...cardStyle, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>🔢 넘패드 (Num 1 - 9)</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 600 }}>
          {numpad.map(shortcut => (
            <div
              key={shortcut.id}
              onClick={() => alert('넘패드 단축키 설정 기능 준비중')}
              style={{
                padding: 16,
                borderRadius: 12,
                border: shortcut.product ? '2px solid #34c759' : '2px dashed var(--gray-200)',
                background: shortcut.product ? '#f0fff4' : 'var(--gray-50)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: shortcut.product ? '#34c759' : 'var(--gray-300)',
                  color: '#fff',
                }}>
                  {shortcut.key}
                </span>
                {shortcut.category && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    ...getCategoryColor(shortcut.category),
                  }}>
                    {shortcut.category}
                  </span>
                )}
              </div>
              {shortcut.product ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{shortcut.product}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#34c759', marginTop: 4 }}>
                    {shortcut.price?.toLocaleString()}원
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--gray-400)', padding: '4px 0' }}>
                  미설정
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 설정 모달 */}
      {showModal && selectedShortcut && (
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
            width: 400,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, margin: '0 0 8px' }}>
              {selectedShortcut.key} 단축키 설정
            </h3>
            <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: '0 0 24px' }}>
              {selectedShortcut.product ? '현재 설정된 상품을 변경하거나 해제할 수 있습니다.' : '이 단축키에 연결할 상품을 선택하세요.'}
            </p>
            
            {selectedShortcut.product && (
              <div style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 8 }}>현재 설정</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{selectedShortcut.product}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{selectedShortcut.brand} · {selectedShortcut.price?.toLocaleString()}원</div>
              </div>
            )}

            <div style={{ padding: 30, textAlign: 'center', color: 'var(--gray-400)', background: 'var(--gray-50)', borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🚧</div>
              <p style={{ margin: 0, fontSize: 13 }}>상품 선택 기능 준비중</p>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              {selectedShortcut.product && (
                <button
                  onClick={handleClear}
                  style={{ ...btnStyle, background: '#fff0f0', color: '#ff3b30' }}
                >
                  해제
                </button>
              )}
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
