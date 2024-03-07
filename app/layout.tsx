import '@/app/globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
