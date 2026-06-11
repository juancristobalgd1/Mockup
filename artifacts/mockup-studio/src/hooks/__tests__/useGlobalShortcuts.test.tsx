import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGlobalShortcuts } from '../useGlobalShortcuts'

function fireKeyDown(key: string, options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; target?: HTMLElement } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
    bubbles: true,
  })
  const target = options.target ?? document
  target.dispatchEvent(event)
  return event
}

describe('useGlobalShortcuts', () => {
  const undo = vi.fn()
  const redo = vi.fn()
  const updateState = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup: remove all keydown listeners so they don't leak between tests
    document.removeEventListener('keydown', () => {})
  })

  it('calls undo on Ctrl+Z', () => {
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('z', { ctrlKey: true })

    expect(undo).toHaveBeenCalledTimes(1)
    expect(redo).not.toHaveBeenCalled()
  })

  it('calls redo on Ctrl+Shift+Z', () => {
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('z', { ctrlKey: true, shiftKey: true })

    expect(redo).toHaveBeenCalledTimes(1)
    expect(undo).not.toHaveBeenCalled()
  })

  it('calls redo on Ctrl+Y', () => {
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('y', { ctrlKey: true })

    expect(redo).toHaveBeenCalledTimes(1)
    expect(undo).not.toHaveBeenCalled()
  })

  it('toggles grid on G key press', () => {
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('g')

    expect(updateState).toHaveBeenCalledWith({ showGrid: true })
  })

  it('toggles grid off on G key press', () => {
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: true, updateState }))

    fireKeyDown('g')

    expect(updateState).toHaveBeenCalledWith({ showGrid: false })
  })

  it('ignores shortcuts when input is focused', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('z', { ctrlKey: true, target: input })

    expect(undo).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })

  it('ignores shortcuts when textarea is focused', () => {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('z', { ctrlKey: true, target: textarea })

    expect(undo).not.toHaveBeenCalled()
    document.body.removeChild(textarea)
  })

  it('ignores shortcuts when contenteditable is focused', () => {
    const div = document.createElement('div')
    div.contentEditable = 'true'
    document.body.appendChild(div)
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('z', { ctrlKey: true, target: div })

    expect(undo).not.toHaveBeenCalled()
    document.body.removeChild(div)
  })

  it('supports Meta key on macOS', () => {
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('z', { metaKey: true })

    expect(undo).toHaveBeenCalledTimes(1)
  })

  it('does not call undo for plain Z key', () => {
    renderHook(() => useGlobalShortcuts({ undo, redo, showGrid: false, updateState }))

    fireKeyDown('z')

    expect(undo).not.toHaveBeenCalled()
  })
})
