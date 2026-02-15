'use client'

export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '20px',
        padding: '40px',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📡</div>
        <h1 style={{ fontSize: '24px', marginBottom: '12px' }}>오프라인 상태</h1>
        <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px' }}>
          인터넷 연결을 확인해주세요
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 32px',
            borderRadius: '8px',
            border: 'none',
            background: '#fff',
            color: '#667eea',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
