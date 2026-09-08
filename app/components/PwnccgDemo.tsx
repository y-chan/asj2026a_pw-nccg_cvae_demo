'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

import type { ComplexPoint } from '@/app/lib/pwnccg'

const Plot = dynamic(() => import('./PwnccgPlotRouter'), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[300px] items-center justify-center"
      role="status"
    >
      グラフを読み込み中…
    </div>
  ),
})
const AmplitudePlot = dynamic(() => import('./PwnccgAmplitudePlotRouter'), {
  ssr: false,
  loading: () => (
    <div
      className="flex min-h-[300px] items-center justify-center"
      role="status"
    >
      グラフを読み込み中…
    </div>
  ),
})
const initialMu = { re: 4, im: 3 }

export default function PwnccgDemo() {
  const [alpha, setAlpha] = useState(2)
  const [variance, setVariance] = useState(25)
  const [mu, setMu] = useState<ComplexPoint>(initialMu)

  return (
    <section
      aria-label="PW-NCCGの形状を操作する"
      className="mx-auto w-full max-w-4xl"
    >
      <p className="text-md text-neutral-600">
        μ、σ²、αを操作して確率密度の変化を見ることができます
      </p>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
        <label className="flex flex-col gap-2">
          <span>
            α = <output className="tabular-nums">{alpha.toFixed(2)}</output>
          </span>
          <input
            aria-label="α"
            type="range"
            min="0.2"
            max="5"
            step="0.05"
            value={alpha}
            onChange={(event) => setAlpha(Number(event.target.value))}
            className="w-full accent-neutral-700"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span>
            σ² = <output className="tabular-nums">{variance.toFixed(1)}</output>
          </span>
          <input
            aria-label="σ²"
            type="range"
            min="0.5"
            max="100"
            step="0.5"
            value={variance}
            onChange={(event) => setVariance(Number(event.target.value))}
            className="w-full accent-neutral-700"
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <output className="tabular-nums">
          μ = {mu.re.toFixed(2)} {mu.im < 0 ? '−' : '+'}{' '}
          {Math.abs(mu.im).toFixed(2)}i
        </output>
        <button
          type="button"
          className="py-1 text-neutral-600 underline underline-offset-4 hover:text-black"
          onClick={() => {
            setAlpha(2)
            setVariance(25)
            setMu(initialMu)
          }}
        >
          リセット
        </button>
      </div>
      <p className="mt-1 text-sm text-neutral-600">図上のμをドラッグして移動</p>
      <p className="mt-1 text-sm text-neutral-600">α=1で複素ガウス分布と同義</p>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <Plot alpha={alpha} variance={variance} mu={mu} onMuChange={setMu} />
        <div>
          <p className="mb-2 text-sm text-neutral-600">
            パワー分布(r²の分布)。縦線はν=|μ|の位置を示す。
          </p>
          <AmplitudePlot
            alpha={alpha}
            variance={variance}
            nu={Math.hypot(mu.re, mu.im)}
            plotLimit={40}
            matchSpectrumHeight={true}
          />
        </div>
      </div>
    </section>
  )
}
