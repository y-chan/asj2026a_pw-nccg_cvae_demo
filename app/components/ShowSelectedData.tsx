'use client'

import { useState } from 'react'

export type KindType = {
  suffix: string
  name: string
}

export default function ShowSelectedData({ dataList }: { dataList: string[] }) {
  const [selectedData, setSelectedData] = useState<string>(dataList[0])
  const kind: KindType[] = [
    {
      suffix: 'gt',
      name: '自然音声より抽出',
    },
    {
      suffix: 'cnn',
      name: 'CNN(Variance Predictor in FastSpeech 2)',
    },
    {
      suffix: 'p-ddpm-100',
      name: 'P-DDPM(RMSSinger)',
    },
    {
      suffix: 'p-ddpm-4',
      name: 'P-DDPM(RMSSinger/4ステップ)',
    },
    {
      suffix: 'diffgan',
      name: '提案手法',
    },
  ]

  const handleChange = (e: { target: { value: string } }) => {
    setSelectedData(e.target.value)
  }

  return (
    <div className="py-8">
      <div className="md:text-2xl text-xl font-bold py-4">
        生成結果・デモ音声
      </div>
      <div className="text-center py-4">
        表示するデータ
        <select
          className="mx-4"
          value={selectedData}
          onChange={handleChange}
          defaultValue={dataList[0]}
        >
          {dataList.map((file) => {
            return (
              <option key={file} value={file}>
                {file}
              </option>
            )
          })}
        </select>
      </div>
      <div className="m-auto w-[80vw] overflow-x-auto">
        <table className="keep-break">
          <thead>
            <tr>
              <th>
                <p className="mx-4">Method</p>
              </th>
              <th>
                <p className="mx-4 min-w-[300px]">F0画像</p>
              </th>
              <th>
                <p className="mx-4">
                  合成音声 (SiFiSinger <a href="#sifisinger">[2]</a>)
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            {kind.map((k) => {
              return (
                <tr key={k.name}>
                  <td key="name">
                    <p className="mx-4">{k.name}</p>
                  </td>
                  <td key="f0" className="min-w-[300px]">
                    <img
                      loading="lazy"
                      className="m-auto"
                      src={`/data/${selectedData}_${k.suffix}.png`}
                      height="400px"
                      width="500px"
                      alt={k.name}
                    />
                  </td>
                  <td key="audio" className="m-auto">
                    <audio
                      controls
                      src={`/data/${selectedData}_${k.suffix}.wav`}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
