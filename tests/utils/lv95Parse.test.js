import { describe, it, expect } from 'vitest'
import { parseSwissNumber, parseSwissLv95Pair } from '../../src/utils/lv95Parse'

describe('lv95Parse', () => {
  it('parses map.geo.admin.ch style numbers', () => {
    expect(parseSwissNumber("2'598'784.10")).toBeCloseTo(2598784.1, 4)
    expect(parseSwissNumber("1'200'158.40")).toBeCloseTo(1200158.4, 4)
  })

  it('parses pasted E, N pair', () => {
    const p = parseSwissLv95Pair("2'598'784.10, 1'200'158.40")
    expect(p).not.toBeNull()
    expect(p.e).toBeCloseTo(2598784.1, 4)
    expect(p.n).toBeCloseTo(1200158.4, 4)
  })
})
