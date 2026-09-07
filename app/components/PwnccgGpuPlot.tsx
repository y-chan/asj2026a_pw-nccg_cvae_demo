'use client'

import { useEffect, useRef, useState } from 'react'

import { type ComplexPoint, LIMIT } from '@/app/lib/pwnccg'

const margin = { l: 48, r: 16, t: 16, b: 48 }
const clamp = (value: number) => Math.max(-LIMIT, Math.min(LIMIT, value))

const shader = /* wgsl */ `
struct Params {
  resolution: vec2f,
  alpha: f32,
  variance: f32,
  mu: vec2f,
  padding: vec2f,
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

fn viridis(t: f32) -> vec3f {
  let c0 = vec3f(0.277727, 0.005407, 0.334099);
  let c1 = vec3f(0.105093, 1.404613, 1.384590);
  let c2 = vec3f(-0.330861, 0.214847, 0.095095);
  let c3 = vec3f(-4.634230, -5.799100, -19.332440);
  let c4 = vec3f(6.228269, 14.179933, 56.690552);
  let c5 = vec3f(4.776384, -13.745145, -65.353032);
  let c6 = vec3f(-5.435455, 4.645852, 26.312435);
  return clamp(c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6))))), vec3f(0.0), vec3f(1.0));
}

fn peakLogScore() -> f32 {
  let muRadius = length(params.mu);
  let power = params.alpha - 1.0;
  let minimumRadius = sqrt(0.5) * 40.0 / params.resolution.x;
  var maximumLogScore = power * log(minimumRadius * minimumRadius) -
    (minimumRadius - muRadius) * (minimumRadius - muRadius) / params.variance;

  if (muRadius > minimumRadius) {
    maximumLogScore = max(maximumLogScore, power * log(muRadius * muRadius));
  }

  let discriminant = muRadius * muRadius + 4.0 * power * params.variance;
  if (discriminant > 0.0) {
    let radius = (muRadius + sqrt(discriminant)) / 2.0;
    if (radius > minimumRadius) {
      maximumLogScore = max(
        maximumLogScore,
        power * log(radius * radius) -
          (radius - muRadius) * (radius - muRadius) / params.variance,
      );
    }
  }
  return maximumLogScore;
}

@fragment
fn fragment(input: VertexOutput) -> @location(0) vec4f {
  let z = vec2f(
    input.pixel.x / params.resolution.x * 40.0 - 20.0,
    input.pixel.y / params.resolution.y * 40.0 - 20.0,
  );
  let radiusSquared = max(dot(z, z), 0.000001);
  let distanceSquared = dot(z - params.mu, z - params.mu);
  let logScore = (params.alpha - 1.0) * log(radiusSquared) - distanceSquared / params.variance;
  let linearIntensity = clamp(exp(logScore - peakLogScore()), 0.0, 1.0);
  return vec4f(viridis(linearIntensity), 1.0);
}
`

type Props = {
  alpha: number
  variance: number
  mu: ComplexPoint
  onMuChange: (mu: ComplexPoint) => void
}

type GpuState = {
  context: GPUCanvasContext
  device: GPUDevice
  pipeline: GPURenderPipeline
  uniformBuffer: GPUBuffer
  bindGroup: GPUBindGroup
}

export default function PwnccgGpuPlot({
  alpha,
  variance,
  mu,
  onMuChange,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const gpu = useRef<GpuState | null>(null)
  const frame = useRef<number | null>(null)
  const pending = useRef<ComplexPoint | null>(null)
  const [size, setSize] = useState(0)
  const [ready, setReady] = useState(false)
  const side = Math.max(1, size - margin.l - margin.r)

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
    const pixels = Math.max(1, Math.floor(side * pixelRatio))
    canvasElement.width = pixels
    canvasElement.height = pixels
    canvasElement.style.width = `${side}px`
    canvasElement.style.height = `${side}px`
    const values = new Float32Array([
      pixels,
      pixels,
      alpha,
      variance,
      mu.re,
      mu.im,
      0,
      0,
    ])
    state.device.queue.writeBuffer(state.uniformBuffer, 0, values)
    const encoder = state.device.createCommandEncoder()
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: state.context.getCurrentTexture().createView(),
          clearValue: { r: 0.267, g: 0.004, b: 0.329, a: 1 },
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
  }, [alpha, variance, mu, ready, side, size])

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    pending.current = {
      re: clamp(((event.clientX - bounds.left) / bounds.width) * 40 - LIMIT),
      im: clamp(LIMIT - ((event.clientY - bounds.top) / bounds.height) * 40),
    }
    if (frame.current === null) {
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        if (pending.current) onMuChange(pending.current)
      })
    }
  }

  const height = side + margin.t + margin.b

  return (
    <div ref={container} className="relative w-full" style={{ height }}>
      <div
        className="absolute overflow-hidden"
        style={{ left: margin.l, top: margin.t, width: side, height: side }}
      >
        <canvas ref={canvas} aria-label="PW-NCCGの形状" />
      </div>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        viewBox={`0 0 ${size} ${height}`}
      >
        <g fill="none" stroke="#777" strokeWidth="1">
          <line
            x1={margin.l}
            y1={margin.t + side}
            x2={margin.l + side}
            y2={margin.t + side}
          />
          <line
            x1={margin.l}
            y1={margin.t}
            x2={margin.l}
            y2={margin.t + side}
          />
        </g>
        <g fill="#333" fontSize="11" textAnchor="middle">
          {[-20, -10, 0, 10, 20].map((value) => {
            const x = margin.l + ((value + LIMIT) / 40) * side
            return (
              <text key={`x-${value}`} x={x} y={height - 22}>
                {value}
              </text>
            )
          })}
          <text x={margin.l + side / 2} y={height - 4}>
            Re(z)
          </text>
        </g>
        <g fill="#333" fontSize="11" textAnchor="end">
          {[-20, -10, 0, 10, 20].map((value) => {
            const y = margin.t + ((LIMIT - value) / 40) * side
            return (
              <text key={`y-${value}`} x={margin.l - 7} y={y + 4}>
                {value}
              </text>
            )
          })}
          <text transform={`translate(16 ${margin.t + side / 2}) rotate(-90)`}>
            Im(z)
          </text>
        </g>
      </svg>
      <div
        className="absolute touch-none cursor-crosshair"
        style={{ left: margin.l, top: margin.t, width: side, height: side }}
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
            left: `${((mu.re + LIMIT) / 40) * 100}%`,
            top: `${((LIMIT - mu.im) / 40) * 100}%`,
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
            onMuChange({
              re: clamp(mu.re + offset[0]),
              im: clamp(mu.im + offset[1]),
            })
          }}
        >
          μ
        </button>
      </div>
    </div>
  )
}
