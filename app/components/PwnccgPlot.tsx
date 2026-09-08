'use client'

import Plotly from 'plotly.js-cartesian-dist-min'
import { useEffect, useMemo, useRef, useState } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'

import {
  type ComplexPoint,
  coordinates,
  formatAxisTick,
  LIMIT,
  makeCoordinates,
  previewCoordinates,
  shapeGrid,
} from '@/app/lib/pwnccg'

const Plot = createPlotlyComponent(Plotly)
const margin = { l: 48, r: 16, t: 16, b: 48, autoexpand: false }

type Props = {
  alpha: number
  variance: number
  mu: ComplexPoint
  onMuChange?: (mu: ComplexPoint) => void
  interactive?: boolean
  plotLimit?: number
  matchSpectrumHeight?: boolean
}

export default function PwnccgPlot({
  alpha,
  variance,
  mu,
  onMuChange,
  interactive = true,
  plotLimit = LIMIT,
  matchSpectrumHeight = false,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const pending = useRef<ComplexPoint | null>(null)
  const [width, setWidth] = useState(0)
  const [zoomFactor, setZoomFactor] = useState(1)
  const [viewCenter, setViewCenter] = useState<ComplexPoint>({ re: 0, im: 0 })
  const [settled, setSettled] = useState({ alpha, variance, mu })

  // All controls share a coarse preview; restore detail after input settles.
  useEffect(() => {
    const timer = setTimeout(() => setSettled({ alpha, variance, mu }), 120)
    return () => clearTimeout(timer)
  }, [alpha, variance, mu])

  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  // Fixed margins and square axes keep the interaction layer aligned using
  // public layout settings only; no Plotly private coordinate APIs are needed.
  const availableSide = Math.max(1, width - margin.l - margin.r)
  const height = matchSpectrumHeight
    ? availableSide
    : availableSide + margin.t + margin.b
  const side = height - margin.t - margin.b

  const viewRadius = plotLimit / zoomFactor
  const centerRe = Math.max(
    -plotLimit + viewRadius,
    Math.min(plotLimit - viewRadius, viewCenter.re),
  )
  const centerIm = Math.max(
    -plotLimit + viewRadius,
    Math.min(plotLimit - viewRadius, viewCenter.im),
  )
  const xMin = centerRe - viewRadius
  const xMax = centerRe + viewRadius
  const yMin = centerIm - viewRadius
  const yMax = centerIm + viewRadius
  const baseGrid =
    settled.alpha === alpha &&
    settled.variance === variance &&
    settled.mu === mu
      ? coordinates
      : previewCoordinates
  const viewGridX = useMemo(
    () => makeCoordinates(xMin, xMax, baseGrid.length),
    [baseGrid.length, xMax, xMin],
  )
  const viewGridY = useMemo(
    () => makeCoordinates(yMin, yMax, baseGrid.length),
    [baseGrid.length, yMax, yMin],
  )
  const z = useMemo(
    () => shapeGrid(alpha, variance, mu, viewGridX, viewGridY),
    [alpha, variance, mu, viewGridX, viewGridY],
  )

  function changeZoom(event: React.ChangeEvent<HTMLInputElement>) {
    const nextZoomFactor = Number(event.target.value)
    setZoomFactor(nextZoomFactor)
    setViewCenter(mu)
  }

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    pending.current = {
      re: Math.max(
        -plotLimit,
        Math.min(
          plotLimit,
          xMin + ((event.clientX - bounds.left) / bounds.width) * (xMax - xMin),
        ),
      ),
      im: Math.max(
        -plotLimit,
        Math.min(
          plotLimit,
          yMax - ((event.clientY - bounds.top) / bounds.height) * (yMax - yMin),
        ),
      ),
    }
    if (frame.current === null) {
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        if (pending.current) onMuChange?.(pending.current)
      })
    }
  }

  return (
    <div
      ref={container}
      className="relative w-full pb-8"
      style={{ minHeight: 300 }}
    >
      {width > 0 && (
        <>
          <Plot
            data={[
              {
                type: 'heatmap',
                x: viewGridX,
                y: viewGridY,
                z,
                colorscale: 'Viridis',
                zmin: 0,
                zmax: 1,
                hoverinfo: 'skip',
                showscale: false,
              },
            ]}
            layout={{
              width,
              height,
              margin,
              autosize: false,
              paper_bgcolor: 'transparent',
              plot_bgcolor: '#440154',
              font: { family: 'sans-serif', color: '#111' },
              xaxis: {
                title: { text: 'Re(z)' },
                range: [xMin, xMax],
                fixedrange: true,
                tickvals: [xMin, centerRe, xMax],
                ticktext: [xMin, centerRe, xMax].map(formatAxisTick),
                automargin: false,
              },
              yaxis: {
                title: { text: 'Im(z)' },
                range: [yMin, yMax],
                fixedrange: true,
                tickvals: [yMin, centerIm, yMax],
                ticktext: [yMin, centerIm, yMax].map(formatAxisTick),
                automargin: false,
              },
              showlegend: false,
            }}
            config={{
              displayModeBar: false,
              scrollZoom: false,
              responsive: false,
            }}
          />
          {interactive && (
            <div
              className="absolute touch-none cursor-crosshair"
              style={{
                left: margin.l,
                top: margin.t,
                width: side,
                height: side,
              }}
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0) return
                event.currentTarget.setPointerCapture(event.pointerId)
                move(event)
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  move(event)
              }}
              onPointerUp={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  move(event)
                  event.currentTarget.releasePointerCapture(event.pointerId)
                }
              }}
              onPointerCancel={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  event.currentTarget.releasePointerCapture(event.pointerId)
              }}
            >
              <button
                type="button"
                aria-label={`μ: 実部 ${mu.re.toFixed(2)}、虚部 ${mu.im.toFixed(2)}。矢印キーで移動`}
                title="ドラッグ、または矢印キーでμを移動"
                className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-white bg-black/70 text-sm font-bold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:cursor-grabbing"
                style={{
                  left: `${((mu.re - xMin) / (xMax - xMin)) * 100}%`,
                  top: `${((yMax - mu.im) / (yMax - yMin)) * 100}%`,
                }}
                onKeyDown={(event) => {
                  const step = event.shiftKey ? 1 : 0.1
                  const offsets: Record<string, [number, number]> = {
                    ArrowLeft: [-step, 0],
                    ArrowRight: [step, 0],
                    ArrowUp: [0, step],
                    ArrowDown: [0, -step],
                  }
                  const offset = offsets[event.key]
                  if (!offset) return
                  event.preventDefault()
                  onMuChange?.({
                    re: Math.max(
                      -plotLimit,
                      Math.min(plotLimit, mu.re + offset[0]),
                    ),
                    im: Math.max(
                      -plotLimit,
                      Math.min(plotLimit, mu.im + offset[1]),
                    ),
                  })
                }}
              >
                μ
              </button>
            </div>
          )}
          <label className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-neutral-600">
            <span>拡大率 {zoomFactor.toFixed(1)}×</span>
            <input
              aria-label="分布の拡大率"
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={zoomFactor}
              onChange={changeZoom}
            />
          </label>
        </>
      )}
    </div>
  )
}
