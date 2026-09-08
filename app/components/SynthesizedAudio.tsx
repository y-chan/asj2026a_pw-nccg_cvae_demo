'use client'

import { useEffect, useState } from 'react'

import { audioSamplesToWav, parametersToAudio } from '@/app/lib/istft'
import type { ComparisonMethodKey, ParameterGrid } from '@/app/types/comparison'

export default function SynthesizedAudio({
  parameters,
  method,
}: {
  parameters: ParameterGrid | null
  method: ComparisonMethodKey
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!parameters) return
    let active = true
    let nextUrl: string | null = null
    void Promise.resolve().then(() => {
      try {
        const { samples, sampleRate } = parametersToAudio(parameters, method)
        nextUrl = URL.createObjectURL(audioSamplesToWav(samples, sampleRate))
        if (active) setUrl(nextUrl)
        else URL.revokeObjectURL(nextUrl)
      } catch (reason) {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : '音声を生成できませんでした',
          )
        }
      }
    })
    return () => {
      active = false
      if (nextUrl) URL.revokeObjectURL(nextUrl)
    }
  }, [method, parameters])

  if (error) return <p className="text-xs text-amber-800">{error}</p>
  if (!url) return <p className="text-xs text-neutral-600">音声を生成中…</p>
  return <audio className="w-full" controls src={url} />
}
