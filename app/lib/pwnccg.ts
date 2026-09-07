export type ComplexPoint = { re: number; im: number }

export const LIMIT = 20
export const GRID_SIZE = 400
// Cell centers avoid evaluating the integrable singularity at z = 0.
function makeCoordinates(size: number) {
  return Array.from(
    { length: size },
    (_, i) => -LIMIT + ((i + 0.5) * 2 * LIMIT) / size,
  )
}
export const coordinates = makeCoordinates(GRID_SIZE)
export const previewCoordinates = makeCoordinates(200)

export function shapeGrid(
  alpha: number,
  variance: number,
  mu: ComplexPoint,
  grid = coordinates,
) {
  if (!(alpha > 0) || !(variance > 0)) {
    throw new Error('alpha and variance must be positive')
  }
  let maximum = 0
  const values = grid.map((y) =>
    grid.map((x) => {
      const logScore =
        (alpha - 1) * Math.log(x * x + y * y) -
        ((x - mu.re) ** 2 + (y - mu.im) ** 2) / variance
      // Stable log(1 + exp(logScore)), without overflowing the raw score.
      const value =
        Math.max(logScore, 0) + Math.log1p(Math.exp(-Math.abs(logScore)))
      maximum = Math.max(maximum, value)
      return value
    }),
  )
  return values.map((row) =>
    row.map((value) => (maximum > 0 ? value / maximum : 0)),
  )
}
