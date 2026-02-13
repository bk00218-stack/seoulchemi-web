'use client'

import { useState, useEffect } from 'react'

interface ApiEndpoint {
  method: string
  path: string
  summary: string
  tags: string[]
  parameters?: Array<{
    name: string
    in: string
    required?: boolean
    schema: { type: string; default?: unknown; enum?: string[] }
    description?: string
  }>
  requestBody?: {
    required: boolean
    content: {
      'application/json': {
        schema: object
      }
    }
  }
  responses: Record<string, { description: string }>
}

const methodColors: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PATCH: '#f59e0b',
  PUT: '#8b5cf6',
  DELETE: '#ef4444'
}

function EndpointCard({ endpoint }: { endpoint: ApiEndpoint }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      marginBottom: '8px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
          background: expanded ? '#f9fafb' : '#fff'
        }}
      >
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          background: methodColors[endpoint.method] || '#6b7280',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 600,
          minWidth: '60px',
          textAlign: 'center'
        }}>
          {endpoint.method}
        </span>
        <code style={{ fontSize: '14px', color: '#374151' }}>{endpoint.path}</code>
        <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: 'auto' }}>
          {endpoint.summary}
        </span>
        <span style={{ color: '#9ca3af' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
          {endpoint.parameters && endpoint.parameters.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Parameters</h4>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#e5e7eb' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>In</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.parameters.map((param, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>
                        <code>{param.name}</code>
                        {param.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </td>
                      <td style={{ padding: '8px' }}>{param.in}</td>
                      <td style={{ padding: '8px' }}>
                        {param.schema.type}
                        {param.schema.enum && ` (${param.schema.enum.join(', ')})`}
                      </td>
                      <td style={{ padding: '8px', color: '#6b7280' }}>
                        {param.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {endpoint.requestBody && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Request Body</h4>
              <pre style={{
                background: '#1f2937',
                color: '#f3f4f6',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {JSON.stringify(endpoint.requestBody.content['application/json'].schema, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Responses</h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(endpoint.responses).map(([code, res]) => (
                <span
                  key={code}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: code.startsWith('2') ? '#d1fae5' : code.startsWith('4') ? '#fee2e2' : '#fef3c7',
                    color: code.startsWith('2') ? '#065f46' : code.startsWith('4') ? '#991b1b' : '#92400e',
                    fontSize: '12px'
                  }}
                >
                  {code}: {res.description}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/docs')
      .then(res => res.json())
      .then(data => {
        setSpec(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>API 문서 로딩 중...</p>
      </div>
    )
  }

  if (!spec) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <p>API 문서를 불러올 수 없습니다.</p>
      </div>
    )
  }

  // Parse endpoints
  const endpoints: ApiEndpoint[] = []
  Object.entries(spec.paths || {}).forEach(([path, methods]: [string, any]) => {
    Object.entries(methods).forEach(([method, details]: [string, any]) => {
      endpoints.push({
        method: method.toUpperCase(),
        path: `/api${path}`,
        summary: details.summary || '',
        tags: details.tags || [],
        parameters: details.parameters,
        requestBody: details.requestBody,
        responses: details.responses || {}
      })
    })
  })

  const tags = spec.tags || []
  const filteredEndpoints = activeTag
    ? endpoints.filter(e => e.tags.includes(activeTag))
    : endpoints

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'auto'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#667eea' }}>
            {spec.info?.title || 'API Docs'}
          </h1>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            v{spec.info?.version}
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTag(null)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: 'none',
              background: !activeTag ? '#667eea' : 'transparent',
              color: !activeTag ? '#fff' : '#374151',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '4px'
            }}
          >
            전체 ({endpoints.length})
          </button>
          {tags.map((tag: any) => (
            <button
              key={tag.name}
              onClick={() => setActiveTag(tag.name)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeTag === tag.name ? '#667eea' : 'transparent',
                color: activeTag === tag.name ? '#fff' : '#374151',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                marginBottom: '4px'
              }}
            >
              {tag.name}
              <span style={{ 
                marginLeft: '8px', 
                opacity: 0.7,
                fontSize: '12px'
              }}>
                ({endpoints.filter(e => e.tags.includes(tag.name)).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '24px', maxWidth: '900px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1f2937' }}>
            {activeTag || '전체 API'}
          </h2>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>
            {spec.info?.description}
          </p>
        </div>

        <div style={{
          padding: '12px 16px',
          background: '#fef3c7',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          🔐 모든 API는 인증이 필요합니다. 먼저 <code>/api/auth/login</code>으로 로그인하세요.
        </div>

        {filteredEndpoints.map((endpoint, i) => (
          <EndpointCard key={i} endpoint={endpoint} />
        ))}
      </div>
    </div>
  )
}
