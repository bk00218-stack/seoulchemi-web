import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata = {
  title: '렌즈초이스 - 안경렌즈 주문관리',
  description: '안경렌즈 주문관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
