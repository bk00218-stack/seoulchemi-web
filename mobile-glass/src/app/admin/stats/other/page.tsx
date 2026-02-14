'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

export default function OtherStatsPage() {
  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>
        Í∏∞Ì? ?µÍ≥Ñ
      </h2>

      {/* ?îÏïΩ Ïπ¥Îìú */}
      <StatCardGrid>
        <StatCard label="?†Í∑ú Í∞ÄÎßπÏ†ê (?¥Î≤à ??" value={5} unit="Í∞? icon="?Üï" trend={{ value: 25, isPositive: true }} />
        <StatCard label="Î∞òÌíà/ÍµêÌôò" value={12} unit="Í±? icon="?îÑ" />
        <StatCard label="?âÍ∑† Î∞∞ÏÜ°?? value={1.2} unit="?? icon="?öö" />
        <StatCard label="CS Î¨∏Ïùò" value={34} unit="Í±? icon="?ìû" />
      </StatCardGrid>

      {/* ?µÍ≥Ñ ?πÏÖò??*/}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* ?†Í∑ú Í∞ÄÎßπÏ†ê Ï∂îÏù¥ */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>?îÎ≥Ñ ?†Í∑ú Í∞ÄÎßπÏ†ê</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px' }}>
            {[3, 4, 2, 5, 6, 5].map((count, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '100%',
                    background: '#007aff',
                    borderRadius: '6px 6px 0 0',
                    height: `${count * 15}px`,
                  }}
                />
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {idx + 1}??
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Î∞òÌíà/ÍµêÌôò ?¨Ïú† */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Î∞òÌíà/ÍµêÌôò ?¨Ïú†</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '?ÑÏàò ?§Î•ò', count: 5, color: '#ff3b30' },
              { label: 'Î∞∞ÏÜ° ?åÏÜê', count: 3, color: '#ff9500' },
              { label: 'Í≥†Í∞ù Î≥Ä??, count: 3, color: '#007aff' },
              { label: 'Î∂àÎüâ', count: 1, color: '#af52de' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.color }} />
                <span style={{ flex: 1, fontSize: '14px' }}>{item.label}</span>
                <span style={{ fontWeight: 500 }}>{item.count}Í±?/span>
              </div>
            ))}
          </div>
        </div>

        {/* ?úÍ∞Ñ?ÄÎ≥?Ï£ºÎ¨∏ */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>?úÍ∞Ñ?ÄÎ≥?Ï£ºÎ¨∏ Î∂ÑÌè¨</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
            {[2, 1, 1, 0, 0, 0, 3, 8, 15, 22, 25, 28, 24, 20, 18, 15, 12, 10, 8, 6, 5, 4, 3, 2].map((count, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '100%',
                    background: count > 20 ? '#34c759' : count > 10 ? '#007aff' : '#eef4ee',
                    borderRadius: '2px 2px 0 0',
                    height: `${count * 3}px`,
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>0??/span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>12??/span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>24??/span>
          </div>
        </div>

        {/* ?∏Í∏∞ Í≤Ä?âÏñ¥ */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>?∏Í∏∞ Í≤Ä?âÏñ¥ TOP 5</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { rank: 1, keyword: '?¨Î¶¨???¨Ìåå?¥Ïñ¥', count: 156 },
              { rank: 2, keyword: 'Î∏îÎ£®Ïª®Ìä∏Î°?, count: 134 },
              { rank: 3, keyword: 'Î∞îÎ¶¨?ΩÏä§', count: 98 },
              { rank: 4, keyword: '1.60', count: 87 },
              { rank: 5, keyword: '?úÎùº?¥Î∏å?∏Ïù¥??, count: 65 },
            ].map((item) => (
              <div key={item.rank} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '12px',
                  background: item.rank <= 3 ? '#007aff' : '#f5f5f7',
                  color: item.rank <= 3 ? '#fff' : '#86868b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {item.rank}
                </span>
                <span style={{ flex: 1, fontSize: '14px' }}>{item.keyword}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>{item.count}??/span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ï∂îÍ? ?µÍ≥Ñ ?îÏïΩ */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>?¥Î≤à ???îÏïΩ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>???âÍ∑† Ï£ºÎ¨∏</div>
            <div style={{ fontSize: '24px', fontWeight: 600 }}>42.5<span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Í±?/span></div>
          </div>
          <div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>?¨Ï£ºÎ¨∏Ïú®</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#34c759' }}>78.3<span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>%</span></div>
          </div>
          <div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Ï£ºÎ¨∏ Ï∑®ÏÜå??/div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff9500' }}>2.1<span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>%</span></div>
          </div>
          <div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '4px' }}>Í≥†Í∞ù ÎßåÏ°±??/div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#007aff' }}>4.7<span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>/5.0</span></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
