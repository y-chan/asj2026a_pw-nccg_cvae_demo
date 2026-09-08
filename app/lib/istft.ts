import type { ComparisonMethodKey, ParameterGrid } from '@/app/types/comparison'

const FILTER_LENGTH = 512
const HOP_LENGTH = 64
const SAMPLE_RATE = 16_000

function fft(real: Float32Array, imag: Float32Array, inverse: boolean) {
  const length = real.length
  for (let i = 1, j = 0; i < length; i += 1) {
    let bit = length >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[real[i], real[j]] = [real[j], real[i]]
      ;[imag[i], imag[j]] = [imag[j], imag[i]]
    }
  }
  for (let size = 2; size <= length; size <<= 1) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / size
    const stepReal = Math.cos(angle)
    const stepImag = Math.sin(angle)
    for (let start = 0; start < length; start += size) {
      let twiddleReal = 1
      let twiddleImag = 0
      const half = size >> 1
      for (let offset = 0; offset < half; offset += 1) {
        const even = start + offset
        const odd = even + half
        const productReal = real[odd] * twiddleReal - imag[odd] * twiddleImag
        const productImag = real[odd] * twiddleImag + imag[odd] * twiddleReal
        const evenReal = real[even]
        const evenImag = imag[even]
        real[even] = evenReal + productReal
        imag[even] = evenImag + productImag
        real[odd] = evenReal - productReal
        imag[odd] = evenImag - productImag
        const nextTwiddleReal = twiddleReal * stepReal - twiddleImag * stepImag
        twiddleImag = twiddleReal * stepImag + twiddleImag * stepReal
        twiddleReal = nextTwiddleReal
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < length; i += 1) {
      real[i] /= length
      imag[i] /= length
    }
  }
}

function correctionAt(
  parameters: ParameterGrid,
  index: number,
  method: ComparisonMethodKey,
) {
  if (method !== 'cvae-pwnccg') return 1
  const variance = Math.max(parameters.variance?.[index] ?? 0.001, 0.001)
  const alpha = parameters.alpha?.[index] ?? 1
  const magnitudeSquared =
    parameters.muRe[index] * parameters.muRe[index] +
    parameters.muIm[index] * parameters.muIm[index]
  const lambda = magnitudeSquared / variance
  return (alpha + lambda) / (1 + lambda)
}

export function parametersToAudio(
  parameters: ParameterGrid,
  method: ComparisonMethodKey,
) {
  const frames = parameters.rows
  const bins = parameters.columns
  if (bins !== FILTER_LENGTH / 2 + 1) {
    throw new Error(
      `iSTFTには${FILTER_LENGTH / 2 + 1} binsが必要です（実際: ${bins}）`,
    )
  }
  const fullLength = (frames - 1) * HOP_LENGTH + FILTER_LENGTH
  const signal = new Float32Array(fullLength)
  const normalization = new Float32Array(fullLength)
  const window = new Float32Array(FILTER_LENGTH)
  for (let i = 0; i < FILTER_LENGTH; i += 1) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FILTER_LENGTH)
  }

  for (let frame = 0; frame < frames; frame += 1) {
    const real = new Float32Array(FILTER_LENGTH)
    const imag = new Float32Array(FILTER_LENGTH)
    for (let frequency = 0; frequency < bins; frequency += 1) {
      const index = frame * bins + frequency
      const correction = correctionAt(parameters, index, method)
      real[frequency] = parameters.muRe[index] * correction
      imag[frequency] = parameters.muIm[index] * correction
    }
    for (let frequency = 1; frequency < FILTER_LENGTH / 2; frequency += 1) {
      real[FILTER_LENGTH - frequency] = real[frequency]
      imag[FILTER_LENGTH - frequency] = -imag[frequency]
    }
    fft(real, imag, true)
    const start = frame * HOP_LENGTH
    for (let i = 0; i < FILTER_LENGTH; i += 1) {
      const weightedWindow = window[i]
      signal[start + i] += real[i] * weightedWindow
      normalization[start + i] += weightedWindow * weightedWindow
    }
  }

  const outputLength = frames * HOP_LENGTH
  const output = new Float32Array(outputLength)
  const trim = FILTER_LENGTH / 2
  let peak = 0
  for (let i = 0; i < outputLength; i += 1) {
    const value = signal[i + trim] / Math.max(normalization[i + trim], 1e-8)
    output[i] = value
    peak = Math.max(peak, Math.abs(value))
  }
  if (peak > 1) {
    for (let i = 0; i < output.length; i += 1) output[i] /= peak
  }
  return { samples: output, sampleRate: SAMPLE_RATE }
}

export function audioSamplesToWav(samples: Float32Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1)
      view.setUint8(offset + i, value.charCodeAt(i))
  }
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(
      44 + i * 2,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true,
    )
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
