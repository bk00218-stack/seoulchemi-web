'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import FormInput, { FormSection, FormGrid, FormActions, SaveButton } from '../../../components/FormInput'

interface BannerItem {
  id: number
  title: string
  imageUrl: string
  linkUrl: string
  isActive: boolean
  sortOrder: number
}

const sampleBanners: BannerItem[] = [
  { id: 1, title: '? ìƒ??ì¶œì‹œ', imageUrl: '/banner1.jpg', linkUrl: '/products/new', isActive: true, sortOrder: 1 },
  { id: 2, title: '1???¹ê? ?´ë²¤??, imageUrl: '/banner2.jpg', linkUrl: '/event/january', isActive: true, sortOrder: 2 },
  { id: 3, title: '?„ë¦¬ë¯¸ì—„ ?Œì¦ˆ', imageUrl: '/banner3.jpg', linkUrl: '/products/premium', isActive: false, sortOrder: 3 },
]

export default function MainScreenPage() {
  const [banners, setBanners] = useState(sampleBanners)
  const [showSections, setShowSections] = useState({
    banner: true,
    newProducts: true,
    bestSeller: true,
    notice: true
  })

  return (
    <AdminLayout activeMenu="settings">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        ë©”ì¸?”ë©´ ?¤ì •
      </h2>

      {/* ?¹ì…˜ ?œì‹œ ?¤ì • */}
      <FormSection title="?¹ì…˜ ?œì‹œ ?¤ì •">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {[
            { key: 'banner', label: 'ë°°ë„ˆ ?¬ë¼?´ë”', desc: 'ë©”ì¸ ?ë‹¨ ?´ë?ì§€ ë°°ë„ˆ' },
            { key: 'newProducts', label: '? ìƒ??, desc: 'ìµœê·¼ ?±ë¡???í’ˆ ëª©ë¡' },
            { key: 'bestSeller', label: 'ë² ìŠ¤?¸ì???, desc: '?ë§¤???ìœ„ ?í’ˆ' },
            { key: 'notice', label: 'ê³µì??¬í•­', desc: 'ìµœì‹  ê³µì??¬í•­ ë¯¸ë¦¬ë³´ê¸°' },
          ].map(section => (
            <label key={section.key} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={showSections[section.key as keyof typeof showSections]}
                onChange={(e) => setShowSections(prev => ({ ...prev, [section.key]: e.target.checked }))}
                style={{ width: '20px', height: '20px' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{section.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{section.desc}</div>
              </div>
            </label>
          ))}
        </div>
        <FormActions>
          <SaveButton onClick={() => alert('?€?¥ë˜?ˆìŠµ?ˆë‹¤.')} />
        </FormActions>
      </FormSection>

      {/* ë°°ë„ˆ ê´€ë¦?*/}
      <div style={{ 
        background: 'var(--bg-primary)', 
        borderRadius: '12px', 
        padding: '24px',
        marginTop: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>ë°°ë„ˆ ê´€ë¦?/h3>
          <button
            onClick={() => alert('ë°°ë„ˆ ì¶”ê?')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#007aff',
              color: '#fff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + ë°°ë„ˆ ì¶”ê?
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {banners.map((banner, idx) => (
            <div key={banner.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              padding: '16px',
              background: banner.isActive ? '#f0f7ff' : '#f5f5f7',
              borderRadius: '12px',
              border: banner.isActive ? '1px solid #007aff20' : '1px solid transparent'
            }}>
              <div style={{ 
                width: '120px', 
                height: '60px', 
                background: '#e5e5e5', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '12px'
              }}>
                ?´ë?ì§€
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{banner.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{banner.linkUrl}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  padding: '3px 8px', 
                  borderRadius: '4px', 
                  background: banner.isActive ? '#e8f5e9' : '#f5f5f5',
                  color: banner.isActive ? '#34c759' : '#86868b',
                  fontSize: '11px',
                  fontWeight: 500
                }}>
                  {banner.isActive ? '?œì„±' : 'ë¹„í™œ??}
                </span>
                <button
                  onClick={() => alert('?˜ì •')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: 'var(--bg-primary)',
                    color: '#007aff',
                    border: '1px solid var(--border-color)',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ?˜ì •
                </button>
                <button
                  onClick={() => alert('?? œ')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: '#ffebee',
                    color: '#ff3b30',
                    border: 'none',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  ?? œ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ë¯¸ë¦¬ë³´ê¸° */}
      <div style={{ 
        background: 'var(--bg-primary)', 
        borderRadius: '12px', 
        padding: '24px',
        marginTop: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>ë¯¸ë¦¬ë³´ê¸°</h3>
        <div style={{ 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '20px',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
            ?“± ëª¨ë°”??ë¯¸ë¦¬ë³´ê¸°ê°€ ?¬ê¸°???œì‹œ?©ë‹ˆ??
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
