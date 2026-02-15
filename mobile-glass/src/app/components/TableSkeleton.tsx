'use client'

interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export default function TableSkeleton({ rows = 10, cols = 9 }: TableSkeletonProps) {
  return (
    <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
      {/* 헤더 스켈레톤 */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '16px',
              background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: '4px',
              flex: i === 0 ? '0 0 40px' : i === cols - 1 ? '0 0 150px' : 1,
            }}
          />
        ))}
      </div>
      
      {/* 행 스켈레톤 */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            gap: '8px',
            padding: '14px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <div
              key={colIdx}
              style={{
                height: '14px',
                background: 'linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                animationDelay: `${rowIdx * 0.05}s`,
                borderRadius: '4px',
                flex: colIdx === 0 ? '0 0 40px' : colIdx === cols - 1 ? '0 0 150px' : 1,
              }}
            />
          ))}
        </div>
      ))}
      
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
