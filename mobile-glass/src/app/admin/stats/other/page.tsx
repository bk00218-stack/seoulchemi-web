'use client'

import { useState } from 'react'
import { AdminLayout } from '../../../components/Navigation'
import SearchFilter, { OutlineButton } from '../../../components/SearchFilter'
import StatCard, { StatCardGrid } from '../../../components/StatCard'

export default function OtherStatsPage() {
  return (
    <AdminLayout activeMenu="stats">
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: '#1d1d1f' }}>
        기타 통계
      </h2>

      {/* 요약 카드 */}
      <StatCardGrid>
        <StatCard label="신규 가맹점 (이번 달)" value={5} unit="개" icon="🆕" trend={{ value: 25, isPositive: true }} />
        <StatCard label="반품/교환" value={12} unit="건" icon="🔄" />
        <StatCard label="평균 배송일" value={1.2} unit="일" icon="🚚" />
        <StatCard label="CS 문의" value={34} unit="건" icon="📞" />
      </StatCardGrid>

      {/* 통계 섹션들 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* 신규 가맹점 추이 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>월별 신규 가맹점</h3>
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
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#86868b' }}>
                  {idx + 1}월
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 반품/교환 사유 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>반품/교환 사유</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '도수 오류', count: 5, color: '#ff3b30' },
              { label: '배송 파손', count: 3, color: '#ff9500' },
              { label: '고객 변심', count: 3, color: '#007aff' },
              { label: '불량', count: 1, color: '#af52de' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: item.color }} />
                <span style={{ flex: 1, fontSize: '14px' }}>{item.label}</span>
                <span style={{ fontWeight: 500 }}>{item.count}건</span>
              </div>
            ))}
          </div>
        </div>

        {/* 시간대별 주문 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>시간대별 주문 분포</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
            {[2, 1, 1, 0, 0, 0, 3, 8, 15, 22, 25, 28, 24, 20, 18, 15, 12, 10, 8, 6, 5, 4, 3, 2].map((count, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '100%',
                    background: count > 20 ? '#34c759' : count > 10 ? '#007aff' : '#e3f2fd',
                    borderRadius: '2px 2px 0 0',
                    height: `${count * 3}px`,
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '10px', color: '#86868b' }}>0시</span>
            <span style={{ fontSize: '10px', color: '#86868b' }}>12시</span>
            <span style={{ fontSize: '10px', color: '#86868b' }}>24시</span>
          </div>
        </div>

        {/* 인기 검색어 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>인기 검색어 TOP 5</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { rank: 1, keyword: '크리잘 사파이어', count: 156 },
              { rank: 2, keyword: '블루컨트롤', count: 134 },
              { rank: 3, keyword: '바리락스', count: 98 },
              { rank: 4, keyword: '1.60', count: 87 },
              { rank: 5, keyword: '드라이브세이프', count: 65 },
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
                <span style={{ color: '#86868b', fontSize: '13px' }}>{item.count}회</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 추가 통계 요약 */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>이번 달 요약</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>일 평균 주문</div>
            <div style={{ fontSize: '24px', fontWeight: 600 }}>42.5<span style={{ fontSize: '14px', color: '#86868b' }}>건</span></div>
          </div>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>재주문율</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#34c759' }}>78.3<span style={{ fontSize: '14px', color: '#86868b' }}>%</span></div>
          </div>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>주문 취소율</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#ff9500' }}>2.1<span style={{ fontSize: '14px', color: '#86868b' }}>%</span></div>
          </div>
          <div>
            <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>고객 만족도</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#007aff' }}>4.7<span style={{ fontSize: '14px', color: '#86868b' }}>/5.0</span></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
