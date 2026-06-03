// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { renderQuestions } from './pinForm'
import { createPinFormWizard } from './pinFormWizard'

function setup(questions, displayMode) {
  const form = document.createElement('form')
  const formContent = document.createElement('div')
  formContent.className = 'ui-form-content'
  const error = document.createElement('div')
  error.className = 'ui-form-error'
  const formNav = document.createElement('div')
  formNav.className = 'ui-form-nav is-hidden'
  const backButton = document.createElement('button')
  const nextButton = document.createElement('button')
  const submitButton = document.createElement('button')
  formNav.append(backButton, nextButton)
  form.append(formContent, error, formNav, submitButton)
  form.dataset.floorIndex = '0'
  form.dataset.x = '1'
  form.dataset.y = '2'
  form.dataset.z = '3'

  const questionElements = new Map()
  renderQuestions(questions, formContent, questionElements, { displayMode })

  const wizard = createPinFormWizard({ form, formContent, submitButton, formNav, backButton, nextButton })
  wizard.begin({
    displayMode,
    context: () => ({ questions, questionElements }),
  })
  return { form, formContent, backButton, nextButton, submitButton, formNav, wizard, questionElements }
}

const Q = [
  { key: 'wellbeing', type: 'slider', required: true, sort: 1, config: { min: 0, max: 1, step: 0.01, default: 0.5 } },
  { key: 'note1', type: 'text', required: true, sort: 2, config: { rows: 3 } },
  { key: 'note2', type: 'text', required: false, sort: 3, config: { rows: 3 } },
]

const visibleGroups = (formContent) =>
  Array.from(formContent.querySelectorAll('.ui-form-group')).filter((g) => !g.classList.contains('is-hidden'))

describe('pinFormWizard - step mode', () => {
  it('shows only one question at a time', () => {
    const { formContent } = setup(Q, 'step')
    expect(visibleGroups(formContent)).toHaveLength(1)
    expect(visibleGroups(formContent)[0].dataset.questionKey).toBe('wellbeing')
  })

  it('reveals nav and hides submit until the last step', () => {
    const { formNav, submitButton, nextButton } = setup(Q, 'step')
    expect(formNav.classList.contains('is-hidden')).toBe(false)
    expect(submitButton.classList.contains('is-hidden')).toBe(true)
    expect(nextButton.classList.contains('is-hidden')).toBe(false)
  })

  it('advances to the next question and resets scroll', () => {
    const { formContent, nextButton } = setup(Q, 'step')
    formContent.scrollTop = 200
    nextButton.click()
    expect(visibleGroups(formContent)[0].dataset.questionKey).toBe('note1')
    expect(formContent.scrollTop).toBe(0)
  })

  it('blocks Next when a required question is empty', () => {
    const { formContent, nextButton, form } = setup(Q, 'step')
    // Step 1 (wellbeing slider) has a default value → advance to required text step.
    nextButton.click()
    expect(visibleGroups(formContent)[0].dataset.questionKey).toBe('note1')
    // note1 is required and empty → Next blocked.
    nextButton.click()
    expect(visibleGroups(formContent)[0].dataset.questionKey).toBe('note1')
    expect(form.querySelector('.ui-form-error').textContent).not.toBe('')
  })

  it('shows submit on the last step', () => {
    const { formContent, nextButton, submitButton, questionElements } = setup(Q, 'step')
    nextButton.click() // → note1
    questionElements.get('note1').input.value = 'filled'
    nextButton.click() // → note2 (last)
    expect(visibleGroups(formContent)[0].dataset.questionKey).toBe('note2')
    expect(submitButton.classList.contains('is-hidden')).toBe(false)
    expect(nextButton.classList.contains('is-hidden')).toBe(true)
  })

  it('Back returns to the previous question', () => {
    const { formContent, nextButton, backButton } = setup(Q, 'step')
    nextButton.click()
    backButton.click()
    expect(visibleGroups(formContent)[0].dataset.questionKey).toBe('wellbeing')
  })
})

describe('pinFormWizard - scroll mode', () => {
  it('keeps all questions visible and submit shown', () => {
    const { formContent, formNav, submitButton, wizard } = setup(Q, 'scroll')
    expect(visibleGroups(formContent)).toHaveLength(3)
    expect(formNav.classList.contains('is-hidden')).toBe(true)
    expect(submitButton.classList.contains('is-hidden')).toBe(false)
    expect(wizard.isActive()).toBe(false)
  })
})
