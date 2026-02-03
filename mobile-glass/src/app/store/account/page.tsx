'use client'

import { useState } from 'react'

interface Transaction {
  id: number
  date: string
  type: 'order' | 'payment' | 'refund'
  description: string
  amount: number
}

export default function StoreAccountPage() {
  const [balance] = useState(1250000) // 미수금
  const [creditLimit] = useState(5000000) // 신용한도
  
  const [transactions] = useState<Transaction[]>([
    { id: 1, date: '2026-02-03', type: 'order', description: '주문 ORD-20260203-001', amount: 125000 },
    { id: 2, date: '2026-02-02', type: 'order', description: '주문 ORD-20260202-005', amount: 83500 },
    { id: 3, date: '2026-02-01', type: 'payment', description: '1월 정산금 입금', amount: -850000 },
    { id: 4, date: '2026-02-01', type: 'order', description: '주문 ORD-20260201-012', amount: 215000 },
    { id: 5, date: '2026-01-31', type: 'order', description: '주문 ORD-20260131-008', amount: 41050 },
    { id: 6, date: '2026-01-15', type: 'payment', description: '12월 정산금 입금', amount: -720000 },
  ])

  const cardStyle = {
    background: 'white',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  const usedPercent = (balance / creditLimit) * 100

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', margin: 0 }}>
          잔액 조회
        </h1>
        <p style={{ fontSize: 14, color: '#86868b', marginTop: 8 }}>
          미수금 및 거래내역을 확인하세요
        </p>
      </div>

      {/* Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ff3b30' }}>
          <div style={{ fontSize: 13, color: '#86868b' }}>현재 미수금</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ff3b30', marginTop: 4 }}>
            {balance.toLocaleString()}<span style={{ fontSize: 16, fontWeight: 400 }}>원</span>
          </div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #007aff' }}>
          <div style={{ fontSize: 13, color: '#86868b' }}>신용 한도</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#007aff', marginTop: 4 }}>
            {creditLimit.toLocaleString()}<span style={{ fontSize: 16, fontWeight: 400 }}>원</span>
          </div>
        </div>
        <div style={{ ...cardStyle, borderLeft: '4px solid #34c759' }}>
          <div style={{ fontSize: 13, color: '#86868b' }}>주문 가능 금액</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#34c759', marginTop: 4 }}>
            {(creditLimit - balance).toLocaleString()}<span style={{ fontSize: 16, fontWeight: 400 }}>원</span>
          </div>
        </div>
      </div>

      {/* Credit Usage Bar */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>신용 한도 사용률</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: usedPercent > 80 ? '#ff3b30' : '#34c759' }}>
            {usedPercent.toFixed(1)}%
          </span>
        </div>
        <div style={{ 
          height: 12, 
          background: '#f5f5f7', 
          borderRadius: 6, 
          overflow: 'hidden' 
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(usedPercent, 100)}%`,
            background: usedPercent > 80 
              ? 'linear-gradient(90deg, #ff9500, #ff3b30)' 
              : 'linear-gradient(90deg, #34c759, #30d158)',
            borderRadius: 6,
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 12, color: '#86868b' }}>사용: {balance.toLocaleString()}원</span>
          <span style={{ fontSize: 12, color: '#86868b' }}>잔여: {(creditLimit - balance).toLocaleString()}원</span>
        </div>
      </div>

      {/* Store Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: '0 0 16px' }}>
            가맹점 정보
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#86868b' }}>가맹점명</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>밝은안경</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#86868b' }}>가맹점 코드</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>BK-001</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#86868b' }}>정산일</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>매월 말일</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#86868b' }}>담당자</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f', marginTop: 2 }}>김철수 (010-1234-5678)</div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', margin: 0 }}>
              거래 내역
            </h3>
            <select style={{
              padding: '6px 12px',
              fontSize: 13,
              border: '1px solid #e5e5e5',
              borderRadius: 8,
              outline: 'none',
            }}>
              <option>최근 1개월</option>
              <option>최근 3개월</option>
              <option>최근 6개월</option>
            </select>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#86868b' }}>일자</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#86868b' }}>구분</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#86868b' }}>내용</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#86868b' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f5f5f7' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: '#86868b' }}>{tx.date}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: tx.type === 'payment' ? '#f0fff4' : tx.type === 'refund' ? '#fff8f0' : '#f0f7ff',
                      color: tx.type === 'payment' ? '#34c759' : tx.type === 'refund' ? '#ff9500' : '#007aff',
                    }}>
                      {tx.type === 'payment' ? '입금' : tx.type === 'refund' ? '환불' : '주문'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13, color: '#1d1d1f' }}>{tx.description}</td>
                  <td style={{ 
                    padding: '12px 8px', 
                    fontSize: 13, 
                    fontWeight: 600, 
                    textAlign: 'right',
                    color: tx.amount < 0 ? '#34c759' : '#1d1d1f',
                  }}>
                    {tx.amount < 0 ? '' : '+'}{tx.amount.toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
