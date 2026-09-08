'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

import SpectrumCanvas from '@/app/components/SpectrumCanvas'
import {
  type ComparisonData,
  type ComparisonMethodKey,
  loadComparisonData,
  parameterAt,
} from '@/app/lib/comparisonData'

const DistributionPlot = dynamic(() => import('./PwnccgPlotRouter'), {
  ssr: false,
})
const AmplitudePlot = dynamic(() => import('./PwnccgAmplitudePlotRouter'), {
  ssr: false,
})

const methods: Array<{ key: ComparisonMethodKey; label: string }> = [
  { key: 'gt', label: '自然音声' },
  { key: 'cvae', label: '複素VAE' },
  { key: 'cvae-withvar', label: '分散予測 複素VAE' },
  { key: 'cvae-pwnccg', label: 'PW-NCCG予測 複素VAE（提案手法）' },
]

const sourceDirectories: Record<ComparisonMethodKey, string> = {
  gt: 'gt',
  cvae: 'cvae',
  'cvae-withvar': 'cvae-withvar',
  'cvae-pwnccg': 'cvae-pwnccg',
}

export default function AudioComparisonDemo({ file }: { file: string }) {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadedFile, setLoadedFile] = useState('')
  const [selected, setSelected] = useState({ time: 0, frequency: 0 })

  useEffect(() => {
    let cancelled = false
    void loadComparisonData(file).then(
      (next) => {
        if (cancelled) return
        setData(next)
        setError(null)
        setLoadedFile(file)
        const firstSpectrum = methods
          .map(({ key }) => next[key].spectrum)
          .find((spectrum) => spectrum)
        if (firstSpectrum) {
          setSelected({
            time: Math.floor(firstSpectrum.columns / 2),
            frequency: Math.floor(firstSpectrum.rows / 2),
          })
        }
      },
      (reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'データを読み込めませんでした',
          )
          setLoadedFile(file)
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [file])

  const selectedLabel = useMemo(
    () => `time=${selected.time}, frequency=${selected.frequency}`,
    [selected],
  )
  const activeData = loadedFile === file ? data : null
  const activeError = loadedFile === file ? error : null

  return (
    <div className="space-y-4">
      {activeError && <p className="text-sm text-red-800">{activeError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-700">
        <span>
          スペクトル上をクリック／タップ、ドラッグするとbinを選択できます。
        </span>
        <output className="tabular-nums">選択中: {selectedLabel}</output>
      </div>
      <div className="overflow-x-auto rounded border border-neutral-300">
        <table className="w-full min-w-[960px] table-fixed">
          <thead>
            <tr className="border-b border-neutral-300 text-left">
              <th className="w-24 p-3">手法</th>
              <th className="p-3">スペクトル・音声</th>
              <th className="p-3">選択binの複素分布</th>
              <th className="p-3">選択binの振幅分布</th>
            </tr>
          </thead>
          <tbody>
            {methods.map(({ key, label }) => {
              const methodData = activeData?.[key]
              const spectrum = methodData?.spectrum ?? null
              const params = methodData?.parameters ?? null
              const hasAmplitudeDistribution =
                key === 'cvae-pwnccg' && Boolean(params?.alpha)
              const point =
                params && spectrum
                  ? parameterAt(
                      params,
                      selected.time,
                      selected.frequency,
                      spectrum.rows,
                      spectrum.columns,
                    )
                  : null
              return (
                <tr
                  key={key}
                  className="border-b border-neutral-200 align-top last:border-b-0"
                >
                  <th className="p-3 text-left font-semibold">{label}</th>
                  <td className="space-y-3 p-3">
                    {methodData ? (
                      <SpectrumCanvas
                        spectrum={spectrum}
                        imageUrl={methodData.imageUrl}
                        selected={selected}
                        onSelect={setSelected}
                      />
                    ) : (
                      <div className="flex aspect-[2/1] items-center justify-center rounded border border-neutral-300 bg-neutral-100 text-sm text-neutral-600">
                        スペクトルを読み込み中…
                      </div>
                    )}
                    {/*
                    {key === 'cvae-pwnccg' && methodData.alphaSpectrum && (
                      <div>
                        <p className="mb-1 text-xs font-semibold text-neutral-700">
                          α
                        </p>
                        <SpectrumCanvas
                          spectrum={methodData.alphaSpectrum}
                          imageUrl={null}
                          selected={selected}
                          onSelect={setSelected}
                        />
                      </div>
                    )}
                    */}
                    <audio
                      className="w-full"
                      controls
                      src={`/${sourceDirectories[key]}/${file}.wav`}
                    />
                    {methodData?.warning && (
                      <p className="text-xs text-amber-800">
                        {methodData.warning}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    {point ? (
                      <>
                        <div className="w-full">
                          <DistributionPlot
                            alpha={point.alpha}
                            variance={point.variance}
                            mu={point.mu}
                            interactive={false}
                            plotLimit={20}
                            matchSpectrumHeight
                          />
                        </div>
                        <p className="mt-1 text-center text-xs tabular-nums text-neutral-600">
                          μ={point.mu.re.toFixed(2)}{' '}
                          {point.mu.im < 0 ? '−' : '+'}{' '}
                          {Math.abs(point.mu.im).toFixed(2)}i, σ²=
                          {point.variance.toFixed(2)}
                          {hasAmplitudeDistribution && (
                            <> , α={point.alpha.toFixed(2)}</>
                          )}
                        </p>
                      </>
                    ) : activeData ? (
                      <p className="py-12 text-center text-sm text-neutral-600">
                        —
                      </p>
                    ) : (
                      <p className="py-12 text-center text-sm text-neutral-600">
                        分布を読み込み中…
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    {hasAmplitudeDistribution && point ? (
                      <>
                        <div className="w-full">
                          <AmplitudePlot
                            alpha={point.alpha}
                            variance={point.variance}
                            nu={Math.hypot(point.mu.re, point.mu.im)}
                            plotLimit={40}
                            matchSpectrumHeight
                          />
                        </div>
                        <p className="mt-1 text-center text-xs tabular-nums text-neutral-600">
                          ν={Math.hypot(point.mu.re, point.mu.im).toFixed(2)}
                        </p>
                      </>
                    ) : activeData ? (
                      <p className="py-12 text-center text-sm text-neutral-600">
                        —
                      </p>
                    ) : (
                      <p className="py-12 text-center text-sm text-neutral-600">
                        分布を読み込み中…
                      </p>
                    )}
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
