import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePropertyEditor } from '../usePropertyEditor'

describe('usePropertyEditor', () => {
  it('initialises all properties to null', () => {
    const { result } = renderHook(() => usePropertyEditor())
    expect(result.current.annotateProperty).toBeNull()
    expect(result.current.overlayProperty).toBeNull()
    expect(result.current.backgroundProperty).toBeNull()
    expect(result.current.patternsProperty).toBeNull()
    expect(result.current.deviceProperty).toBeNull()
  })

  it('sets individual properties', () => {
    const { result } = renderHook(() => usePropertyEditor())
    act(() => result.current.setAnnotateProperty('color'))
    expect(result.current.annotateProperty).toBe('color')

    act(() => result.current.setOverlayProperty('opacity'))
    expect(result.current.overlayProperty).toBe('opacity')
  })

  it('closeAllProperties resets all to null', () => {
    const { result } = renderHook(() => usePropertyEditor())
    act(() => {
      result.current.setAnnotateProperty('size')
      result.current.setOverlayProperty('color')
      result.current.setBackgroundProperty('blur')
      result.current.setPatternsProperty('scale')
      result.current.setDeviceProperty('shadow')
    })
    act(() => result.current.closeAllProperties())
    expect(result.current.annotateProperty).toBeNull()
    expect(result.current.overlayProperty).toBeNull()
    expect(result.current.backgroundProperty).toBeNull()
    expect(result.current.patternsProperty).toBeNull()
    expect(result.current.deviceProperty).toBeNull()
  })
})
