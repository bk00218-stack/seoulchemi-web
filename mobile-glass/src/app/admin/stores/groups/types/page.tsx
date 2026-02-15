'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '../../../../components/Navigation'
import DataTable, { StatusBadge, Column } from '../../../../components/DataTable'
import SearchFilter from '../../../../components/SearchFilter'

interface GroupType {
  id: number
  code: string
  name: string
  description: string | null
  defaultDiscountRate: number
  priority: number
  color: string
  storeCount: number
  isActive: boolean
  createdAt: string
}

export default function GroupTypesPage() {
  const [types, setTypes] = useState<GroupType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState<GroupType | null>(null)
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    defaultDiscountRate: 0,
    priority: 1,
    color: '#007aff',
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Mock data for now
      const mockTypes: GroupType[] = [
        { id: 1, code: 'VIP', name: 'VIP', description: 'VIP 가맹점 그룹', defaultDiscountRate: 15, priority: 1, color: '#ff9500', storeCount: 25, isActive: true, createdAt: '2024-01-15' },
        { id: 2, code: 'WHOLESALE', name: '도매', description: '도매 거래 가맹점', defaultDiscountRate: 20, priority: 2, color: '#34c759', storeCount: 12, isActive: true, createdAt: '2024-01-10' },
        { id: 3, code: 'NORMAL', name: '일반', description: '일반 거래 가맹점', defaultDiscountRate: 5, priority: 3, color: '#007aff', storeCount: 150, isActive: true, createdAt: '2024-01-01' },
        { id: 4, code: 'NEW', name: '신규', description: '신규 가입 가맹점', defaultDiscountRate: 10, priority: 4, color: '#5856d6', storeCount: 8, isActive: true, createdAt: '2024-02-01' },
        { id: 5, code: 'DORMANT', name: '휴면', description: '장기 미거래 가맹점', defaultDiscountRate: 0, priority: 5, color: '#8e8e93', storeCount: 5, isActive: false, createdAt: '2024-01-20' },
      ]
      setTypes(mockTypes)
    } catch (error) {
      console.error('Failed to load types:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (type: GroupType | null) => {
    if (type) {
      setFormData({
        code: type.code,
        name: type.name,
        description: type.description || '',
        defaultDiscountRate: type.defaultDiscountRate,
        priority: type.priority,
        color: type.color,
        isActive: type.isActive
      })
      setEditingType(type)
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        defaultDiscountRate: 0,
        priority: types.length + 1,
        color: '#007aff',
        isActive: true
      })
      setEditingType(null)
    }
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      alert('코드와 이름을 입력해주세요')
      return
    }
    
    // TODO: API call
    alert(editingType ? '타입이 수정되었습니다.' : '타입이 등록되었습니다.')
    setShowModal(false)
    loadData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 타입을 삭제하시겠습니까?\n해당 타입에 속한 그룹이 있으면 삭제할 수 없습니다.')) return
    // TODO: API call
    alert('삭제되었습니다.')
    loadData()
  }

  const columns: Column<GroupType>[] = [
    { key: 'priority', label: '순위', width: '60px', align: 'center', render: (v) => (
      <span style={{ color: '#86868b', fontWeight: 500 }}>{v as number}</span>
    )},
    { key: 'code', label: '코드', render: (v) => (
      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86868b' }}>{v as string}</span>
    )},
    { key: 'name', label: '타입명', render: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          background: row.color
        }} />
        <span style={{ fontWeight: 500 }}>{v as string}</span>
      </div>
    )},
    { key: 'description', label: '설명', render: (v) => (
      <span style={{ color: '#666', fontSize: '13px' }}>{(v as string) || '-'}</span>
    )},
    { key: 'defaultDiscountRate', label: '기본할인율', align: 'center', render: (v) => (
      <span style={{ 
        fontWeight: 600, 
        color: (v as number) > 0 ? '#ff6b00' : '#86868b'
      }}>
        {v as number}%
      </span>
    )},
    { key: 'storeCount', label: '그룹 수', align: 'center', render: (v) => (
      <span style={{ 
        background: '#f0f7ff', 
        color: '#007aff', 
        padding: '2px 10px', 
        borderRadius: '10px', 
        fontSize: '12px',
        fontWeight: 500
      }}>
        {v as number}개
      </span>
    )},
    { key: 'isActive', label: '상태', align: 'center', render: (v) => (
      <StatusBadge status={v ? 'active' : 'inactive'} />
    )},
    { key: 'id', label: '관리', width: '100px', align: 'center', render: (_, row) => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <button
          onClick={() => openModal(row)}
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
        <button
          onClick={() => handleDelete(row.id)}
          style={{
            padding: '4px 10px',
            borderRadius: '4px',
            background: '#fff0f0',
            color: '#ff3b30',
            border: 'none',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          삭제
        </button>
      </div>
    )},
  ]

  const colorOptions = [
    { color: '#ff3b30', name: '레드' },
    { color: '#ff9500', name: '오렌지' },
    { color: '#ffcc00', name: '옐로우' },
    { color: '#34c759', name: '그린' },
    { color: '#007aff', name: '블루' },
    { color: '#5856d6', name: '퍼플' },
    { color: '#af52de', name: '핑크' },
    { color: '#8e8e93', name: '그레이' },
  ]

  const totalStores = types.reduce((sum, t) => sum + t.storeCount, 0)

  return (
    <AdminLayout activeMenu="stores">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        그룹별 타입 설정
      </h2>

      <div style={{ 
        background: '#e8f5e9', 
        borderRadius: '8px', 
        padding: '16px 20px',
        marginBottom: '24px',
        fontSize: '14px',
        color: '#2e7d32'
      }}>
        🏷️ <strong>타입 관리 안내</strong><br />
        그룹 타입은 가맹점 그룹을 분류하는 기준입니다. 각 타입별로 기본 할인율과 우선순위를 설정할 수 있습니다.
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>총 타입</div>
          <div style={{ fontSize: '28px', fontWeight: 600 }}>{types.length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>활성 타입</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#34c759' }}>{types.filter(t => t.isActive).length}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>연결된 그룹</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#007aff' }}>{totalStores}<span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>개</span></div>
        </div>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px' }}>
          <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>최고 할인율</div>
          <div style={{ fontSize: '28px', fontWeight: 600, color: '#ff6b00' }}>
            {Math.max(...types.map(t => t.defaultDiscountRate), 0)}
            <span style={{ fontSize: '14px', color: '#86868b', marginLeft: '4px' }}>%</span>
          </div>
        </div>
      </div>

      <SearchFilter
        placeholder="타입명, 코드 검색"
        actions={
          <button
            onClick={() => openModal(null)}
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
            + 타입 등록
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={types}
        loading={loading}
        emptyMessage="등록된 타입이 없습니다"
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
            width: '480px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingType ? '타입 수정' : '타입 등록'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>코드 *</label>
                <input 
                  type="text" 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="VIP, NORMAL 등"
                  disabled={!!editingType}
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #e9ecef', 
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    background: editingType ? '#f5f5f7' : '#fff'
                  }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>타입명 *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>설명</label>
              <input 
                type="text" 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>기본 할인율 (%)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={formData.defaultDiscountRate}
                  onChange={(e) => setFormData({ ...formData, defaultDiscountRate: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>우선순위</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '14px' }} 
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>색상</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {colorOptions.map(opt => (
                  <button
                    key={opt.color}
                    onClick={() => setFormData({ ...formData, color: opt.color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: opt.color,
                      border: formData.color === opt.color ? '3px solid #1d1d1f' : '2px solid transparent',
                      cursor: 'pointer'
                    }}
                    title={opt.name}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <span style={{ fontSize: '13px' }}>활성화</span>
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#f5f5f7', color: '#1d1d1f', border: 'none', fontSize: '14px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button 
                onClick={handleSave} 
                style={{ padding: '10px 24px', borderRadius: '8px', background: '#007aff', color: '#fff', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
