import { describe, it, expect } from 'vitest'
import {
  MovieTimeline,
  formatTimer,
  formatTime,
  snapTimelineTime,
  sortKeyframesByTime,
  buildTimelineScenes,
  buildPresetKeyframes,
  buildTemplateKeyframes,
  EASING_OPTIONS,
  ANIMATION_PRESETS,
  ANIMATION_TEMPLATES,
  MIN_SEGMENT_DURATION,
} from '../MovieTimeline'
import type { CameraKeyframe } from '../../../store'

describe('MovieTimeline component', () => {
  it('should be a renderable component', () => {
    expect(MovieTimeline).toBeDefined()
    expect(typeof MovieTimeline).toBe('object')
  })
})

describe('formatTimer', () => {
  it('formats seconds correctly', () => {
    expect(formatTimer(0)).toBe('00.0')
    expect(formatTimer(5.5)).toBe('05.5')
    expect(formatTimer(60)).toBe('1:00.0')
    expect(formatTimer(65.5)).toBe('1:05.5')
    expect(formatTimer(125.5)).toBe('2:05.5')
  })
})

describe('formatTime', () => {
  it('formats time correctly', () => {
    expect(formatTime(0)).toBe('0.00s')
    expect(formatTime(5.5)).toBe('5.50s')
    expect(formatTime(5.555)).toBe('5.55s')
    expect(formatTime(10)).toBe('10.00s')
  })
})

describe('snapTimelineTime', () => {
  it('snaps to nearest 0.05 increment', () => {
    expect(snapTimelineTime(0)).toBe(0)
    expect(snapTimelineTime(0.01)).toBe(0)
    expect(snapTimelineTime(0.02)).toBe(0)
    expect(snapTimelineTime(0.03)).toBe(0.05)
    expect(snapTimelineTime(0.07)).toBe(0.05)
    expect(snapTimelineTime(0.08)).toBe(0.1)
  })
})

describe('sortKeyframesByTime', () => {
  it('sorts keyframes by time ascending', () => {
    const kfs = [{ time: 5 }, { time: 0 }, { time: 2.5 }]
    expect(sortKeyframesByTime(kfs).map(k => k.time)).toEqual([0, 2.5, 5])
  })

  it('does not mutate the original array', () => {
    const kfs = [{ time: 5 }, { time: 0 }]
    const sorted = sortKeyframesByTime(kfs)
    expect(kfs[0].time).toBe(5)
    expect(sorted[0].time).toBe(0)
  })

  it('handles empty array', () => {
    expect(sortKeyframesByTime([])).toEqual([])
  })
})

describe('MIN_SEGMENT_DURATION', () => {
  it('is 0.25 seconds', () => {
    expect(MIN_SEGMENT_DURATION).toBe(0.25)
  })
})

describe('buildTimelineScenes', () => {
  const makeKf = (overrides: Partial<CameraKeyframe> & { time: number }): CameraKeyframe => ({
    id: `kf-${overrides.time}`,
    position: [0, 0, 5] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    ...overrides,
  })

  it('creates a scene for each adjacent keyframe pair without sceneId', () => {
    const kfs = [makeKf({ time: 0 }), makeKf({ time: 2 })]
    const scenes = buildTimelineScenes(kfs)
    expect(scenes).toHaveLength(1)
    expect(scenes[0].start.time).toBe(0)
    expect(scenes[0].end.time).toBe(2)
    expect(scenes[0].label).toContain('Animación')
  })

  it('groups consecutive keyframes sharing a sceneId', () => {
    const kfs = [
      makeKf({ time: 0, sceneId: 'scene-1', sceneLabel: 'Intro' }),
      makeKf({ time: 2, sceneId: 'scene-1' }),
      makeKf({ time: 4, sceneId: 'scene-1' }),
      makeKf({ time: 5, sceneId: 'scene-2', sceneLabel: 'Outro' }),
    ]
    const scenes = buildTimelineScenes(kfs)
    expect(scenes).toHaveLength(2)
    expect(scenes[0].label).toBe('Intro')
    expect(scenes[0].keyframes).toHaveLength(3)
    expect(scenes[1].label).toBe('Outro')
    expect(scenes[1].keyframes).toHaveLength(1)
  })

  it('handles singleton keyframe (last with no pair)', () => {
    const kfs = [makeKf({ time: 0, sceneLabel: 'Solo' })]
    const scenes = buildTimelineScenes(kfs)
    expect(scenes).toHaveLength(1)
    expect(scenes[0].start.time).toBe(0)
    expect(scenes[0].end.time).toBe(0)
  })

  it('handles mixed sceneId groups and plain keyframes', () => {
    const kfs = [
      makeKf({ time: 0 }),
      makeKf({ time: 1 }),
      makeKf({ time: 2, sceneId: 'a', sceneLabel: 'Group A' }),
      makeKf({ time: 3, sceneId: 'a' }),
      makeKf({ time: 4 }),
      makeKf({ time: 5 }),
    ]
    const scenes = buildTimelineScenes(kfs)
    expect(scenes).toHaveLength(3)
    expect(scenes[0].label).toContain('Animación')
    expect(scenes[1].label).toBe('Group A')
    expect(scenes[1].keyframes).toHaveLength(2)
    expect(scenes[2].label).toContain('Animación')
  })

  it('returns empty array for no keyframes', () => {
    expect(buildTimelineScenes([])).toEqual([])
  })
})

