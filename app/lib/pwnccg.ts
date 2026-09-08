export type ComplexPoint = { re: number; im: number }

export const LIMIT = 20
export const GRID_SIZE = 400

export function formatAxisTick(value: number) {
  const truncated = Math.trunc(value * 100) / 100
  if (Object.is(truncated, -0)) return '0'
  return String(truncated)
}

// Cell centers avoid evaluating the integrable singularity at z = 0.
export function makeCoordinates(min: number, max: number, size: number) {
  return Array.from(
    { length: size },
    (_, i) => min + ((i + 0.5) * (max - min)) / size,
  )
}
export const coordinates = makeCoordinates(-LIMIT, LIMIT, GRID_SIZE)
export const previewCoordinates = makeCoordinates(-LIMIT, LIMIT, 200)

export function shapeGrid(
  alpha: number,
  variance: number,
  mu: ComplexPoint,
  gridX = coordinates,
  gridY = gridX,
) {
  if (!(alpha > 0) || !(variance > 0)) {
    throw new Error('alpha and variance must be positive')
  }
  let maximum = 0
  const values = gridY.map((y) =>
    gridX.map((x) => {
      const logScore =
        (alpha - 1) * Math.log(x * x + y * y) -
        ((x - mu.re) ** 2 + (y - mu.im) ** 2) / variance
      const value = Math.exp(logScore)
      maximum = Math.max(maximum, value)
      return value
    }),
  )
  return values.map((row) =>
    row.map((value) => (maximum > 0 ? value / maximum : 0)),
  )
}
