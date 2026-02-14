'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅
    console.error('Error caught by boundary:', error)
    console.error('Component stack:', errorInfo.componentStack)

    // 프로덕션에서 에러 리포팅
    if (process.env.NODE_ENV === 'production') {
      // 에러 리포팅 API 호출
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // 에러 리포팅 실패 무시
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😵</div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#1d1d1f' }}>
            문제가 발생했습니다
          </h2>
          <p style={{ color: '#86868b', marginBottom: '24px' }}>
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#667eea',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              새로고침
            </button>
            <button
              onClick={() => window.history.back()}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              뒤로가기
            </button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details style={{ 
              marginTop: '24px', 
              textAlign: 'left',
              maxWidth: '600px',
              width: '100%'
            }}>
              <summary style={{ cursor: 'pointer', color: '#dc2626' }}>
                에러 상세 (개발 모드)
              </summary>
              <pre style={{
                marginTop: '12px',
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '8px',
                fontSize: '12px',
                overflow: 'auto',
                color: '#991b1b'
              }}>
                {this.state.error.name}: {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
