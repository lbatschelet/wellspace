// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { getTapMovePx, pickSceneCandidateFromHits } from './pinRaycaster'

describe('getTapMovePx', () => {
  it('uses a larger threshold for touch and pen', () => {
    expect(getTapMovePx('touch')).toBe(32)
    expect(getTapMovePx('pen')).toBe(32)
  })

  it('uses the default threshold for mouse on fine pointers', () => {
    expect(getTapMovePx('mouse')).toBe(18)
  })
})

describe('pickSceneCandidateFromHits', () => {
  it('returns empty when nothing was hit', () => {
    expect(pickSceneCandidateFromHits([])).toEqual({ kind: 'empty' })
  })

  it('prefers pin data on the hit object', () => {
    const pin = { id: 7 }
    const hits = [{ object: { userData: { pinData: pin } } }]
    expect(pickSceneCandidateFromHits(hits)).toEqual({ kind: 'pin', pin })
  })

  it('walks up the parent chain to find cluster keys', () => {
    const hits = [{
      object: {
        parent: { userData: { clusterKey: 'c-1' } },
      },
    }]
    expect(pickSceneCandidateFromHits(hits)).toEqual({
      kind: 'cluster',
      clusterKey: 'c-1',
    })
  })
})
