import '@/app/globals.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  title: '出力にべき重み付き複素ガウス分布を仮定したVAEに基づく音声表現',
  description:
    '出力にべき重み付き複素ガウス分布を仮定したVAEに基づく音声表現のデモページ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
