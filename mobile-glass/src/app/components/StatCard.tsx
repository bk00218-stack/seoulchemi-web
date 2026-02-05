'use client'

export interface StatCardProps {
  label: string
  value: number | string
  unit?: string
  subValue?: string
  highlight?: boolean
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: string
  onClick?: () => void
}

export default function StatCard({
  label,
  value,
  unit = '',
  subValue,
  highlight = false,
  trend,
  icon,
  onClick
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        border: highlight ? '2px solid #007aff' : '1px solid transparent',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: '#86868b', fontSize: '12px', marginBottom: '4px' }}>{label}</div>
        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 600, color: '#1d1d1f' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && (
          <span style={{ fontSize: '12px', fontWeight: 400, color: '#86868b', marginLeft: '4px' }}>
            {unit}
          </span>
        )}
      </div>
      {subValue && (
        <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>
          {subValue}
        </div>
      )}
      {trend && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: trend.isPositive ? '#34c759' : '#ff3b30',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}%</span>
          <span style={{ color: '#86868b', marginLeft: '4px' }}>전월 대비</span>
        </div>
      )}
    </div>
  )
}

// 통계 카드 그리드
export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}
    >
      {children}
    </div>
  )
}

// 미니 통계 카드 (인라인용)
export function MiniStatCard({
  label,
  value,
  color = '#007aff'
}: {
  label: string
  value: number | string
  color?: string
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        background: '#f5f5f7',
        borderRadius: '8px'
      }}
    >
      <span style={{ fontSize: '12px', color: '#86868b' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 600, color }}>{value}</span>
    </div>
  )
}
