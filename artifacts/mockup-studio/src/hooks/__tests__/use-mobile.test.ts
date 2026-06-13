import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when viewport width is below breakpoint (768px)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true })
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when viewport width is at or above breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns false at exactly breakpoint boundary (768px)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true })
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListener = vi.fn()
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true })
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener,
      })),
      writable: true,
      configurable: true,
    })

    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(removeEventListener).toHaveBeenCalledOnce()
  })

  it('matchMedia is called with max-width query at 767px', () => {
    const matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    Object.defineProperty(window, 'matchMedia', { value: matchMedia, writable: true, configurable: true })

    renderHook(() => useIsMobile())
    expect(matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })
})
