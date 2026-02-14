'use client'

import { useState, useRef } from 'react'
import { AdminLayout } from '@/app/components/Navigation'

type ImportType = 'products' | 'inventory' | 'stores'

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<ImportType>('products')
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<{
    success: number
    failed: number
    skipped: number
    errors: string[]
  } | null>(null)
  const [mode, setMode] = useState('create')
  const [adjustMode, setAdjustMode] = useState('set')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs: { key: ImportType; label: string; desc: string }[] = [
    { key: 'products', label: '?í’ˆ', desc: '?í’ˆ ?€???±ë¡/?˜ì •' },
    { key: 'inventory', label: '?¬ê³ ', desc: '?¬ê³  ?¼ê´„ ?˜ì •' },
    { key: 'stores', label: 'ê°€ë§¹ì ', desc: 'ê°€ë§¹ì  ?€???±ë¡/?˜ì •' },
  ]

  const handleDownloadTemplate = () => {
    window.location.href = `/api/import/${activeTab}`
  }

  const handleDownloadData = () => {
    let url = `/api/export/${activeTab}`
    if (activeTab === 'products') {
      url += '?includeOptions=true'
    }
    window.location.href = url
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setResults(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (activeTab === 'inventory') {
        formData.append('adjustMode', adjustMode)
      } else {
        formData.append('mode', mode)
      }

      const res = await fetch(`/api/import/${activeTab}`, {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setResults(data.results)
      } else {
        alert(data.error || '?…ë¡œ?œì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('?…ë¡œ?œì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <AdminLayout activeMenu="settings">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px' }}>?°ì´??ê°€?¸ì˜¤ê¸?/h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
          CSV ?Œì¼ë¡??°ì´?°ë? ?€???±ë¡?˜ê±°???´ë³´?…ë‹ˆ??
        </p>
      </div>

      {/* ??*/}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setResults(null); }}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: activeTab === tab.key ? 'none' : '1px solid #e5e5e5',
              background: activeTab === tab.key ? '#007aff' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#1d1d1f',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* ê°€?¸ì˜¤ê¸?*/}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            ?“¥ ê°€?¸ì˜¤ê¸?(?…ë¡œ??
          </h2>

          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            {tabs.find(t => t.key === activeTab)?.desc}
          </p>

          {/* ëª¨ë“œ ? íƒ */}
          {activeTab !== 'inventory' ? (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '8px' }}>
                ê°€?¸ì˜¤ê¸?ëª¨ë“œ
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'create', label: '? ê·œë§?, desc: 'ê¸°ì¡´ ?°ì´??ê±´ë„ˆ?€' },
                  { value: 'update', label: '?˜ì •ë§?, desc: 'ê¸°ì¡´ ?°ì´?°ë§Œ ?˜ì •' },
                  { value: 'upsert', label: '?µí•©', desc: '? ê·œ ?±ë¡ + ê¸°ì¡´ ?˜ì •' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: mode === opt.value ? '2px solid #007aff' : '1px solid #e5e5e5',
                      background: mode === opt.value ? '#f0f7ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '8px' }}>
                ?¬ê³  ?˜ì • ë°©ì‹
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'set', label: '??–´?°ê¸°', desc: '?…ë ¥ê°’ìœ¼ë¡?ë³€ê²? },
                  { value: 'add', label: 'ì¶”ê?', desc: 'ê¸°ì¡´ ?¬ê³ ???”í•˜ê¸? },
                  { value: 'subtract', label: 'ì°¨ê°', desc: 'ê¸°ì¡´ ?¬ê³ ?ì„œ ë¹¼ê¸°' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAdjustMode(opt.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: adjustMode === opt.value ? '2px solid #007aff' : '1px solid #e5e5e5',
                      background: adjustMode === opt.value ? '#f0f7ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ?Œì¼ ?…ë¡œ??*/}
          <div style={{ marginBottom: '16px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              style={{
                display: 'block',
                padding: '40px 20px',
                borderRadius: '8px',
                border: '2px dashed #e5e5e5',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                background: uploading ? '#f9fafb' : '#fff'
              }}
            >
              {uploading ? (
                <span style={{ color: 'var(--text-tertiary)' }}>?…ë¡œ??ì¤?..</span>
              ) : (
                <>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>?“„</div>
                  <div style={{ fontWeight: 500 }}>CSV ?Œì¼??? íƒ?˜ì„¸??/div>
                  <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    ?ëŠ” ?¬ê¸°???Œì¼???œë˜ê·¸í•˜?¸ìš”
                  </div>
                </>
              )}
            </label>
          </div>

          {/* ?œí”Œë¦??¤ìš´ë¡œë“œ */}
          <button
            onClick={handleDownloadTemplate}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ?“‹ ?œí”Œë¦??¤ìš´ë¡œë“œ
          </button>

          {/* ê²°ê³¼ ?œì‹œ */}
          {results && (
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              borderRadius: '8px', 
              background: results.failed > 0 ? '#fef2f2' : '#d1fae5'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                {results.failed > 0 ? '? ï¸ ê°€?¸ì˜¤ê¸??„ë£Œ (?¼ë? ?¤ë¥˜)' : '??ê°€?¸ì˜¤ê¸??„ë£Œ'}
              </div>
              <div style={{ fontSize: '14px' }}>
                <span style={{ color: '#10b981' }}>?±ê³µ: {results.success}</span>
                {' Â· '}
                <span style={{ color: '#f59e0b' }}>ê±´ë„ˆ?€: {results.skipped}</span>
                {' Â· '}
                <span style={{ color: '#dc2626' }}>?¤íŒ¨: {results.failed}</span>
              </div>
              {results.errors.length > 0 && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px', 
                  background: 'var(--bg-primary)', 
                  borderRadius: '4px',
                  maxHeight: '100px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#dc2626'
                }}>
                  {results.errors.slice(0, 10).map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                  {results.errors.length > 10 && (
                    <div>... ??{results.errors.length - 10}ê°?/div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ?´ë³´?´ê¸° */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            ?“¤ ?´ë³´?´ê¸° (?¤ìš´ë¡œë“œ)
          </h2>

          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            ?„ì¬ ?°ì´?°ë? CSV ?Œì¼ë¡??´ë³´?…ë‹ˆ??
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleDownloadData}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: 'none',
                background: '#007aff',
                color: '#fff',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '15px'
              }}
            >
              {activeTab === 'products' && '?“¦ ?í’ˆ ëª©ë¡ ?¤ìš´ë¡œë“œ'}
              {activeTab === 'inventory' && '?“Š ?¬ê³  ?„í™© ?¤ìš´ë¡œë“œ'}
              {activeTab === 'stores' && '?ª ê°€ë§¹ì  ëª©ë¡ ?¤ìš´ë¡œë“œ'}
            </button>

            {/* ì¶”ê? ?¤ìš´ë¡œë“œ ?µì…˜ */}
            {activeTab === 'stores' && (
              <button
                onClick={() => window.location.href = '/api/export/stores?type=receivables'}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ?’° ë¯¸ìˆ˜ê¸??„í™© ?¤ìš´ë¡œë“œ
              </button>
            )}

            {activeTab === 'inventory' && (
              <button
                onClick={() => window.location.href = '/api/export/inventory?lowStock=true'}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ? ï¸ ?¬ê³  ë¶€ì¡??í’ˆë§??¤ìš´ë¡œë“œ
              </button>
            )}
          </div>

          {/* ë°”ë¡œê°€ê¸?*/}
          <div style={{ marginTop: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#666' }}>
              ?¤ë¥¸ ?´ë³´?´ê¸°
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a 
                href="/api/export/orders" 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)'
                }}
              >
                ì£¼ë¬¸ ?´ì—­
              </a>
              <a 
                href="/api/export/products" 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)'
                }}
              >
                ?í’ˆ ê¸°ë³¸
              </a>
              <a 
                href="/api/export/products?includeOptions=true" 
                style={{ 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)'
                }}
              >
                ?í’ˆ + ?µì…˜
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
