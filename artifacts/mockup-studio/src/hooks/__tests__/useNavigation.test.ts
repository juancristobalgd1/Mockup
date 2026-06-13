import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNavigation } from '../useNavigation'

describe('useNavigation', () => {
  it('initialises with default values', () => {
    const { result } = renderHook(() => useNavigation())
    expect(result.current.mobileTab).toBeNull()
    expect(result.current.activeTab).toBe('template')
    expect(result.current.timelineCollapsed).toBe(false)
    expect(result.current.showGlobalMenu).toBe(false)
    expect(result.current.backgroundPanelView).toBe('hub')
    expect(result.current.devicePanelView).toBe('hub')
    expect(result.current.scenePanelView).toBe('hub')
    expect(result.current.labelsPanelView).toBe('hub')
    expect(result.current.annotatePanelView).toBe('hub')
  })

  it('sets mobile tab', () => {
    const { result } = renderHook(() => useNavigation())
    act(() => result.current.setMobileTab('device'))
    expect(result.current.mobileTab).toBe('device')
  })

  it('resets drill-down views when tab changes', () => {
    const { result } = renderHook(() => useNavigation())

    act(() => result.current.setBackgroundPanelView('content'))
    act(() => result.current.setDevicePanelView('content'))
    expect(result.current.backgroundPanelView).toBe('content')
    expect(result.current.devicePanelView).toBe('content')

    act(() => result.current.setMobileTab('background'))
    expect(result.current.backgroundPanelView).toBe('hub')
    expect(result.current.devicePanelView).toBe('content')

    act(() => result.current.setDevicePanelView('content'))
    act(() => result.current.setMobileTab('device'))
    expect(result.current.devicePanelView).toBe('hub')
    expect(result.current.backgroundPanelView).toBe('hub')
  })

  it('resets annotate panel view on annotate tab', () => {
    const { result } = renderHook(() => useNavigation())
    act(() => result.current.setAnnotatePanelView('shapes'))
    act(() => result.current.setMobileTab('annotate'))
    expect(result.current.annotatePanelView).toBe('hub')
  })

  it('resets scene panel view on canvas tab', () => {
    const { result } = renderHook(() => useNavigation())
    act(() => result.current.setScenePanelView('content'))
    act(() => result.current.setMobileTab('canvas'))
    expect(result.current.scenePanelView).toBe('hub')
  })

  it('resets labels panel view on labels tab', () => {
    const { result } = renderHook(() => useNavigation())
    act(() => result.current.setLabelsPanelView('content'))
    act(() => result.current.setMobileTab('labels'))
    expect(result.current.labelsPanelView).toBe('hub')
  })

  it('sets active tab', () => {
    const { result } = renderHook(() => useNavigation())
    act(() => result.current.setActiveTab('device'))
    expect(result.current.activeTab).toBe('device')
  })

  it('toggles timeline collapsed', () => {
    const { result } = renderHook(() => useNavigation())
    expect(result.current.timelineCollapsed).toBe(false)
    act(() => result.current.setTimelineCollapsed(true))
    expect(result.current.timelineCollapsed).toBe(true)
  })

  it('toggles global menu', () => {
    const { result } = renderHook(() => useNavigation())
    act(() => result.current.setShowGlobalMenu(true))
    expect(result.current.showGlobalMenu).toBe(true)
  })
})
