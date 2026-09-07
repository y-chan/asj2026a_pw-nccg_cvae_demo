import { glob } from 'glob'
import * as path from 'path'

import PwnccgDemo from '@/app/components/PwnccgDemo'

async function getWavFiles() {
  const wavFiles = glob.globSync('public/gt/*.wav').map((file) => {
    return path.basename(file)
  })
  return wavFiles
}

type KindType = {
  path: string
  name: string
}

export default async function Home() {
  const wavFiles = await getWavFiles()
  const kind: KindType[] = [
    {
      path: 'gt',
      name: '自然音声',
    },
    {
      path: 'cvae',
      name: '複素VAE',
    },
    {
      path: 'cvae-withvar',
      name: '分散予測 複素VAE',
    },
    {
      path: 'cvae-pwnccg',
      name: 'PW-NCCG予測 複素VAE(提案手法)',
    },
  ]
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
          本研究では，位相と振幅に相関をもたせながら，人間の聴覚にあった対数振幅も考慮できる確率分布である「べき重み付き非心複素ガウス分布（PW-NCCG）」をデコーダの出力に仮定した複素VAEを提案する．
          <br />
          実験では，複素数を仮定した潜在表現からGANなどの構造がなくとも実音声に匹敵する音声を復元できることを示した．
          {/* <div className="flex flex-col items-center">
            <img className="w-[40vw]" src="/neuworld-arch.svg" alt="sifisinger" />
            <p>図1: NeuWORLDのアーキテクチャ</p>
          </div> */}
        </div>
        <div>
          <div className="md:text-2xl text-xl font-bold py-8">
            べき重み付き非心複素ガウス分布の確率密度関数デモ
          </div>
          <PwnccgDemo />
        </div>
        <div>
          <div className="md:text-2xl text-xl font-bold py-8">
            {/* デモ音声1: 各手法における単純な音声の比較 */}
            デモ音声
          </div>
          <div className="m-auto w-[80vw] overflow-x-auto">
            <table className="break-keep">
              <thead>
                <tr>
                  <th>
                    <p className="mx-4">index</p>
                  </th>
                  {kind.map((k) => {
                    return (
                      <th key={k.name}>
                        <p className="mx-4">{k.name}</p>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {wavFiles.map((file, index) => {
                  return (
                    <tr key={file}>
                      <td key="index">
                        <p className="mx-4">{index}</p>
                      </td>
                      {kind.map((k) => {
                        return (
                          <td key={k.name}>
                            <audio controls src={`/${k.path}/${file}`} />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
