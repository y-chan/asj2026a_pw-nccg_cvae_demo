/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  turbopack: {
    root: __dirname,
  },
  images: {
    disableStaticImages: true, // importした画像の型定義設定を無効にする
  },
}

module.exports = nextConfig
