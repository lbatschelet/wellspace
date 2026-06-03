// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { isAnswerEmpty, safeParseReasons, renderQuestions, collectFormData } from './pinForm'

function makeForm() {
  const form = document.createElement('form')
  const content = document.createElement('div')
  content.className = 'ui-form-content'
  const error = document.createElement('div')
  error.className = 'ui-form-error'
  form.appendChild(content)
  form.appendChild(error)
  form.dataset.floorIndex = '0'
  form.dataset.x = '1'
  form.dataset.y = '2'
  form.dataset.z = '3'
  return { form, content }
}

const multiQuestion = (config) => ({
  key: 'topics',
  type: 'multi',
  required: false,
  sort: 1,
  config,
  options: [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
    { key: 'other', label: 'Other' },
  ],
})

describe('isAnswerEmpty', () => {
  it('returns true for empty array', () => {
    expect(isAnswerEmpty([])).toBe(true)
  })

  it('returns false for non-empty array', () => {
    expect(isAnswerEmpty(['a'])).toBe(false)
  })

  it('returns true for null/undefined', () => {
    expect(isAnswerEmpty(null)).toBe(true)
    expect(isAnswerEmpty(undefined)).toBe(true)
  })

  it('returns true for empty/whitespace string', () => {
    expect(isAnswerEmpty('')).toBe(true)
    expect(isAnswerEmpty('   ')).toBe(true)
  })

  it('returns false for non-empty string', () => {
    expect(isAnswerEmpty('hello')).toBe(false)
  })

  it('returns false for number', () => {
    expect(isAnswerEmpty(0)).toBe(false)
    expect(isAnswerEmpty(42)).toBe(false)
  })

  it('treats empty extended-multi selection as empty', () => {
    expect(isAnswerEmpty({ selected: [] })).toBe(true)
    expect(isAnswerEmpty({ selected: ['a'] })).toBe(false)
  })
})

describe('multi with allow_other', () => {
  it('renders a disabled free-text input enabled only when "other" is selected', () => {
    const { content } = makeForm()
    const elements = new Map()
    renderQuestions([multiQuestion({ allow_multiple: true, allow_other: true })], content, elements)

    const otherText = content.querySelector('.ui-multi-other-text')
    expect(otherText).not.toBeNull()
    expect(otherText.disabled).toBe(true)

    const otherCheckbox = content.querySelector('input[value="other"]')
    otherCheckbox.checked = true
    otherCheckbox.dispatchEvent(new Event('change'))
    expect(otherText.disabled).toBe(false)
  })

  it('does not render a free-text input without allow_other', () => {
    const { content } = makeForm()
    const elements = new Map()
    renderQuestions([multiQuestion({ allow_multiple: true })], content, elements)
    expect(content.querySelector('.ui-multi-other-text')).toBeNull()
  })

  it('collects { selected, other_text } when other has text', () => {
    const { form, content } = makeForm()
    const elements = new Map()
    const question = multiQuestion({ allow_multiple: true, allow_other: true })
    renderQuestions([question], content, elements)

    content.querySelector('input[value="a"]').checked = true
    const other = content.querySelector('input[value="other"]')
    other.checked = true
    other.dispatchEvent(new Event('change'))
    content.querySelector('.ui-multi-other-text').value = 'My text'

    const payload = collectFormData(form, [question], elements)
    expect(payload.generic_answers.topics).toEqual({ selected: ['a', 'other'], other_text: 'My text' })
  })

  it('blocks submit when other is selected without text', () => {
    const { form, content } = makeForm()
    const elements = new Map()
    const question = multiQuestion({ allow_multiple: true, allow_other: true })
    renderQuestions([question], content, elements)

    const other = content.querySelector('input[value="other"]')
    other.checked = true
    other.dispatchEvent(new Event('change'))

    const payload = collectFormData(form, [question], elements)
    expect(payload).toBeNull()
  })

  it('multi without allow_other still collects a plain array', () => {
    const { form, content } = makeForm()
    const elements = new Map()
    const question = multiQuestion({ allow_multiple: true })
    renderQuestions([question], content, elements)

    content.querySelector('input[value="a"]').checked = true
    content.querySelector('input[value="b"]').checked = true

    const payload = collectFormData(form, [question], elements)
    expect(payload.generic_answers.topics).toEqual(['a', 'b'])
  })
})

describe('safeParseReasons', () => {
  it('returns empty array for falsy input', () => {
    expect(safeParseReasons(null)).toEqual([])
    expect(safeParseReasons(undefined)).toEqual([])
    expect(safeParseReasons('')).toEqual([])
  })

  it('returns array as-is', () => {
    expect(safeParseReasons(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('parses JSON string', () => {
    expect(safeParseReasons('["x","y"]')).toEqual(['x', 'y'])
  })

  it('returns empty array for invalid JSON', () => {
    expect(safeParseReasons('not json')).toEqual([])
  })
})
