import { describe, it, expect } from 'vitest'
import { reducer } from '../use-toast'

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
