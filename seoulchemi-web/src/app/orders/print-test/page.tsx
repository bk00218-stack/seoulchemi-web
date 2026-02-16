'use client'

import { useEffect } from 'react'

export default function PrintTestPage() {
  useEffect(() => {
    // 자동 인쇄
    setTimeout(() => {
      window.print()
    }, 500)
  }, [])

  const now = new Date().toLocaleString('ko-KR')

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
        body {
          font-family: 'Malgun Gothic', sans-serif;
          margin: 0;
          padding: 10px;
          background: #f5f5f5;
        }
        .slip {
          background: #fff;
          width: 72mm;
          padding: 5mm;
          margin: 0 auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="no-print" style={{ textAlign: 'center', marginBottom: 20, padding: 10 }}>
        <button 
          onClick={() => window.print()} 
          style={{ padding: '10px 24px', fontSize: 14, cursor: 'pointer', marginRight: 10 }}
        >
          🖨️ 인쇄
        </button>
        <button 
          onClick={() => window.close()} 
          style={{ padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}
        >
          닫기
        </button>
      </div>

      <div className="slip">
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', letterSpacing: 4 }}>테 스 트 인 쇄</div>
        </div>

        <div style={{ marginBottom: 15 }}>
          <p style={{ margin: '5px 0' }}>이 페이지가 정상적으로 출력되면</p>
          <p style={{ margin: '5px 0' }}>프린터 설정이 완료된 것입니다.</p>
        </div>

        <div style={{ borderTop: '1px dashed #ccc', paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>상품명</span>
            <span>테스트 렌즈</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>도수</span>
            <span>-3.00/-1.25</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>수량</span>
            <span>2개</span>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #000', marginTop: 10, paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>합계</span>
            <span>50,000원</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 15, paddingTop: 10, borderTop: '1px dashed #ccc', color: '#666', fontSize: 10 }}>
          출력: {now}
        </div>
      </div>
    </>
  )
}
