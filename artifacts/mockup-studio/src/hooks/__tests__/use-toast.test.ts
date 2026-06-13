import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { reducer, useToast, toast } from '../use-toast'

describe('toast reducer', () => {
  it('ADD_TOAST adds toast to state', () => {
    const state = { toasts: [] }
    const toast = { id: '1', title: 'Hello', open: true }
    const result = reducer(state, { type: 'ADD_TOAST', toast: toast as any })
    expect(result.toasts).toHaveLength(1)
    expect(result.toasts[0].id).toBe('1')
    expect(result.toasts[0].title).toBe('Hello')
  })

  it('ADD_TOAST respects TOAST_LIMIT (1)', () => {
    const state = { toasts: [{ id: '1', title: 'First', open: true } as any] }
    const result = reducer(state, { type: 'ADD_TOAST', toast: { id: '2', title: 'Second', open: true } as any })
    expect(result.toasts).toHaveLength(1)
    expect(result.toasts[0].id).toBe('2')
  })

  it('UPDATE_TOAST updates existing toast by id', () => {
    const state = { toasts: [{ id: '1', title: 'Hello', open: true } as any] }
    const result = reducer(state, { type: 'UPDATE_TOAST', toast: { id: '1', title: 'Updated' } as any })
    expect(result.toasts[0].title).toBe('Updated')
  })

  it('DISMISS_TOAST sets open to false for specific toast', () => {
    const state = { toasts: [{ id: '1', title: 'Hello', open: true } as any] }
    const result = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' })
    expect(result.toasts[0].open).toBe(false)
  })

  it('DISMISS_TOAST dismisses all when no toastId given', () => {
    const state = { toasts: [
      { id: '1', title: 'A', open: true } as any,
      { id: '2', title: 'B', open: true } as any,
    ]}
    const result = reducer(state, { type: 'DISMISS_TOAST', toastId: undefined })
    expect(result.toasts.every(t => t.open === false)).toBe(true)
  })

  it('REMOVE_TOAST removes specific toast by id', () => {
    const state = { toasts: [
      { id: '1', title: 'A' } as any,
      { id: '2', title: 'B' } as any,
    ]}
    const result = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' })
    expect(result.toasts).toHaveLength(1)
    expect(result.toasts[0].id).toBe('2')
  })

  it('REMOVE_TOAST clears all when toastId is undefined', () => {
    const state = { toasts: [{ id: '1', title: 'A' } as any] }
    const result = reducer(state, { type: 'REMOVE_TOAST', toastId: undefined })
    expect(result.toasts).toHaveLength(0)
  })
})

describe('useToast() hook', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with empty toasts array', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('adds a toast and enforces TOAST_LIMIT of 1', () => {
    const { result } = renderHook(() => useToast())

    act(() => { result.current.toast({ title: 'First' }) })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('First')

    act(() => { result.current.toast({ title: 'Second' }) })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Second')
  })

  it('dismisses a toast by ID', () => {
    const { result } = renderHook(() => useToast())

    act(() => { result.current.toast({ title: 'Test' }) })
    const id = result.current.toasts[0].id

    act(() => { result.current.dismiss(id) })
    expect(result.current.toasts[0].open).toBe(false)
    expect(result.current.toasts[0].id).toBe(id)
  })

  it('dismisses all toasts when no ID given', () => {
    const { result } = renderHook(() => useToast())

    act(() => { result.current.toast({ title: 'A' }) })
    act(() => { result.current.dismiss() })
    expect(result.current.toasts[0].open).toBe(false)
  })
})

describe('toast() function', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns control object with id, dismiss, and update', () => {
    const t = toast({ title: 'Test Toast' })
    expect(t.id).toBeDefined()
    expect(t.id).toBeTruthy()
    expect(typeof t.dismiss).toBe('function')
    expect(typeof t.update).toBe('function')
  })

  it('generates unique sequential IDs', () => {
    const t1 = toast({ title: 'First' })
    const t2 = toast({ title: 'Second' })
    expect(t1.id).not.toBe(t2.id)
    expect(Number(t2.id)).toBe(Number(t1.id) + 1)
  })

  it('dismiss function sets toast open to false', () => {
    const { result } = renderHook(() => useToast())

    let dismissFn: () => void
    act(() => {
      const t = result.current.toast({ title: 'Dismiss Me' })
      dismissFn = t.dismiss
    })
    const ourToast = result.current.toasts.find(t => t.title === 'Dismiss Me')
    expect(ourToast).toBeDefined()
    expect(ourToast!.open).toBe(true)

    act(() => { dismissFn() })
    const dismissed = result.current.toasts.find(t => t.title === 'Dismiss Me')
    expect(dismissed!.open).toBe(false)
  })

  it('update function modifies toast properties', () => {
    const { result } = renderHook(() => useToast())

    let updateFn: (props: any) => void
    let toastId: string
    act(() => {
      const t = result.current.toast({ title: 'Original', description: 'Desc' })
      updateFn = t.update
      toastId = t.id
    })

    act(() => { updateFn({ id: toastId, title: 'Updated', description: 'New Desc' } as any) })
    const updated = result.current.toasts.find(t => t.id === toastId)
    expect(updated!.title).toBe('Updated')
    expect(updated!.description).toBe('New Desc')
  })
})
