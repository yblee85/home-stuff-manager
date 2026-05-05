import { describe, expect, it } from 'vitest'
import { parseSpecsFromForm, parseTagsField } from './itemForm'

describe('parseTagsField', () => {
  it('returns empty array for empty or non-string input', () => {
    expect(parseTagsField('')).toEqual([])
    expect(parseTagsField('   ')).toEqual([])
    expect(parseTagsField(null)).toEqual([])
    expect(parseTagsField(1)).toEqual([])
  })

  it('splits, trims, and drops empty segments', () => {
    expect(parseTagsField('a, b , c')).toEqual(['a', 'b', 'c'])
    expect(parseTagsField('x,, y')).toEqual(['x', 'y'])
  })
})

describe('parseSpecsFromForm', () => {
  it('returns null when no dimension, weight, or info', () => {
    const fd = new FormData()
    expect(parseSpecsFromForm(fd)).toBeNull()
  })

  it('builds dimension when all fields and unit present', () => {
    const fd = new FormData()
    fd.set('dim_w', '1')
    fd.set('dim_l', '2')
    fd.set('dim_h', '3')
    fd.set('dim_unit', 'cm')
    expect(parseSpecsFromForm(fd)).toEqual({
      dimension: { w: 1, l: 2, h: 3, unit: 'cm' },
    })
  })

  it('includes weight and trimmed info when set', () => {
    const fd = new FormData()
    fd.set('weight_value', '0.5')
    fd.set('weight_unit', 'kg')
    fd.set('specs_info', '  M thread  ')
    expect(parseSpecsFromForm(fd)).toEqual({
      weight: { value: 0.5, unit: 'kg' },
      info: 'M thread',
    })
  })
})
