export interface Point2D {
  readonly x: number
  readonly y: number
}

// --- Linear spline ---

export function evaluateLinearSpline(points: readonly Point2D[], t: number): [number, number] {
  if (points.length < 2) {
    throw new Error('evaluateLinearSpline requires at least 2 points')
  }
  t = Math.max(0, Math.min(1, t))
  const n = points.length - 1
  const scaled = t * n
  const i = Math.min(Math.floor(scaled), n - 1)
  const frac = scaled - i
  const p0 = points[i]
  const p1 = points[i + 1]
  return [p0.x + frac * (p1.x - p0.x), p0.y + frac * (p1.y - p0.y)]
}

export function linearSplineToSVGPath(points: readonly Point2D[]): string {
  if (points.length < 2) {
    throw new Error('linearSplineToSVGPath requires at least 2 points')
  }
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
}

// --- Catmull-Rom spline (centripetal parameterization) ---

function knotValue(p0: Point2D, p1: Point2D, tPrev: number): number {
  const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y)
  if (dist === 0) return tPrev
  return tPrev + Math.sqrt(dist)
}

function barryGoldman(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t0: number,
  t1: number,
  t2: number,
  t3: number,
  u: number,
): number {
  if (t1 === t0 && t2 === t1) return p1
  if (t1 === t0) {
    const a2 = ((t2 - u) / (t2 - t1)) * p1 + ((u - t1) / (t2 - t1)) * p2
    const a3 = t3 === t2 ? p2 : ((t3 - u) / (t3 - t2)) * p2 + ((u - t2) / (t3 - t2)) * p3
    const b1 = t2 === t0 ? p1 : ((t2 - u) / (t2 - t0)) * p1 + ((u - t0) / (t2 - t0)) * a2
    const b2 = t3 === t1 ? a2 : ((t3 - u) / (t3 - t1)) * a2 + ((u - t1) / (t3 - t1)) * a3
    if (t2 === t1) return p1
    return ((t2 - u) / (t2 - t1)) * b1 + ((u - t1) / (t2 - t1)) * b2
  }

  const a1 = ((t1 - u) / (t1 - t0)) * p0 + ((u - t0) / (t1 - t0)) * p1
  const a2 = t2 === t1 ? p1 : ((t2 - u) / (t2 - t1)) * p1 + ((u - t1) / (t2 - t1)) * p2
  const a3 = t3 === t2 ? p2 : ((t3 - u) / (t3 - t2)) * p2 + ((u - t2) / (t3 - t2)) * p3

  const b1 = t2 === t0 ? a1 : ((t2 - u) / (t2 - t0)) * a1 + ((u - t0) / (t2 - t0)) * a2
  const b2 = t3 === t1 ? a2 : ((t3 - u) / (t3 - t1)) * a2 + ((u - t1) / (t3 - t1)) * a3

  if (t2 === t1) return b1
  return ((t2 - u) / (t2 - t1)) * b1 + ((u - t1) / (t2 - t1)) * b2
}

function evaluateSegment(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, frac: number): [number, number] {
  const t0 = 0
  const t1 = knotValue(p0, p1, t0)
  const t2 = knotValue(p1, p2, t1)
  const t3 = knotValue(p2, p3, t2)

  const u = t1 + frac * (t2 - t1)

  const x = barryGoldman(p0.x, p1.x, p2.x, p3.x, t0, t1, t2, t3, u)
  const y = barryGoldman(p0.y, p1.y, p2.y, p3.y, t0, t1, t2, t3, u)
  return [x, y]
}

export function evaluateCatmullRom(points: readonly Point2D[], t: number): [number, number] {
  if (points.length < 2) {
    throw new Error('evaluateCatmullRom requires at least 2 points')
  }
  t = Math.max(0, Math.min(1, t))

  const n = points.length - 1
  const padded: Point2D[] = [points[0], ...points, points[n]]

  const scaled = t * n
  const seg = Math.min(Math.floor(scaled), n - 1)
  const frac = scaled - seg

  const p0 = padded[seg]
  const p1 = padded[seg + 1]
  const p2 = padded[seg + 2]
  const p3 = padded[seg + 3]

  const t0 = 0
  const t1 = knotValue(p0, p1, t0)
  const t2 = knotValue(p1, p2, t1)
  const t3 = knotValue(p2, p3, t2)

  const u = t1 + frac * (t2 - t1)

  const x = barryGoldman(p0.x, p1.x, p2.x, p3.x, t0, t1, t2, t3, u)
  const y = barryGoldman(p0.y, p1.y, p2.y, p3.y, t0, t1, t2, t3, u)
  return [x, y]
}

export function catmullRomToSVGPath(points: readonly Point2D[]): string {
  if (points.length < 2) {
    throw new Error('catmullRomToSVGPath requires at least 2 points')
  }

  const n = points.length - 1
  const padded: Point2D[] = [points[0], ...points, points[n]]

  const parts: string[] = [`M ${points[0].x},${points[0].y}`]

  for (let seg = 0; seg < n; seg++) {
    const p0 = padded[seg]
    const p1 = padded[seg + 1]
    const p2 = padded[seg + 2]
    const p3 = padded[seg + 3]

    const [q1x, q1y] = evaluateSegment(p0, p1, p2, p3, 1 / 3)
    const [q2x, q2y] = evaluateSegment(p0, p1, p2, p3, 2 / 3)

    const b1x = (18 * q1x - 9 * q2x - 5 * p1.x + 2 * p2.x) / 6
    const b1y = (18 * q1y - 9 * q2y - 5 * p1.y + 2 * p2.y) / 6
    const b2x = (18 * q2x - 9 * q1x - 5 * p2.x + 2 * p1.x) / 6
    const b2y = (18 * q2y - 9 * q1y - 5 * p2.y + 2 * p1.y) / 6

    parts.push(`C ${b1x},${b1y} ${b2x},${b2y} ${p2.x},${p2.y}`)
  }

  return parts.join(' ')
}
