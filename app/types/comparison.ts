export type ComparisonMethodKey = 'gt' | 'cvae' | 'cvae-withvar' | 'cvae-pwnccg'

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
