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
  title: '歌唱音声合成におけるF0の自然性向上のためのDiffusion-GANモデルの検討',
  description:
    '歌唱音声合成におけるF0の自然性向上のためのDiffusion-GANモデルのデモページ',
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
