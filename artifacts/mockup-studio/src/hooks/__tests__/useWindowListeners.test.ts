import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWindowListeners } from '../useWindowListeners'

describe('useWindowListeners', () => {
  const setShowGlobalMenu = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('beforeunload', () => {
    it('registers beforeunload when screenshotUrl exists', () => {
      const addListener = vi.spyOn(window, 'addEventListener')
      renderHook(() => useWindowListeners({ state: { screenshotUrl: 'blob:test', videoUrl: null, texts: [], annotateStrokes: [] }, showGlobalMenu: false, setShowGlobalMenu }))
      expect(addListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      addListener.mockRestore()
    })

    it('registers beforeunload when videoUrl exists', () => {
      const addListener = vi.spyOn(window, 'addEventListener')
      renderHook(() => useWindowListeners({ state: { screenshotUrl: null, videoUrl: 'blob:test', texts: [], annotateStrokes: [] }, showGlobalMenu: false, setShowGlobalMenu }))
      expect(addListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      addListener.mockRestore()
    })

    it('registers beforeunload when texts exist', () => {
      const addListener = vi.spyOn(window, 'addEventListener')
      renderHook(() => useWindowListeners({ state: { screenshotUrl: null, videoUrl: null, texts: [{ id: '1', text: 'hi' }], annotateStrokes: [] }, showGlobalMenu: false, setShowGlobalMenu }))
      expect(addListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      addListener.mockRestore()
    })

    it('registers beforeunload when annotateStrokes exist', () => {
      const addListener = vi.spyOn(window, 'addEventListener')
      renderHook(() => useWindowListeners({ state: { screenshotUrl: null, videoUrl: null, texts: [], annotateStrokes: [{ id: '1', kind: 'free', tool: 'pen', color: '#000', lineWidth: 2, opacity: 1, points: [] }] }, showGlobalMenu: false, setShowGlobalMenu }))
      expect(addListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      addListener.mockRestore()
    })

    it('does not register beforeunload when no content exists', () => {
      const addListener = vi.spyOn(window, 'addEventListener')
      renderHook(() => useWindowListeners({ state: { screenshotUrl: null, videoUrl: null, texts: [], annotateStrokes: [] }, showGlobalMenu: false, setShowGlobalMenu }))
      expect(addListener).not.toHaveBeenCalledWith('beforeunload', expect.any(Function))
      addListener.mockRestore()
    })

    it('removes beforeunload listener on unmount', () => {
      const removeListener = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderHook(() => useWindowListeners({ state: { screenshotUrl: 'blob:test', videoUrl: null, texts: [], annotateStrokes: [] }, showGlobalMenu: false, setShowGlobalMenu }))
      unmount()
      expect(removeListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      removeListener.mockRestore()
    })
  })

  describe('global menu click-outside', () => {
    it('registers click listener when menu is open', () => {
      const addListener = vi.spyOn(window, 'addEventListener')
      renderHook(() => useWindowListeners({ state: { screenshotUrl: null, videoUrl: null, texts: [], annotateStrokes: [] }, showGlobalMenu: true, setShowGlobalMenu }))
      expect(addListener).toHaveBeenCalledWith('click', expect.any(Function))
      addListener.mockRestore()
    })

    it('does not register click listener when menu is closed', () => {
      const addListener = vi.spyOn(window, 'addEventListener')
      renderHook(() => useWindowListeners({ state: { screenshotUrl: null, videoUrl: null, texts: [], annotateStrokes: [] }, showGlobalMenu: false, setShowGlobalMenu }))
      expect(addListener).not.toHaveBeenCalledWith('click', expect.any(Function))
      addListener.mockRestore()
    })

    it('closes menu on click', () => {
      renderHook(() => useWindowListeners({ state: { screenshotUrl: null, videoUrl: null, texts: [], annotateStrokes: [] }, showGlobalMenu: true, setShowGlobalMenu }))
      window.dispatchEvent(new MouseEvent('click'))
      expect(setShowGlobalMenu).toHaveBeenCalledWith(false)
    })

    it('removes click listener on unmount', () => {
      const removeListener = vi.spyOn(window, 'removeEventListener')
      const { unmount } = renderHook(() => useWindowListeners({ state: { screenshotUrl: null, videoUrl: null, texts: [], annotateStrokes: [] }, showGlobalMenu: true, setShowGlobalMenu }))
      unmount()
      expect(removeListener).toHaveBeenCalledWith('click', expect.any(Function))
      removeListener.mockRestore()
    })
  })
})
