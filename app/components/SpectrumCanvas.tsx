'use client'

import { useEffect, useRef } from 'react'

import type { SpectrumGrid } from '@/app/lib/comparisonData'

type Props = {
  spectrum: SpectrumGrid | null
  imageUrl: string | null
  selected: { time: number; frequency: number } | null
  onSelect: (value: { time: number; frequency: number }) => void
}

function viridis(value: number) {
  const colors = [
    [68, 1, 84],
    [59, 82, 139],
    [33, 145, 140],
    [94, 201, 98],
    [253, 231, 37],
  ]
  const position = Math.max(0, Math.min(0.99999, value)) * (colors.length - 1)
  const index = Math.floor(position)
  const amount = position - index
  const left = colors[index]
  const right = colors[index + 1] ?? left
  return [
    Math.round(left[0] + (right[0] - left[0]) * amount),
    Math.round(left[1] + (right[1] - left[1]) * amount),
    Math.round(left[2] + (right[2] - left[2]) * amount),
  ]
}

export default function SpectrumCanvas({
  spectrum,
  imageUrl,
  selected,
  onSelect,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const width = 640
  const height = 320

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const context = element.getContext('2d')
    if (!context) return
    context.clearRect(0, 0, width, height)
    if (!spectrum) return
    const pixels = context.createImageData(width, height)
    const range = Math.max(1e-12, spectrum.max - spectrum.min)
    for (let y = 0; y < height; y += 1) {
      const frequency = Math.min(
        spectrum.rows - 1,
        Math.floor((1 - y / height) * spectrum.rows),
      )
      for (let x = 0; x < width; x += 1) {
        const time = Math.min(
          spectrum.columns - 1,
          Math.floor((x / width) * spectrum.columns),
        )
        const raw = spectrum.values[frequency * spectrum.columns + time]
        const [red, green, blue] = viridis((raw - spectrum.min) / range)
        const index = (y * width + x) * 4
        pixels.data[index] = red
        pixels.data[index + 1] = green
        pixels.data[index + 2] = blue
        pixels.data[index + 3] = 255
      }
    }
    context.putImageData(pixels, 0, 0)
  }, [imageUrl, spectrum])

  function selectFromPointer(event: React.PointerEvent<HTMLCanvasElement>) {
    const element = event.currentTarget
    const bounds = element.getBoundingClientRect()
    const columns = spectrum?.columns ?? 1
    const rows = spectrum?.rows ?? 1
    const time = Math.min(
      columns - 1,
      Math.max(
        0,
        Math.floor(((event.clientX - bounds.left) / bounds.width) * columns),
      ),
    )
    const frequency = Math.min(
      rows - 1,
      Math.max(
        0,
        Math.floor((1 - (event.clientY - bounds.top) / bounds.height) * rows),
      ),
    )
    onSelect({ time, frequency })
  }

  return (
    <div className="relative overflow-hidden rounded border border-neutral-300 bg-[#440154]">
      <canvas
        ref={canvas}
        width={width}
        height={height}
        className="block aspect-[2/1] h-auto w-full touch-none"
        aria-label="スペクトル。クリックまたはタップ、ドラッグでbinを選択"
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return
          event.currentTarget.setPointerCapture(event.pointerId)
          selectFromPointer(event)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            selectFromPointer(event)
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            selectFromPointer(event)
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
        }}
      />
      {selected && (spectrum || imageUrl) && (
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{
            left: `${((selected.time + 0.5) / Math.max(1, spectrum?.columns ?? 1)) * 100}%`,
            top: `${(1 - (selected.frequency + 0.5) / Math.max(1, spectrum?.rows ?? 1)) * 100}%`,
          }}
        />
      )}
    </div>
  )
}
