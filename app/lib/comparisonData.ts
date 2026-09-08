import { load, type NpyArray, type TypedArray } from 'npyjs'

import type { ComplexPoint } from '@/app/lib/pwnccg'

export type ComparisonMethodKey = 'gt' | 'cvae' | 'cvae-withvar' | 'cvae-pwnccg'

export type SpectrumGrid = {
  values: Float32Array
  rows: number
  columns: number
  min: number
  max: number
}

export type ParameterGrid = {
  muRe: Float32Array
  muIm: Float32Array
  distributionMuRe: Float32Array
  distributionMuIm: Float32Array
  variance?: Float32Array
  alpha?: Float32Array
  rows: number
  columns: number
}

export type ComparisonMethodData = {
  audioUrl: string
  spectrum: SpectrumGrid | null
  parameters: ParameterGrid | null
  imageUrl: string | null
  warning: string | null
}

export type ComparisonData = Record<ComparisonMethodKey, ComparisonMethodData>

type NumericNpy = NpyArray<TypedArray>

type NormalizationStats = {
  meanRe: number[]
  meanIm: number[]
  std: number[]
}

const methodKeys: ComparisonMethodKey[] = [
  'gt',
  'cvae',
  'cvae-withvar',
  'cvae-pwnccg',
]

const sourceDirectories: Record<ComparisonMethodKey, string> = {
  gt: 'gt',
  cvae: 'cvae',
  'cvae-withvar': 'cvae-withvar',
  'cvae-pwnccg': 'cvae-pwnccg',
}

const loadedData = new Map<string, Promise<ComparisonData>>()

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function pathsFor(sample: string, method: ComparisonMethodKey, suffix: string) {
  const directory = sourceDirectories[method]
  const suffixPart = suffix ? `_${suffix}` : ''
  const hyphenSuffixPart = suffix ? `-${suffix}` : ''
  return unique([
    `/${directory}/${sample}${hyphenSuffixPart}.npy`,
    `/${directory}/${sample}${suffixPart}.npy`,
    `/npy/${directory}/${sample}${hyphenSuffixPart}.npy`,
    `/npy/${directory}/${sample}${suffixPart}.npy`,
    `/data/${sample}_${directory}${suffixPart}.npy`,
    `/data/${sample}${suffixPart}.npy`,
    `/spectrogram/${directory}/${sample}${suffixPart}.npy`,
  ])
}

async function loadOptional(path: string) {
  const response = await fetch(path)
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
  return load(await response.arrayBuffer()) as Promise<NumericNpy>
}

async function loadFirst(paths: string[]) {
  for (const path of paths) {
    const result = await loadOptional(path)
    if (result) return { path, result }
  }
  return null
}

function spatialShape(array: NumericNpy) {
  if (array.shape.length < 2) {
    throw new Error('2次元以上の.npy配列が必要です')
  }
  const lastDimension = array.shape[array.shape.length - 1]
  const channelFirst =
    array.shape.length >= 3 && array.shape[0] <= 4 && lastDimension > 4
  const rows = channelFirst ? array.shape[1] : array.shape[0]
  const columns = channelFirst ? array.shape[2] : array.shape[1]
  if (!rows || !columns) throw new Error('空の.npy配列です')
  return { rows, columns }
}

function flatIndex(array: NumericNpy, indices: number[]) {
  let index = 0
  let stride = 1
  if (array.fortranOrder) {
    for (let dimension = 0; dimension < array.shape.length; dimension += 1) {
      index += indices[dimension] * stride
      stride *= array.shape[dimension]
    }
    return index
  }
  for (let dimension = array.shape.length - 1; dimension >= 0; dimension -= 1) {
    index += indices[dimension] * stride
    stride *= array.shape[dimension]
  }
  return index
}

function isComplex(array: NumericNpy) {
  return array.dtype === 'c8' || array.dtype === 'c16'
}

function arrayNumber(data: ArrayLike<number | bigint>, index: number) {
  const value = data[index]
  return typeof value === 'bigint' ? Number(value) : Number(value)
}

function componentAt(
  array: NumericNpy,
  component: number,
  row: number,
  column: number,
) {
  const data = array.data as ArrayLike<number | bigint>
  const lastDimension = array.shape[array.shape.length - 1]
  if (
    array.shape.length >= 3 &&
    lastDimension > component &&
    lastDimension <= 4
  ) {
    return arrayNumber(data, flatIndex(array, [row, column, component]))
  }
  if (array.shape.length >= 3 && array.shape[0] <= 4) {
    return arrayNumber(data, flatIndex(array, [component, row, column]))
  }
  if (component > 0) return 0
  return arrayNumber(data, flatIndex(array, [row, column]))
}

