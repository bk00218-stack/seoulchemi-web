'use client'

import { useToast } from '@/contexts/ToastContext'
import { useState, useEffect } from 'react'
import Layout, { cardStyle } from '../../../components/Layout'
import { PRODUCTS_SIDEBAR } from '../../../constants/sidebar'

interface OptimalSetting {
  id: string
  brandName: string
  productName: string
  minStock: number
  maxStock: number
  reorderPoint: number
  currentAvg: number
  status: 'ok' | 'warning' | 'critical'
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--gray-200)',
  fontSize: 14,
  outline: 'none',
  width: 60,
  textAlign: 'center' as const,
}

const btnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
}

interface ProductOption {
  id: number
  productId: number
  stock: number
  product: {
    id: number
    name: string
    brand: { name: string } | null
  }
}

export default function OptimalStockPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<OptimalSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // 설정값과 실제 재고 데이터를 동시에 조회
      const [settingsRes, stockRes] = await Promise.all([
        fetch('/api/admin/settings?group=stock.optimal'),
        fetch('/api/admin/stock'),
      ])
      const settingsData = await settingsRes.json()
      const stockData = await stockRes.json()

      // 저장된 적정재고 설정 파싱
      const savedItems: Record<string, { minStock: number; maxStock: number; reorderPoint: number }> = {}
      try {
        const raw = settingsData.settings?.['stock.optimal.items']
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              savedItems[item.key] = { minStock: item.minStock || 0, maxStock: item.maxStock || 10, reorderPoint: item.reorderPoint || 3 }
            }
          }
        }
      } catch { /* ignore parse error */ }

      // 실제 재고 데이터에서 상품별 평균 재고 계산
      const options: ProductOption[] = stockData.options || []
      const productMap = new Map<number, { name: string; brand: string; stocks: number[] }>()
      for (const opt of options) {
        if (!opt.product) continue
        const existing = productMap.get(opt.productId)
        if (existing) {
          existing.stocks.push(opt.stock)
        } else {
          productMap.set(opt.productId, {
            name: opt.product.name,
            brand: opt.product.brand?.name || '-',
            stocks: [opt.stock],
          })
        }
      }

      // OptimalSetting 배열 생성
      const items: OptimalSetting[] = []
      productMap.forEach((data, productId) => {
        const key = `p${productId}`
        const saved = savedItems[key]
        const avgStock = data.stocks.length > 0
          ? data.stocks.reduce((a, b) => a + b, 0) / data.stocks.length
          : 0
        const minStock = saved?.minStock ?? 2
        const maxStock = saved?.maxStock ?? 10
        const reorderPoint = saved?.reorderPoint ?? 4

        let status: 'ok' | 'warning' | 'critical' = 'ok'
        if (avgStock <= minStock) status = 'critical'
        else if (avgStock <= reorderPoint) status = 'warning'

        items.push({
          id: key,
          brandName: data.brand,
          productName: data.name,
          minStock,
          maxStock,
          reorderPoint,
          currentAvg: Math.round(avgStock * 10) / 10,
          status,
        })
      })

      setSettings(items)
    } catch (e) {
      console.error('Failed to fetch optimal stock data:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredSettings = settings.filter(s =>
    s.brandName.toLowerCase().includes(search.toLowerCase()) ||
    s.productName.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: settings.length,
    ok: settings.filter(s => s.status === 'ok').length,
    warning: settings.filter(s => s.status === 'warning').length,
    critical: settings.filter(s => s.status === 'critical').length,
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ok': return { bg: '#e8f5e9', color: '#34c759', label: '적정' }
      case 'warning': return { bg: '#fff3e0', color: '#ff9500', label: '주의' }
      case 'critical': return { bg: '#ffebee', color: '#ff3b30', label: '위험' }
      default: return { bg: 'var(--gray-100)', color: 'var(--gray-500)', label: '-' }
    }
  }

  const handleValueChange = (id: string, field: 'minStock' | 'maxStock' | 'reorderPoint', value: number) => {
    setSettings(prev => {
      const updated = prev.map(s => {
        if (s.id !== id) return s
        const newS = { ...s, [field]: value }
        // 상태 재계산
        if (newS.currentAvg <= newS.minStock) newS.status = 'critical'
        else if (newS.currentAvg <= newS.reorderPoint) newS.status = 'warning'
        else newS.status = 'ok'
        return newS
      })
      return updated
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      const items = settings.map(s => ({
        key: s.id,
        minStock: s.minStock,
        maxStock: s.maxStock,
        reorderPoint: s.reorderPoint,
      }))
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { 'stock.optimal.items': JSON.stringify(items) } }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('적정 재고 설정이 저장되었습니다.')
        setHasChanges(false)
      } else {
        toast.error(data.error || '저장 실패')
      }
    } catch {
      toast.error('저장 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>로딩 중...</div>
      </Layout>
    )
  }

  return (
    <Layout sidebarMenus={PRODUCTS_SIDEBAR} activeNav="상품">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>적정 재고 설정</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: 14, margin: 0 }}>
          품목별 최소/최대 재고 수량과 재주문 시점을 설정합니다. 재고 알림에 활용됩니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: 'var(--gray-400)', fontSize: 13, marginBottom: 4 }}>전체 품목</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{stats.total}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: '#34c759', fontSize: 13, marginBottom: 4 }}>적정 재고</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#34c759' }}>{stats.ok}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: '#ff9500', fontSize: 13, marginBottom: 4 }}>재고 주의</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff9500' }}>{stats.warning}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ color: '#ff3b30', fontSize: 13, marginBottom: 4 }}>재고 위험</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: '#ff3b30' }}>{stats.critical}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 4 }}>개</span></div>
        </div>
      </div>

      {/* 도움말 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, background: '#f0f8ff', border: '1px solid #007aff20' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
            <strong>최소 재고</strong>: 이 수량 이하가 되면 &apos;위험&apos; 알림이 발생합니다.<br/>
            <strong>재주문점</strong>: 이 수량 이하가 되면 &apos;주의&apos; 알림과 함께 발주를 권장합니다.<br/>
            <strong>최대 재고</strong>: 과잉 재고를 방지하기 위한 권장 최대 수량입니다.
          </div>
        </div>
      </div>

      {/* 필터 및 버튼 */}
      <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 브랜드, 품목 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 280, textAlign: 'left' as const }}
        />
        {hasChanges && (
          <button onClick={handleSave} style={{ ...btnStyle, background: '#34c759', color: '#fff' }}>
            변경사항 저장
          </button>
        )}
      </div>

      {/* 설정 목록 */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>브랜드</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--gray-500)' }}>상품</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>최소</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>(위험)</span>
                </div>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>재주문점</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>(주의)</span>
                </div>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span>최대</span>
                  <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>(권장)</span>
                </div>
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 100 }}>현재 평균</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, color: 'var(--gray-500)', width: 80 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredSettings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                  {search ? '검색 결과가 없습니다.' : '재고 데이터가 없습니다.'}
                </td>
              </tr>
            ) : (
              filteredSettings.map(setting => {
                const statusStyle = getStatusStyle(setting.status)
                return (
                  <tr key={setting.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, background: 'var(--gray-100)', color: 'var(--gray-600)' }}>
                        {setting.brandName}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>{setting.productName}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        value={setting.minStock}
                        onChange={e => handleValueChange(setting.id, 'minStock', parseInt(e.target.value) || 0)}
                        style={{ ...inputStyle, borderColor: '#ff3b30' }}
                      />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        value={setting.reorderPoint}
                        onChange={e => handleValueChange(setting.id, 'reorderPoint', parseInt(e.target.value) || 0)}
                        style={{ ...inputStyle, borderColor: '#ff9500' }}
                      />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        value={setting.maxStock}
                        onChange={e => handleValueChange(setting.id, 'maxStock', parseInt(e.target.value) || 0)}
                        style={{ ...inputStyle, borderColor: '#34c759' }}
                      />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 500 }}>
                      {setting.currentAvg.toFixed(1)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}>
                        {statusStyle.label}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
