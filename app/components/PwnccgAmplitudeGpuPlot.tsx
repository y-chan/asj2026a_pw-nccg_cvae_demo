'use client'

import { useEffect, useRef, useState } from 'react'

import { i0eWgsl } from '@/app/lib/pwnccgAmplitude'

const margin = { l: 48, r: 16, t: 16, b: 48 }

const shader = /* wgsl */ `
struct Params {
  resolution: vec2f,
  alpha: f32,
  variance: f32,
  nu: f32,
  plotLimit: f32,
  padding: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) pixel: vec2f,
}

@vertex
fn vertex(@builtin(vertex_index) index: u32) -> VertexOutput {
  var positions = array<vec2f, 6>(
    vec2f(0.0, 0.0),
    vec2f(1.0, 0.0),
    vec2f(0.0, 1.0),
    vec2f(0.0, 1.0),
    vec2f(1.0, 0.0),
    vec2f(1.0, 1.0),
  );
  let uv = positions[index];
  var output: VertexOutput;
  output.position = vec4f(uv * 2.0 - 1.0, 0.0, 1.0);
  output.pixel = uv * params.resolution;
  return output;
}

${i0eWgsl}

fn logShape(r: f32) -> f32 {
  let safeR = max(r, 1e-6);
  let x = 2.0 * params.nu * safeR / params.variance;
  return (2.0 * params.alpha - 1.0) * log(safeR) -
    safeR * safeR / params.variance + x + logI0(x);
}

fn maximumLogShape() -> f32 {
  var maximum = -1e30;
  for (var index = 0u; index < 512u; index++) {
    let r = (f32(index) + 0.5) * params.plotLimit / 512.0;
    maximum = max(maximum, logShape(r));
  }
  return maximum;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f {
  let r = input.pixel.x / params.resolution.x * params.plotLimit;
  let shape = clamp(exp(min(0.0, logShape(r) - maximumLogShape())), 0.0, 1.0);
  // The fullscreen triangle uses WebGPU's bottom-origin clip-space y here.
  // Convert shape=0 to the bottom and shape=1 to the top of the plot.
  let curveY = shape * params.resolution.y;
  // Use the local tangent so steep parts are measured perpendicular to the
  // curve instead of as a single-pixel vertical hit test.
  let rStep = params.plotLimit / params.resolution.x;
  let previousShape = clamp(exp(min(0.0, logShape(max(0.0, r - rStep)) - maximumLogShape())), 0.0, 1.0);
  let nextShape = clamp(exp(min(0.0, logShape(r + rStep) - maximumLogShape())), 0.0, 1.0);
  let localSlope = (nextShape - previousShape) * params.resolution.y * 0.5;
  let normalDistance = abs(input.pixel.y - curveY) / sqrt(1.0 + localSlope * localSlope);
  let lineAlpha = 1.0 - smoothstep(1.0, 2.5, normalDistance);

  // Draw the same linear shape curve as the Plotly fallback.
  return vec4f(0.569, 0.667, 0.835, lineAlpha);
}
`

type Props = {
  alpha: number
  variance: number
  nu: number
  plotLimit?: number
  matchSpectrumHeight?: boolean
}

type GpuState = {
  context: GPUCanvasContext
  device: GPUDevice
  pipeline: GPURenderPipeline
  uniformBuffer: GPUBuffer
  bindGroup: GPUBindGroup
}