function componentCount(array: NumericNpy) {
  const lastDimension = array.shape[array.shape.length - 1]
  if (array.shape.length >= 3 && lastDimension <= 4) return lastDimension
  if (array.shape.length >= 3 && array.shape[0] <= 4) return array.shape[0]
  return 1
}

function toParameters(
  muArray: NumericNpy,
  varianceArray: NumericNpy | null,
  alphaArray: NumericNpy | null,
  stats: NormalizationStats,
  centerDistribution: boolean,
  varianceComponent = 0,
  alphaComponent = 0,
): ParameterGrid {
  const { rows, columns } = spatialShape(muArray)
  const muRe = new Float32Array(rows * columns)
  const muIm = new Float32Array(rows * columns)
  const distributionMuRe = new Float32Array(rows * columns)
  const distributionMuIm = new Float32Array(rows * columns)
  const variance = varianceArray ? new Float32Array(rows * columns) : undefined
  const alpha = alphaArray ? new Float32Array(rows * columns) : undefined

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column
      if (isComplex(muArray)) {
        const data = muArray.data as ArrayLike<number | bigint>
        const flat = flatIndex(muArray, [row, column]) * 2
        muRe[index] = arrayNumber(data, flat)
        muIm[index] = arrayNumber(data, flat + 1)
      } else {
        muRe[index] = componentAt(muArray, 0, row, column)
        muIm[index] = componentAt(muArray, 1, row, column)
      }
      const meanRe = stats.meanRe[column]
      const meanIm = stats.meanIm[column]
      const scale = stats.std[column]
      muRe[index] = muRe[index] * scale + meanRe
      muIm[index] = muIm[index] * scale + meanIm
      distributionMuRe[index] = centerDistribution
        ? muRe[index] - meanRe
        : muRe[index]
      distributionMuIm[index] = centerDistribution
        ? muIm[index] - meanIm
        : muIm[index]
      if (variance && varianceArray) {
        variance[index] = Math.max(
          0.001,
          componentAt(varianceArray, varianceComponent, row, column),
        )
      }
      if (alpha && alphaArray) {
        alpha[index] = componentAt(alphaArray, alphaComponent, row, column)
      }
    }
  }
  return {
    muRe,
    muIm,
    distributionMuRe,
    distributionMuIm,
    variance,
    alpha,
    rows,
    columns,
  }
}

// The display transform is deliberately isolated here. At the moment every
// method uses log|mu|; PW-NCCG's expected-value transform can replace this later.
export function parametersToSpectrum(
  parameters: ParameterGrid,
  usePwnccgCorrection = false,
): SpectrumGrid {
  // Parameter arrays are [time, frequency], while the canvas expects
  // [frequency, time] so frequency is vertical and time is horizontal.
  const rows = parameters.columns
  const columns = parameters.rows
  const values = new Float32Array(rows * columns)
  let min = Infinity
  let max = -Infinity
  for (let time = 0; time < parameters.rows; time += 1) {
    for (let frequency = 0; frequency < parameters.columns; frequency += 1) {
      const sourceIndex = time * parameters.columns + frequency
      const magnitudeSquared =
        parameters.muRe[sourceIndex] * parameters.muRe[sourceIndex] +
        parameters.muIm[sourceIndex] * parameters.muIm[sourceIndex]
      let correctedMagnitudeSquared = magnitudeSquared
      if (usePwnccgCorrection) {
        const variance = Math.max(
          parameters.variance?.[sourceIndex] ?? 0.001,
          0.001,
        )
        const alpha = parameters.alpha?.[sourceIndex] ?? 1
        const lambda = magnitudeSquared / variance
        const correction = (alpha + lambda) / (1 + lambda)
        correctedMagnitudeSquared = magnitudeSquared * correction * correction
      }
      const value = 0.5 * Math.log(Math.max(correctedMagnitudeSquared, 1e-12))
      const displayIndex = frequency * columns + time
      values[displayIndex] = value
      min = Math.min(min, value)
      max = Math.max(max, value)
    }
  }
  return {
    values,
    rows,
    columns,
    min,
    max,
  }
}