describe('buildPresetKeyframes', () => {
  const cam = { position: [0, 0, 5] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
  const getCam = () => cam

  it('returns empty array when getCam returns null', () => {
    expect(buildPresetKeyframes('zoom-in', () => null, 5)).toEqual([])
  })

  it('returns empty array for unknown preset', () => {
    expect(buildPresetKeyframes('unknown', getCam, 5)).toEqual([])
  })

  it('builds zoom-in preset keyframes', () => {
    const kfs = buildPresetKeyframes('zoom-in', getCam, 5)
    expect(kfs).toHaveLength(2)
    expect(kfs[0].time).toBe(0)
    expect(kfs[1].time).toBe(5)
    expect(kfs[0].easing).toBe('ease-out')
    expect(kfs[1].easing).toBe('ease-out')
  })

  it('builds zoom-out preset keyframes', () => {
    const kfs = buildPresetKeyframes('zoom-out', getCam, 5)
    expect(kfs).toHaveLength(2)
    expect(kfs[0].easing).toBe('ease-in')
  })

  it('builds orbit preset with correct number of steps', () => {
    const kfs = buildPresetKeyframes('orbit', getCam, 5)
    expect(kfs).toHaveLength(6) // steps + 1
    expect(kfs[0].time).toBe(0)
    expect(kfs[5].time).toBe(5)
    expect(kfs.every(k => k.easing === 'linear')).toBe(true)
  })

  it('builds reveal-below preset keyframes', () => {
    const kfs = buildPresetKeyframes('reveal-below', getCam, 5)
    expect(kfs).toHaveLength(3)
    expect(kfs[0].time).toBe(0)
    expect(kfs[2].time).toBe(5)
  })
})

describe('buildTemplateKeyframes', () => {
  const cam = { position: [0, 0, 5] as [number, number, number], target: [0, 0, 0] as [number, number, number] }
  const getCam = () => cam

  it('returns empty keyframes when getCam returns null', () => {
    const result = buildTemplateKeyframes('product-showcase', () => null)
    expect(result.keyframes).toEqual([])
    expect(result.duration).toBe(5)
  })

  it('returns empty keyframes for unknown template', () => {
    const result = buildTemplateKeyframes('unknown', getCam)
    expect(result.keyframes).toEqual([])
    expect(result.duration).toBe(5)
  })

  it('builds product-showcase template keyframes', () => {
    const result = buildTemplateKeyframes('product-showcase', getCam)
    expect(result.duration).toBe(8)
    expect(result.keyframes).toHaveLength(5)
    expect(result.keyframes[0].time).toBe(0)
    expect(result.keyframes[result.keyframes.length - 1].time).toBe(result.duration)
  })

  it('builds social-spin template with correct step count', () => {
    const result = buildTemplateKeyframes('social-spin', getCam)
    expect(result.keyframes).toHaveLength(9) // steps(8) + 1
    expect(result.keyframes[0].easing).toBe('linear')
  })
})

describe('EASING_OPTIONS', () => {
  it('has required fields for every option', () => {
    for (const opt of EASING_OPTIONS) {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
      expect(opt.desc).toBeTruthy()
    }
  })

  it('includes all expected easing types', () => {
    const values = EASING_OPTIONS.map(o => o.value)
    expect(values).toContain('linear')
    expect(values).toContain('smooth')
    expect(values).toContain('ease-in')
    expect(values).toContain('ease-out')
    expect(values).toContain('elastic')
    expect(values).toContain('bounce')
    expect(values).toContain('bezier')
  })
})

describe('ANIMATION_PRESETS', () => {
  it('every preset has required fields', () => {
    for (const p of ANIMATION_PRESETS) {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
      expect(p.desc).toBeTruthy()
    }
  })

  it('no duplicate preset ids', () => {
    const ids = ANIMATION_PRESETS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('ANIMATION_TEMPLATES', () => {
  it('every template has required fields', () => {
    for (const t of ANIMATION_TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(t.desc).toBeTruthy()
      expect(typeof t.duration).toBe('number')
      expect(t.duration).toBeGreaterThan(0)
    }
  })

  it('no duplicate template ids', () => {
    const ids = ANIMATION_TEMPLATES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
