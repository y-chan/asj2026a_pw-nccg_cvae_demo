import { glob } from 'glob'
import * as path from 'path'

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
      path: 'pyworld',
      name: 'WORLD',
    },
    {
      path: 'diffworld-pcph',
      name: 'Diff. WORLD',
    },
    {
      path: 'neu-world',
      name: 'NeuWORLD(提案手法)',
    },
  ]
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full text-center items-center font-sans md:text-4xl text-2xl pt-16">
        NeuWORLD: 周期性・非周期性・フィルタに基づくニューラル信号処理ボコーダ
      </div>
      <div className="w-full text-center items-center font-sans md:text-xl text-md pb-16">
        芦田 裕飛，中鹿 亘
      </div>
      <div className="py-10">
        <div>
          <span className="font-bold">概要: </span>
          信号処理ボコーダのWORLDは，入力をスペクトル包絡，非周期性指標，f<sub>o</sub>
          に分解することで，高速なまま制御性を向上させながら，再合成が可能なボコーダである．
          <br />
          しかし，昨今のニューラルボコーダと比較して，信号処理特有のアーティファクトが多く，品質が劣ることが知られている．
          <br />
          近年，ニューラルネットワークと信号処理を組み合わせることで，高品質かつ高速な音声合成手法が提案されている．
          <br />
          しかし，WORLDのような制御性についてはこれまであまり議論されてこなかった．
          <br />
          本稿では，近年注目されているエイリアシングフリーな構造と，WORLDデコーダの構造を組み込んだニューラル信号処理ボコーダ，NeuWORLDを提案する．
          <br />
          提案手法は，WORLDと比較し，高品質かつリアルタイムな音声合成を実現することを示した．
          <div className="flex flex-col items-center">
            <img className="w-[40vw]" src="/neuworld-arch.svg" alt="sifisinger" />
            <p>図1: NeuWORLDのアーキテクチャ</p>
          </div>
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
