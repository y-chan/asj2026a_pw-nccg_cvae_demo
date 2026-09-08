'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

import PwnccgAmplitudeGpuPlot from '@/app/components/PwnccgAmplitudeGpuPlot'

const PwnccgAmplitudePlot = dynamic(() => import('./PwnccgAmplitudePlot'), {
  ssr: false,
})

type Props = {
  alpha: number
  variance: number
  nu: number
  plotLimit?: number
  matchSpectrumHeight?: boolean
}

export default function PwnccgAmplitudePlotRouter(props: Props) {
  const [mode, setMode] = useState<'checking' | 'gpu' | 'fallback'>('checking')

  useEffect(() => {
    let cancelled = false
    async function checkWebGpu() {
      if (!navigator.gpu) {
        if (!cancelled) setMode('fallback')
        return
      }
      const adapter = await navigator.gpu.requestAdapter()
      if (!cancelled) setMode(adapter ? 'gpu' : 'fallback')
    }
    void checkWebGpu()
    return () => {
      cancelled = true
    }
  }, [])

  if (mode === 'checking') {
    return (
      <div
        className="flex min-h-[300px] items-center justify-center"
        role="status"
      >
        グラフを読み込み中…
      </div>
    )
  }

  if (mode === 'fallback') {
    return (
      <>
        <p className="mt-2 text-xs text-amber-800" role="status">
          WebGPUが利用できないため、互換表示で描画しています。
        </p>
        <PwnccgAmplitudePlot {...props} />
      </>
    )
  }

  return <PwnccgAmplitudeGpuPlot {...props} />
}