async function loadParameters(
  sample: string,
  method: ComparisonMethodKey,
  stats: NormalizationStats,
): Promise<ParameterGrid | null> {
  const mu = await loadFirst(pathsFor(sample, method, 'mu'))
  const packed =
    mu ??
    (await loadFirst(
      unique([
        ...pathsFor(sample, method, 'mu-sigma2-alpha'),
        ...pathsFor(sample, method, 'mu-sigma2'),
        ...pathsFor(sample, method, ''),
        ...pathsFor(sample, method, method === 'cvae' ? 'mu' : method),
      ]),
    ))
  if (!packed) return null

  const variance =
    method === 'cvae-withvar' || method === 'cvae-pwnccg'
      ? await loadFirst(pathsFor(sample, method, 'sigma2'))
      : null
  const alpha =
    method === 'cvae-pwnccg'
      ? await loadFirst(pathsFor(sample, method, 'alpha'))
      : null

  const hasPackedComponents = componentCount(packed.result) >= 3
  const packedVariance =
    !variance && hasPackedComponents && method !== 'cvae' ? packed.result : null
  const packedAlpha =
    !alpha && method === 'cvae-pwnccg' && componentCount(packed.result) >= 4
      ? packed.result
      : null

  return toParameters(
    packed.result,
    variance?.result ?? packedVariance,
    alpha?.result ?? packedAlpha,
    stats,
    method === 'cvae-pwnccg',
    packedVariance ? 2 : 0,
    packedAlpha ? 3 : 0,
  )
}

async function loadStats(): Promise<NormalizationStats> {
  const response = await fetch('/stats.json')
  if (!response.ok) throw new Error(`stats.json: ${response.status}`)
  const json = (await response.json()) as { spec?: unknown }
  if (
    !Array.isArray(json.spec) ||
    json.spec.length !== 3 ||
    !json.spec.every((values) => Array.isArray(values))
  ) {
    throw new Error('stats.jsonのspecは3本の配列である必要があります')
  }
  const [meanRe, meanIm, std] = json.spec as number[][]
  if (
    !meanRe.length ||
    meanRe.length !== meanIm.length ||
    meanRe.length !== std.length
  ) {
    throw new Error('stats.jsonの配列長が一致していません')
  }
  return { meanRe, meanIm, std }
}

async function loadMethod(
  sample: string,
  method: ComparisonMethodKey,
  stats: NormalizationStats,
): Promise<ComparisonMethodData> {
  const audioUrl = `/${sourceDirectories[method]}/${sample}.wav`
  const warning: string[] = []
  let parameters: ParameterGrid | null = null
  let spectrum: SpectrumGrid | null = null

  try {
    parameters = await loadParameters(sample, method, stats)
  } catch (error) {
    warning.push(
      error instanceof Error ? error.message : 'パラメータの読込に失敗しました',
    )
  }

  if (parameters) {
    spectrum = parametersToSpectrum(parameters, method === 'cvae-pwnccg')
  }
  if (!spectrum) {
    warning.push('スペクトルデータが未配置です')
  }
  return {
    audioUrl,
    spectrum,
    parameters,
    imageUrl: null,
    warning: warning.length ? warning.join(' / ') : null,
  }
}

async function loadComparisonDataUncached(sample: string) {
  const stats = await loadStats()
  const entries = await Promise.all(
    methodKeys.map(
      async (method) =>
        [method, await loadMethod(sample, method, stats)] as const,
    ),
  )
  return Object.fromEntries(entries) as ComparisonData
}

export function loadComparisonData(sample: string) {
  const cached = loadedData.get(sample)
  if (cached) return cached
  const promise = loadComparisonDataUncached(sample)
  loadedData.set(sample, promise)
  return promise
}

export function parameterAt(
  parameters: ParameterGrid,
  time: number,
  frequency: number,
  sourceRows: number,
  sourceColumns: number,
) {
  const row = Math.min(
    parameters.rows - 1,
    Math.max(
      0,
      Math.round(
        (time / Math.max(1, sourceColumns - 1)) * (parameters.rows - 1),
      ),
    ),
  )
  const column = Math.min(
    parameters.columns - 1,
    Math.max(
      0,
      Math.round(
        (frequency / Math.max(1, sourceRows - 1)) * (parameters.columns - 1),
      ),
    ),
  )
  const index = row * parameters.columns + column
  const mu: ComplexPoint = {
    re: parameters.distributionMuRe[index],
    im: parameters.distributionMuIm[index],
  }
  return {
    mu,
    variance: parameters.variance?.[index] ?? 0.001,
    alpha: parameters.alpha?.[index] ?? 1,
  }
}
