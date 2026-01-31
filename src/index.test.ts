import { test, expect } from 'vitest'
import { evaluateLinearSpline, linearSplineToSVGPath, evaluateCatmullRom, catmullRomToSVGPath } from './index.js'

// --- Linear spline ---

test('evaluateLinearSpline throws if fewer than 2 points', () => {
  expect(() => evaluateLinearSpline([{ x: 0, y: 0 }], 0)).toThrow('at least 2 points')
  expect(() => evaluateLinearSpline([], 0)).toThrow('at least 2 points')
})

test('evaluateLinearSpline clamps t outside [0,1]', () => {
  const points = [
    { x: 10, y: 20 },
    { x: 100, y: 200 },
  ]
  const [x0, y0] = evaluateLinearSpline(points, -0.5)
  expect(x0).toBeCloseTo(10)
  expect(y0).toBeCloseTo(20)

  const [x1, y1] = evaluateLinearSpline(points, 1.5)
  expect(x1).toBeCloseTo(100)
  expect(y1).toBeCloseTo(200)
})

test('evaluateLinearSpline interpolates correctly', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 50, y: 100 },
    { x: 100, y: 0 },
  ]

  const [x0, y0] = evaluateLinearSpline(points, 0)
  expect(x0).toBeCloseTo(0)
  expect(y0).toBeCloseTo(0)

  const [xm, ym] = evaluateLinearSpline(points, 0.5)
  expect(xm).toBeCloseTo(50)
  expect(ym).toBeCloseTo(100)

  const [x1, y1] = evaluateLinearSpline(points, 1)
  expect(x1).toBeCloseTo(100)
  expect(y1).toBeCloseTo(0)

  const [xq, yq] = evaluateLinearSpline(points, 0.25)
  expect(xq).toBeCloseTo(25)
  expect(yq).toBeCloseTo(50)
})

test('linearSplineToSVGPath produces M...L format', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 50, y: 100 },
    { x: 100, y: 0 },
  ]
  const path = linearSplineToSVGPath(points)
  expect(path).toBe('M 0,0 L 50,100 L 100,0')
})

test('linearSplineToSVGPath throws if fewer than 2 points', () => {
  expect(() => linearSplineToSVGPath([{ x: 0, y: 0 }])).toThrow('at least 2 points')
})

// --- Catmull-Rom spline ---

test('evaluateCatmullRom throws if fewer than 2 points', () => {
  expect(() => evaluateCatmullRom([{ x: 0, y: 0 }], 0)).toThrow('at least 2 points')
  expect(() => evaluateCatmullRom([], 0)).toThrow('at least 2 points')
})

test('evaluateCatmullRom clamps t outside [0,1]', () => {
  const points = [
    { x: 10, y: 20 },
    { x: 50, y: 80 },
    { x: 100, y: 200 },
  ]
  const [x0, y0] = evaluateCatmullRom(points, -0.5)
  expect(x0).toBeCloseTo(10)
  expect(y0).toBeCloseTo(20)

  const [x1, y1] = evaluateCatmullRom(points, 1.5)
  expect(x1).toBeCloseTo(100)
  expect(y1).toBeCloseTo(200)
})

test('evaluateCatmullRom hits endpoints', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 2 },
    { x: 3, y: 1 },
    { x: 4, y: 3 },
  ]
  const [x0, y0] = evaluateCatmullRom(points, 0)
  expect(x0).toBeCloseTo(0)
  expect(y0).toBeCloseTo(0)

  const [x1, y1] = evaluateCatmullRom(points, 1)
  expect(x1).toBeCloseTo(4)
  expect(y1).toBeCloseTo(3)
})

test('evaluateCatmullRom with 2 points', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 20 },
  ]
  const [x0, y0] = evaluateCatmullRom(points, 0)
  expect(x0).toBeCloseTo(0)
  expect(y0).toBeCloseTo(0)

  const [x1, y1] = evaluateCatmullRom(points, 1)
  expect(x1).toBeCloseTo(10)
  expect(y1).toBeCloseTo(20)

  const [xm, ym] = evaluateCatmullRom(points, 0.5)
  expect(xm).toBeCloseTo(5, 0)
  expect(ym).toBeCloseTo(10, 0)
})

test('catmullRomToSVGPath produces M...C format', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 1, y: 2 },
    { x: 3, y: 1 },
    { x: 4, y: 3 },
  ]
  const path = catmullRomToSVGPath(points)
  expect(path).toMatch(/^M /)
  expect(path).toMatch(/C /)
})

test('catmullRomToSVGPath throws if fewer than 2 points', () => {
  expect(() => catmullRomToSVGPath([{ x: 0, y: 0 }])).toThrow('at least 2 points')
})
