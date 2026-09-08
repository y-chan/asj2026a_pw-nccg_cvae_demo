import { glob } from 'glob'
import * as path from 'path'

import ComparisonDemoLoader from '@/app/components/ComparisonDemoLoader'
import PwnccgDemo from '@/app/components/PwnccgDemo'

async function getWavFiles() {
  const files = [
    ...glob.globSync('public/gt/*.wav'),
    ...glob.globSync('public/cvae/*.wav'),
    ...glob.globSync('public/cvae-withvar/*.wav'),
    ...glob.globSync('public/cvae-pwnccg/*.wav'),
  ]
  const sampleIds = files.map((file) => {
    const name = path.basename(file)
    return name.endsWith('.wav') ? name.slice(0, -'.wav'.length) : name
  })
  return Array.from(new Set(sampleIds)).sort()
}

export default async function Home() {
  const wavFiles = await getWavFiles()
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full text-center items-center font-sans md:text-4xl text-2xl pt-16">
        出力にべき重み付き複素ガウス分布を仮定したVAEに基づく音声表現
      </div>
      <div className="w-full text-center items-center font-sans md:text-xl text-md pb-16">
        ☆芦田 裕飛，中鹿 亘
      </div>
      <div className="min-w-0 w-full py-10">
        <div>
          <span className="font-bold">概要: </span>
          音声スペクトルを考える際，振幅と位相に相関を考えることは非常に重要だが，簡略化のために独立で考えられる事が多かった．
          <br />
          本研究では，位相と振幅に相関をもたせながら，人間の聴覚にあった対数振幅も考慮できる確率分布である「
          <a href="https://www.arxiv.org/abs/2603.26344">
            べき重み付き非心複素ガウス分布（PW-NCCG）
          </a>
          」をデコーダの出力に仮定した複素VAEを提案する．
          <br />
          実験では，複素数を仮定した潜在表現から品質の高い音声を復元できることを示した．
          <div className="flex flex-col items-center">
            <img
              className="w-[30vw]"
              src="/pw-nccg-decoder-vae.svg"
              alt="pw-nccg-decoder-vae"
            />
            <p>
              図1: 既存手法(複素VAE)、比較手法(分散予測
              複素VAE)、提案手法(PW-NCCG 複素VAE)と、のアーキテクチャ
            </p>
          </div>
        </div>
        <div>
          <div className="md:text-2xl text-xl font-bold py-8">
            べき重み付き非心複素ガウス分布（PW-NCCG）の確率密度関数デモ
          </div>
          <PwnccgDemo />
        </div>
        <div>
          <div className="md:text-2xl text-xl font-bold py-8">デモ音声比較</div>
          <ComparisonDemoLoader files={wavFiles} />
        </div>
      </div>
    </main>
  )
}
