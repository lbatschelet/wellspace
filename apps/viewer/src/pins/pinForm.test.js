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

const multiQuestion = (config, extra = {}) => ({
  key: 'topics',
  type: 'multi',
  required: false,
  sort: 1,
  config,
  other_placeholder: extra.other_placeholder,
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

  it('returns true for empty string', () => {
    expect(isAnswerEmpty('')).toBe(true)
    expect(isAnswerEmpty('   ')).toBe(true)
  })

  it('returns false for non-empty string', () => {
    expect(isAnswerEmpty('hello')).toBe(false)
  })

  it('returns true for empty object', () => {
    expect(isAnswerEmpty({})).toBe(true)
  })

  it('returns false for non-empty object', () => {
    expect(isAnswerEmpty({ a: 1 })).toBe(false)
  })

  it('treats empty extended-multi selection as empty', () => {
    expect(isAnswerEmpty({ selected: [] })).toBe(true)
    expect(isAnswerEmpty({ selected: ['a'] })).toBe(false)
  })
})

describe('multi with allow_other', () => {
  it('renders options in a vertical list without a separate "other" checkbox', () => {
    const { content } = makeForm()
    const elements = new Map()
    renderQuestions(
      [multiQuestion({ allow_multiple: true, allow_other: true }, { other_placeholder: 'Bitte angeben…' })],
      content,
      elements
    )

    expect(content.querySelector('.ui-form-reasons')).not.toBeNull()
    expect(content.querySelector('input[value="other"]')).toBeNull()
    const otherText = content.querySelector('.ui-multi-other-text')
    expect(otherText).not.toBeNull()
    expect(otherText.disabled).toBe(false)
    expect(otherText.placeholder).toBe('Bitte angeben…')
  })

  it('does not render a free-text input without allow_other', () => {
    const { content } = makeForm()
    const elements = new Map()
    renderQuestions([multiQuestion({ allow_multiple: true })], content, elements)
    expect(content.querySelector('.ui-multi-other-text')).toBeNull()
  })

  it('selects "other" on focus and collects text on submit', () => {
    const { form, content } = makeForm()
    const elements = new Map()
    const question = multiQuestion({ allow_multiple: true, allow_other: true })
    renderQuestions([question], content, elements)

    const otherText = content.querySelector('.ui-multi-other-text')
    otherText.focus()
    otherText.value = 'My text'

    const payload = collectFormData(form, [question], elements)
    expect(payload.generic_answers.topics).toEqual({
      selected: ['other'],
      other_text: 'My text',
    })
  })

  it('activates "other" on input without prior checkbox click', () => {
    const { form, content } = makeForm()
    const elements = new Map()
    const question = multiQuestion({ allow_multiple: false, allow_other: true })
    renderQuestions([question], content, elements)

    content.querySelector('input[value="a"]').checked = true
    const otherText = content.querySelector('.ui-multi-other-text')
    otherText.value = 'Freitext'
    otherText.dispatchEvent(new Event('input'))

    const payload = collectFormData(form, [question], elements)
    expect(payload.generic_answers.topics).toEqual({
      selected: ['other'],
      other_text: 'Freitext',
    })
    expect(content.querySelector('input[value="a"]').checked).toBe(false)
  })

  it('blocks submit when other is active without text', () => {
    const { form, content } = makeForm()
    const elements = new Map()
    const question = multiQuestion({ allow_multiple: true, allow_other: true })
    renderQuestions([question], content, elements)

    const otherText = content.querySelector('.ui-multi-other-text')
    otherText.dispatchEvent(new Event('focus'))

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

  it('parses JSON array string', () => {
    expect(safeParseReasons('["a","b"]')).toEqual(['a', 'b'])
  })

  it('returns array as-is', () => {
    expect(safeParseReasons(['x'])).toEqual(['x'])
  })

  it('returns empty array for invalid JSON', () => {
    expect(safeParseReasons('not json')).toEqual([])
  })
})
