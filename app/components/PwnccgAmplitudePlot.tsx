'use client'

import Plotly from 'plotly.js-cartesian-dist-min'
import { useEffect, useMemo, useRef, useState } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'

import { amplitudeShape } from '@/app/lib/pwnccgAmplitude'

const Plot = createPlotlyComponent(Plotly)
const margin = { l: 48, r: 16, t: 16, b: 48, autoexpand: false }

type Props = {
  alpha: number
  variance: number
  nu: number
  plotLimit?: number
  matchSpectrumHeight?: boolean
}

export default function PwnccgAmplitudePlot({
  alpha,
  variance,
  nu,
  plotLimit = 20,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const points = useMemo(
    () => amplitudeShape(alpha, variance, nu, 400, plotLimit),
    [alpha, variance, nu, plotLimit],
  )
  const availableSide = Math.max(1, width - margin.l - margin.r)
  const height = availableSide / 1.35 + margin.t + margin.b

  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={container} className="relative w-full">
      {width > 0 && (
        <Plot
          data={[
            {
              type: 'scatter',
              mode: 'lines',
              x: points.map(({ r }) => r),
              y: points.map(({ value }) => value),
              line: { color: '#91AAD5', width: 2 },
              fill: 'tozeroy',
              fillcolor: 'rgba(145, 170, 213, 0.12)',
              hoverinfo: 'skip',
            },
          ]}
          layout={{
            width,
            height,
            margin,
            autosize: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'sans-serif', color: '#111' },
            xaxis: {
              title: { text: 'r' },
              range: [0, plotLimit],
              fixedrange: true,
              dtick: plotLimit / 2,
              automargin: false,
            },
            yaxis: {
              title: { text: 'shape' },
              range: [0, 1],
              fixedrange: true,
              dtick: 0.5,
              automargin: false,
            },
            shapes: [
              {
                type: 'line',
                x0: Math.max(0, Math.min(plotLimit, nu)),
                x1: Math.max(0, Math.min(plotLimit, nu)),
                y0: 0,
                y1: 1,
                line: { color: 'rgba(100,100,100,0.8)', dash: 'dash' },
              },
            ],
            annotations: [
              {
                x: Math.max(0, Math.min(plotLimit, nu)),
                y: 1,
                text: 'ν',
                showarrow: false,
                font: { color: '#444', size: 11 },
                yanchor: 'top',
                xshift: 6,
              },
            ],
            showlegend: false,
          }}
          config={{
            displayModeBar: false,
            scrollZoom: false,
            responsive: false,
          }}
        />
      )}
    </div>
  )
}
