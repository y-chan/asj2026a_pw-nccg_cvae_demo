export type AmplitudePoint = {
  r: number
  value: number
}

// Cephes/PyTorch's exponentially scaled I0 approximation.
// The coefficients are evaluated by the Clenshaw recurrence in chbevl.
export const I0E_SMALL_COEFFICIENTS = [
  -4.4153416464793393795e-18, 3.33079451882223809783e-17,
  -2.43127984654795469359e-16, 1.71539128555513303061e-15,
  -1.16853328779934516808e-14, 7.67618549860493561688e-14,
  -4.8564467831119294609e-13, 2.95505266312963983461e-12,
  -1.72682629144155570723e-11, 9.67580903537323691224e-11,
  -5.18979560163526290666e-10, 2.65982372468238665035e-9,
  -1.30002500998624804212e-8, 6.04699502254191894932e-8,
  -2.67079385394061173391e-7, 1.11738753912010371815e-6,
  -4.41673835845875056359e-6, 1.64484480707288970893e-5,
  -5.75419501008210370398e-5, 1.88502885095841655729e-4,
  -5.76375574538582365885e-4, 1.63947561694133579842e-3,
  -4.3243099950505759443e-3, 1.05464603945949983183e-2,
  -2.37374148058994688156e-2, 4.93052842396707084878e-2,
  -9.4901097048047644421e-2, 1.71620901522208775349e-1,
  -3.04682672343198398683e-1, 6.76795274409476084995e-1,
] as const

export const I0E_LARGE_COEFFICIENTS = [
  -7.23318048787475395456e-18, -4.83050448594418207126e-18,
  4.46562142029675999901e-17, 3.4612228676974610931e-17,
  -2.82762398051658348494e-16, -3.42548561967721913462e-16,
  1.7725601330565263836e-15, 3.81168066935262242075e-15,
  -9.5548466988283076487e-15, -4.15056934728722208663e-14,
  1.54008621752140982691e-14, 3.85277838274214270114e-13,
  7.18012445138366623367e-13, -1.79417853150680611778e-12,
  -1.32158118404477131188e-11, -3.14991652796324136454e-11,
  1.18891471078464383424e-11, 4.9406023882249695891e-10,
  3.39623202570838634515e-9, 2.26666899049817806459e-8,
  2.04891858946906374183e-7, 2.89137052083475648297e-6,
  6.88975834691682398426e-5, 3.3691164782556940899e-3,
  8.04490411014108831608e-1,
] as const

function chbevl(x: number, coefficients: readonly number[]) {
  let b0 = coefficients[0]
  let b1 = 0
  let b2 = 0
  for (let index = 1; index < coefficients.length; index += 1) {
    b2 = b1
    b1 = b0
    b0 = x * b1 - b2 + coefficients[index]
  }
  return 0.5 * (b0 - b2)
}

export function i0e(input: number) {
  const x = Math.abs(input)
  if (x <= 8) {
    return chbevl(x / 2 - 2, I0E_SMALL_COEFFICIENTS)
  }
  return chbevl(32 / x - 2, I0E_LARGE_COEFFICIENTS) / Math.sqrt(x)
}

export function logI0(input: number) {
  const x = Math.abs(input)
  return x + Math.log(Math.max(i0e(x), Number.MIN_VALUE))
}

export function logAmplitudeShape(
  r: number,
  alpha: number,
  variance: number,
  nu: number,
) {
  const safeR = Math.max(r, 1e-12)
  const safeVariance = Math.max(variance, 1e-6)
  const x = (2 * nu * safeR) / safeVariance
  return (
    (2 * alpha - 1) * Math.log(safeR) -
    (safeR * safeR) / safeVariance +
    x +
    Math.log(Math.max(i0e(x), Number.MIN_VALUE))
  )
}

export function amplitudeShape(
  alpha: number,
  variance: number,
  nu: number,
  count = 400,
  limit = 20,
): AmplitudePoint[] {
  if (!(alpha > 0) || !(variance > 0) || !(nu >= 0)) {
    throw new Error('alpha, variance, and nu must be valid')
  }
  const points = Array.from({ length: count }, (_, index) => {
    const r = ((index + 0.5) * limit) / count
    return { r, value: logAmplitudeShape(r, alpha, variance, nu) }
  })
  const maximum = Math.max(...points.map(({ value }) => value))
  return points.map(({ r, value }) => ({
    r,
    value: Math.exp(Math.min(0, value - maximum)),
  }))
}

function wgslCoefficients(coefficients: readonly number[]) {
  return coefficients.map((value) => `${value}`).join(',\n  ')
}

// Keep the WGSL implementation tied to the same coefficient arrays as the
// JavaScript fallback. These are the two Cephes intervals: [0, 8] and (8, ∞).
export const i0eWgsl = `
const I0E_SMALL: array<f32, 30> = array<f32, 30>(
  ${wgslCoefficients(I0E_SMALL_COEFFICIENTS)}
);
const I0E_LARGE: array<f32, 25> = array<f32, 25>(
  ${wgslCoefficients(I0E_LARGE_COEFFICIENTS)}
);

fn chbevl30(x: f32) -> f32 {
  var b0 = I0E_SMALL[0];
  var b1 = 0.0;
  var b2 = 0.0;
  for (var index = 1u; index < 30u; index++) {
    b2 = b1;
    b1 = b0;
    b0 = x * b1 - b2 + I0E_SMALL[index];
  }
  return 0.5 * (b0 - b2);
}

fn chbevl25(x: f32) -> f32 {
  var b0 = I0E_LARGE[0];
  var b1 = 0.0;
  var b2 = 0.0;
  for (var index = 1u; index < 25u; index++) {
    b2 = b1;
    b1 = b0;
    b0 = x * b1 - b2 + I0E_LARGE[index];
  }
  return 0.5 * (b0 - b2);
}

fn i0e(input: f32) -> f32 {
  let x = abs(input);
  if (x <= 8.0) {
    return chbevl30(x * 0.5 - 2.0);
  }
  return chbevl25(32.0 / x - 2.0) / sqrt(x);
}

fn logI0(input: f32) -> f32 {
  let x = abs(input);
  return x + log(max(i0e(x), 1e-30));
}
`
