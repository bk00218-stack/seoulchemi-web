'use client'

import { useEffect, useState } from 'react'
import Layout, { btnStyle, thStyle, tdStyle, cardStyle, selectStyle, inputStyle } from '../components/Layout'

const SIDEBAR = [
  {
    title: '가맹점 관리',
    items: [
      { label: '가맹점 관리', href: '/stores' },
      { label: '가맹점 공지사항', href: '/stores/notices' },
    ]
  },
  {
    title: '가맹점그룹 관리',
    items: [
      { label: '그룹별 가맹점 연결', href: '/stores/groups' },
      { label: '그룹별 할인율 설정', href: '/stores/groups/discounts' },
      { label: '그룹별 타입 설정', href: '/stores/groups/types' },
    ]
  },
  {
    title: '승인/통합',
    items: [
      { label: '가입여부 확인', href: '/stores/verify' },
      { label: '코드 승인', href: '/stores/approve' },
      { label: '정산통합', href: '/stores/settle' },
    ]
  }
]

interface Store {
  id: number
  name: string
  code: string
  phone: string | null
  address: string | null
  ownerName: string | null
  isActive: boolean
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStores()
  }, [])

  async function fetchStores() {
    try {
      const res = await fetch('/api/stores')
      const data = await res.json()
      setStores(data.stores || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = stores.filter(s => 
    s.name.includes(search) || s.code.includes(search) || (s.ownerName && s.ownerName.includes(search))
  )

  return (
    <Layout sidebarMenus={SIDEBAR} activeNav="가맹점">
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--gray-900)' }}>
            가맹점 관리 <span style={{ fontWeight: 400, color: 'var(--gray-400)' }}>({filtered.length})</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>가맹점을 등록하고 관리합니다</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...btnStyle, background: 'var(--warning)', color: '#fff', border: 'none' }}>
            + 신규등록
          </button>
          <button style={{ ...btnStyle, background: 'var(--success)', color: '#fff', border: 'none' }}>
            📥 엑셀다운
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardStyle, padding: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={selectStyle}><option>그룹 전체</option></select>
        <select style={selectStyle}><option>지역 전체</option></select>
        <select style={selectStyle}><option>영업사원 전체</option></select>
        <input 
          type="text" 
          placeholder="가맹점명, 코드, 대표자 검색..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, minWidth: 250 }} 
        />
        <button style={{ ...btnStyle, background: 'var(--primary)', color: '#fff', border: 'none' }}>검색</button>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden', flex: 1 }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={thStyle}>수정</th>
                <th style={thStyle}>OPT NO</th>
                <th style={thStyle}>가맹점명</th>
                <th style={thStyle}>그룹명</th>
                <th style={thStyle}>대표자</th>
                <th style={thStyle}>연락처</th>
                <th style={thStyle}>주소</th>
                <th style={thStyle}>상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    로딩 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--gray-400)' }}>
                    등록된 가맹점이 없습니다
                  </td>
                </tr>
              ) : (
                filtered.map(store => (
                  <tr key={store.id}>
                    <td style={tdStyle}>
                      <button style={{ ...btnStyle, padding: '4px 12px', fontSize: 12, background: 'var(--warning)', color: '#fff', border: 'none' }}>
                        수정
                      </button>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--gray-500)' }}>{store.code}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{store.name}</td>
                    <td style={tdStyle}>BK렌즈</td>
                    <td style={tdStyle}>{store.ownerName || '-'}</td>
                    <td style={tdStyle}>{store.phone || '-'}</td>
                    <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {store.address || '-'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        background: store.isActive ? 'var(--success-light)' : 'var(--gray-100)',
                        color: store.isActive ? 'var(--success)' : 'var(--gray-500)'
                      }}>
                        {store.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
