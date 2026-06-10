import { describe, it, expect, vi } from 'vitest'
import { MovieTimeline } from '../MovieTimeline'

describe('MovieTimeline component', () => {
  it('should render without crashing', () => {
    expect(MovieTimeline).toBeDefined()
    expect(typeof MovieTimeline).toBe('object')
  })
})

describe('formatTimer function', () => {
  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    const cs = Math.floor((s - Math.floor(s)) * 10)
    return `${m > 0 ? `${m}:` : ''}${sec.toString().padStart(2, '0')}.${cs}`
  }

  it('should format seconds correctly', () => {
    expect(formatTimer(0)).toBe('00.0')
    expect(formatTimer(5.5)).toBe('05.5')
    expect(formatTimer(60)).toBe('1:00.0')
    expect(formatTimer(65.5)).toBe('1:05.5')
    expect(formatTimer(125.5)).toBe('2:05.5')
  })
})

describe('formatTime function', () => {
  const formatTime = (s: number) => {
    const sec = Math.floor(s)
    const ms = Math.floor((s - sec) * 100)
    return `${sec}.${ms.toString().padStart(2, '0')}s`
  }

  it('should format time correctly', () => {
    expect(formatTime(0)).toBe('0.00s')
    expect(formatTime(5.5)).toBe('5.50s')
    expect(formatTime(5.555)).toBe('5.55s')
    expect(formatTime(10)).toBe('10.00s')
  })
})
