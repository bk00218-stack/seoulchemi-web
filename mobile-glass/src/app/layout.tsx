import './globals.css'

export const metadata = {
  title: 'OptiCore - 안경렌즈 주문관리',
  description: '안경렌즈 주문관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
