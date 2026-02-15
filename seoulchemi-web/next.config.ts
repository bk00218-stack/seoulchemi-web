import type { NextConfig } from 'next'

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]

const nextConfig: NextConfig = {
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  // 프로덕션 빌드 최적화
  reactStrictMode: true,
  
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // 실험적 기능
  experimental: {
    // 서버 액션 보안
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // 환경 변수 노출 방지 (클라이언트에 노출할 변수만 명시)
  env: {
    NEXT_PUBLIC_APP_NAME: 'LensChoice',
  },
}

export default nextConfig
