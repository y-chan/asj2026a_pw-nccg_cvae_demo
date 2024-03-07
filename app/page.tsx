import { glob } from 'glob'
import * as path from 'path'

import DataSelectableDiv from '@/app/components/DataSelectableDiv'

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full text-center items-center font-sans md:text-4xl text-2xl pt-16">
        歌唱音声合成におけるF0の自然性向上のためのDiffusion-GANモデルの検討
      </div>
      <div className="w-full text-center items-center font-sans md:text-xl text-md pb-16">
        ☆芦田 裕飛，中鹿 亘
      </div>
      <div className="py-10">
        <div>
          <span className="font-bold">概要: </span>
          歌唱音声合成においては，歌唱表現を再現することが求められる．
          <br />
          この歌唱表現は，ほぼ全てf0によって表現される．例えば，しゃくりやフォール，ビブラートなどの歌唱表現はほとんどf0の変化を指す．
          <br />
          歌う時々によってf0の変化は異なる上に，複雑な変化を伴うため，それらの表現を獲得するには，表現力の高いモデルを使用することが求められるが，速度と品質の両立が難しい．
          <br />
          本研究では，表現力の高いDiffusionとGANを組み合わせ，低ステップのデノイズでMel-spectrogramを生成できるDiffGAN-TTS{' '}
          <a href="#diffgan-tts">[1]</a>に着目し，
          Diffusion-GANを用いてf0を合成するモデルを提案・評価した．
          <div className="flex flex-col items-center">
            <img className="w-[30vw]" src="/diffgan.png" alt="diffgan" />
            <p>図1: F0を合成するDiffusion-GANモデルのアーキテクチャ</p>
          </div>
        </div>
        <DataSelectableDiv />
        <div>
          <span className="font-bold">参考文献: </span>
          <ol>
            <li>
              <a id="diffgan-tts" href="https://arxiv.org/abs/2201.11972">
                [1] DiffGAN-TTS: High-Fidelity and Efficient Text-to-Speech with Denoising Diffusion GANs
              </a>
            </li>
            <li>
              <a
                id="sifisinger"
                href="https://asj2023a.y-chan.dev/"
              >
                [2] SiFiSinger: SiFi-GAN を内包した歌唱音声合成
              </a>
            </li>
          </ol>
        </div>
      </div>
    </main>
  )
}