export default function PwnccgAmplitudeGpuPlot({
  alpha,
  variance,
  nu,
  plotLimit = 20,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const gpu = useRef<GpuState | null>(null)
  const [size, setSize] = useState(0)
  const [ready, setReady] = useState(false)
  const plotWidth = Math.max(1, size - margin.l - margin.r)
  const plotHeight = plotWidth / 1.5
  const height = plotHeight + margin.t + margin.b

  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setSize(Math.max(1, entry.contentRect.width)),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function initialize() {
      const canvasElement = canvas.current
      if (!canvasElement || !navigator.gpu) return
      const adapter = await navigator.gpu.requestAdapter()
      const device = await adapter?.requestDevice()
      if (!device || cancelled) return
      const context = canvasElement.getContext('webgpu')
      if (!context) return
      const format = navigator.gpu.getPreferredCanvasFormat()
      context.configure({ device, format, alphaMode: 'premultiplied' })
      const shaderModule = device.createShaderModule({ code: shader })
      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' as const },
          },
        ],
      })
      const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      })
      const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: { module: shaderModule, entryPoint: 'vertex' },
        fragment: {
          module: shaderModule,
          entryPoint: 'fragment',
          targets: [{ format }],
        },
        primitive: { topology: 'triangle-list' },
      })
      const uniformBuffer = device.createBuffer({
        size: 32,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      })
      gpu.current = {
        context,
        device,
        pipeline,
        uniformBuffer,
        bindGroup,
      }
      setReady(true)
    }
    void initialize()
    return () => {
      cancelled = true
      gpu.current?.uniformBuffer.destroy()
      gpu.current = null
    }
  }, [])

  useEffect(() => {
    const state = gpu.current
    const canvasElement = canvas.current
    if (!state || !canvasElement || !size || !ready) return
    const pixelRatio = window.devicePixelRatio || 1
    const pixelsWidth = Math.max(1, Math.floor(plotWidth * pixelRatio))
    const pixelsHeight = Math.max(1, Math.floor(plotHeight * pixelRatio))
    canvasElement.width = pixelsWidth
    canvasElement.height = pixelsHeight
    canvasElement.style.width = `${plotWidth}px`
    canvasElement.style.height = `${plotHeight}px`
    state.device.queue.writeBuffer(
      state.uniformBuffer,
      0,
      new Float32Array([
        pixelsWidth,
        pixelsHeight,
        alpha,
        Math.max(variance, 1e-6),
        nu,
        plotLimit,
        0,
        0,
      ]),
    )
    const encoder = state.device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: state.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: 'clear' as const,
          storeOp: 'store' as const,
        },
      ],
    })
    pass.setPipeline(state.pipeline)
    pass.setBindGroup(0, state.bindGroup)
    pass.draw(6)
    pass.end()
    state.device.queue.submit([encoder.finish()])
  }, [alpha, variance, nu, plotLimit, plotHeight, plotWidth, ready, size])

  const markerPosition = Math.max(0, Math.min(plotLimit, nu))
  const markerLabelX = Math.min(
    margin.l + plotWidth - 8,
    margin.l + (markerPosition / plotLimit) * plotWidth + 6,
  )

  return (
    <div ref={container} className="relative w-full" style={{ height }}>
      <div
        className="absolute overflow-hidden"
        style={{
          left: margin.l,
          top: margin.t,
          width: plotWidth,
          height: plotHeight,
        }}
      >
        <canvas ref={canvas} aria-label="PW-NCCGの振幅分布" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 bottom-0 border-l border-dashed border-neutral-500"
          style={{ left: `${(markerPosition / plotLimit) * 100}%` }}
        />
      </div>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        viewBox={`0 0 ${size} ${height}`}
      >
        <g fill="none" stroke="#777" strokeWidth="1">
          <line
            x1={margin.l}
            y1={margin.t + plotHeight}
            x2={margin.l + plotWidth}
            y2={margin.t + plotHeight}
          />
          <line
            x1={margin.l}
            y1={margin.t}
            x2={margin.l}
            y2={margin.t + plotHeight}
          />
        </g>
        <g fill="#333" fontSize="11" textAnchor="middle">
          {[0, plotLimit / 2, plotLimit].map((value) => {
            const x = margin.l + (value / plotLimit) * plotWidth
            return (
              <text key={`x-${value}`} x={x} y={height - 22}>
                {value}
              </text>
            )
          })}
          <text x={margin.l + plotWidth / 2} y={height - 4}>
            r
          </text>
        </g>
        <g fill="#333" fontSize="11" textAnchor="end">
          {[0, 0.5, 1].map((value) => {
            const y = margin.t + (1 - value) * plotHeight
            return (
              <text key={`y-${value}`} x={margin.l - 7} y={y + 4}>
                {value}
              </text>
            )
          })}
          <text
            transform={`translate(16 ${margin.t + plotHeight / 2}) rotate(-90)`}
          >
            shape
          </text>
        </g>
        <text
          x={markerLabelX}
          y={margin.t + 12}
          fill="#444"
          fontSize="11"
          textAnchor="start"
        >
          ν
        </text>
      </svg>
    </div>
  )
}
