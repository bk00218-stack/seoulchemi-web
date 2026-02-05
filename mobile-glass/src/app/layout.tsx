import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
  title: '렌즈초이스 - 안경렌즈 주문관리',
  description: '안경렌즈 주문관리 시스템',
  manifest: '/manifest.json',
  themeColor: '#007aff',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '렌즈초이스',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
