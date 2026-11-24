/**
 * Step-mode wizard for the pin form (Issue #3).
 *
 * In `step` display mode, only one question is shown at a time with Back/Next
 * navigation. The last step reveals the submit button. Required questions block
 * advancing. On each step change the form scrolls back to the top so the next
 * question appears without manual scrolling (the core ask of the issue).
 *
 * In `scroll` mode the wizard is inert: all questions stay visible and the
 * submit button is always shown.
 */
import { t } from '../i18n'
import { readAnswer, validateAnswer, showFormError, clearFormError } from './pinForm'

export function createPinFormWizard({ form, formContent, submitButton, formNav, backButton, nextButton }) {
  let active = false
  let stepIndex = 0
  let getContext = () => ({ questions: [], questionElements: new Map() })

  const groups = () => Array.from(formContent.querySelectorAll('.ui-form-group'))

  const showSubmit = (visible) => {
    submitButton.classList.toggle('is-hidden', !visible)
    submitButton.disabled = !visible
  }

  /** Restores the plain scrolling form (all questions visible, no nav). */
  const deactivate = () => {
    active = false
    stepIndex = 0
    formNav.classList.add('is-hidden')
    groups().forEach((group) => group.classList.remove('is-hidden'))
    showSubmit(true)
  }

  const renderStep = () => {
    const all = groups()
    if (!all.length) {
      deactivate()
      return
    }
    stepIndex = Math.max(0, Math.min(stepIndex, all.length - 1))
    all.forEach((group, index) => {
      group.classList.toggle('is-hidden', index !== stepIndex)
    })
    const isLast = stepIndex === all.length - 1
    const isFirst = stepIndex === 0
    backButton.disabled = isFirst
    backButton.classList.toggle('is-hidden', isFirst)
    nextButton.classList.toggle('is-hidden', isLast)
    showSubmit(isLast)

    // Bring the active question into view without manual scrolling.
    formContent.scrollTop = 0
    const activeGroup = all[stepIndex]
    if (activeGroup) {
      const focusable = activeGroup.querySelector('input, textarea, select')
      if (focusable && typeof focusable.focus === 'function') {
        focusable.focus({ preventScroll: true })
      }
    }
  }

  const currentQuestion = () => {
    const all = groups()
    const group = all[stepIndex]
    if (!group) return null
    const key = group.dataset.questionKey
    const { questions, questionElements } = getContext()
    const question = questions.find((q) => q.key === key) || null
    const elements = questionElements.get(key) || null
    return question ? { question, elements } : null
  }

  /** Validates the current step; returns true when it is safe to advance. */
  const validateCurrent = () => {
    const ctx = currentQuestion()
    if (!ctx) return true
    const value = readAnswer(ctx.question, ctx.elements)
    const errorKey = validateAnswer(ctx.question, ctx.elements, value)
    if (errorKey) {
      showFormError(form, t(errorKey))
      return false
    }
    clearFormError(form)
    return true
  }

  const goNext = () => {
    if (!active) return
    if (!validateCurrent()) return
    stepIndex += 1
    renderStep()
  }

  const goBack = () => {
    if (!active) return
    clearFormError(form)
    stepIndex -= 1
    renderStep()
  }

  backButton.addEventListener('click', goBack)
  nextButton.addEventListener('click', goNext)

  return {
    /**
     * Begins wizard mode for the current form contents.
     * @param {object} context - { displayMode, getContext: () => ({ questions, questionElements }) }
     */
    begin({ displayMode, context }) {
      getContext = context || getContext
      if (displayMode !== 'step' || groups().length <= 1) {
        deactivate()
        return
      }
      active = true
      stepIndex = 0
      formNav.classList.remove('is-hidden')
      renderStep()
    },
    /** Returns the form to plain scroll mode (used for view mode / close). */
    reset() {
      deactivate()
    },
    isActive() {
      return active
    },
  }
}
