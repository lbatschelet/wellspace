/**
 * Questionnaire actions for saving, adding, and translation handling.
 * Exports: createQuestionnaireActions, buildQuestionConfig, buildNewQuestion.
 */
import { validateQuestionTranslations } from '../services/questionnaireService'


export function buildQuestionConfig({ type, values }) {
  const config = {}
  if (type === 'slider') {
    config.min = Number(values.min ?? 0)
    config.max = Number(values.max ?? 1)
    config.step = Number(values.step ?? 0.01)
    config.default = Number(values.default ?? 0.5)
    config.use_for_color = Boolean(values.use_for_color)
  }
  if (type === 'text') {
    config.rows = Number(values.rows ?? 3)
  }
  if (type === 'multi') {
    config.allow_multiple = !values.single_choice
    config.allow_other = Boolean(values.allow_other)
    if (config.allow_other) {
      config.other_option_key = 'other'
      config.other_max_length = Number(values.other_max_length) || 500
    }
  }
  if (type === 'influence') {
    config.min = Number(values.min ?? -1)
    config.max = Number(values.max ?? 1)
    config.step = Number(values.step ?? 0.05)
    config.default = Number(values.default ?? 0)
  }
  return config
}

export function buildNewQuestion({ key, type, required, isActive, config, existingQuestions }) {
  const base = {
    question_key: key,
    type,
    required,
    sort: 0,
    is_active: isActive,
    config,
  }
  const maxSort = Math.max(0, ...existingQuestions.map((question) => Number(question.sort || 0)))
  base.sort = maxSort + 1
  return base
}

export function createQuestionnaireActions({ state, views, api, shell, data, render, renderDashboard }) {
  const { newQuestionTranslations } = views.questionnaireView

  const saveOptionOrder = async (questionKey, optionKeys) => {
    const updates = optionKeys.map((option_key, index) => {
      const option = state.options.find(
        (item) => item.question_key === questionKey && item.option_key === option_key
      )
      return {
        question_key: questionKey,
        option_key,
        sort: index + 1,
        is_active: option ? Boolean(option.is_active) : true,
        translation_key: option?.translation_key || `options.${questionKey}.${option_key}`,
      }
    })
    for (const entry of updates) {
      await api.upsertOption({ token: state.token, ...entry })
    }
    state.options = state.options.map((option) => {
      if (option.question_key !== questionKey) return option
      const index = optionKeys.indexOf(option.option_key)
      if (index === -1) return option
      return { ...option, sort: index + 1 }
    })
    shell.setStatus('Options reordered', false)
  }

  /**
   * Saves a single question + translations to the backend.
   */
  const saveSingleQuestion = async (question, translationsByLang) => {
    await api.upsertQuestion({ token: state.token, question })
    for (const [lang, translations] of Object.entries(translationsByLang)) {
      await api.upsertTranslation({
        token: state.token,
        translation_key: `questions.${question.question_key}.label`,
        lang,
        text: translations.label,
      })
      if (question.type === 'slider') {
        await api.upsertTranslation({
          token: state.token,
          translation_key: `questions.${question.question_key}.legend_low`,
          lang,
          text: translations.legend_low || '',
        })
        await api.upsertTranslation({
          token: state.token,
          translation_key: `questions.${question.question_key}.legend_high`,
          lang,
          text: translations.legend_high || '',
        })
      }
      if (question.type === 'influence') {
        await api.upsertTranslation({
          token: state.token,
          translation_key: `questions.${question.question_key}.legend_negative`,
          lang,
          text: translations.legend_negative || '',
        })
        await api.upsertTranslation({
          token: state.token,
          translation_key: `questions.${question.question_key}.legend_positive`,
          lang,
          text: translations.legend_positive || '',
        })
      }
      if (question.type === 'multi' && question.config?.allow_other) {
        await api.upsertTranslation({
          token: state.token,
          translation_key: `questions.${question.question_key}.other_placeholder`,
          lang,
          text: translations.other_placeholder || '',
        })
      }
    }
  }

  /**
   * Ensures a multi question with allow_other has a real "other" option row
   * (so the viewer renders it and its label is translatable). Creates a default
   * DE/EN label when the option is newly added.
   */
  const ensureOtherOption = async (questionKey, otherKey = 'other') => {
    const exists = state.options.some(
      (item) => item.question_key === questionKey && item.option_key === otherKey
    )
    if (exists) return
    const maxSort = Math.max(
      0,
      ...state.options
        .filter((item) => item.question_key === questionKey)
        .map((item) => Number(item.sort || 0))
    )
    const translationKey = `options.${questionKey}.${otherKey}`
    await api.upsertOption({
      token: state.token,
      question_key: questionKey,
      option_key: otherKey,
      sort: maxSort + 1,
      is_active: true,
      translation_key: translationKey,
    })
    const defaults = { de: 'Sonstiges', en: 'Other' }
    for (const language of state.languages) {
      const text = defaults[language.lang]
      if (!text) continue
      await api.upsertTranslation({
        token: state.token,
        translation_key: translationKey,
        lang: language.lang,
        text,
      })
    }
    await ensureOtherPlaceholder(questionKey, defaults)
    await data.loadOptions()
    await data.loadTranslations()
  }

  /**
   * Seeds per-language placeholder text for the inline "other" text field
   * (questions.{key}.other_placeholder). Skips langs that already have a value.
   */
  const ensureOtherPlaceholder = async (questionKey, defaults = { de: 'Sonstiges', en: 'Other' }) => {
    const placeholderKey = `questions.${questionKey}.other_placeholder`
    for (const language of state.languages) {
      const existing =
        state.translationsByLang[language.lang]?.[placeholderKey] ||
        state.pendingTranslationsByLang[language.lang]?.[placeholderKey]
      if (existing) continue
      const text = defaults[language.lang]
      if (!text) continue
      await api.upsertTranslation({
        token: state.token,
        translation_key: placeholderKey,
        lang: language.lang,
        text,
      })
    }
  }

  /**
   * Deletes a question from the backend.
   */
  const deleteQuestion = async (questionKey) => {
    await api.deleteQuestion({ token: state.token, question_key: questionKey })
  }

  /**
   * Reload data from server and re-render.
   */
  const reloadAndRender = async () => {
    state.pendingTranslationsByLang = {}
    await data.loadQuestions()
    await data.loadTranslations()
    render.renderQuestionsList()
    renderDashboard()
  }

  const collectNewQuestionTranslations = (type) => {
    const activeLanguages = state.languages
    const translationsByLang = {}
    for (const language of activeLanguages) {
      const labelInput = newQuestionTranslations.querySelector(
        `input[data-lang="${language.lang}"][data-field="label"]`
      )
      const label = labelInput?.value.trim() || ''
      translationsByLang[language.lang] = { label }
      if (type === 'slider') {
        const legendLowInput = newQuestionTranslations.querySelector(
          `input[data-lang="${language.lang}"][data-field="legend_low"]`
        )
        const legendHighInput = newQuestionTranslations.querySelector(
          `input[data-lang="${language.lang}"][data-field="legend_high"]`
        )
        const legendLow = legendLowInput?.value.trim() || ''
        const legendHigh = legendHighInput?.value.trim() || ''
        translationsByLang[language.lang].legend_low = legendLow
        translationsByLang[language.lang].legend_high = legendHigh
      }
      if (type === 'influence') {
        const legendNeg = newQuestionTranslations.querySelector(
          `input[data-lang="${language.lang}"][data-field="legend_negative"]`
        )
        const legendPos = newQuestionTranslations.querySelector(
          `input[data-lang="${language.lang}"][data-field="legend_positive"]`
        )
        translationsByLang[language.lang].legend_negative = legendNeg?.value.trim() || ''
        translationsByLang[language.lang].legend_positive = legendPos?.value.trim() || ''
      }
      if (type === 'multi' && views.questionnaireView.newQuestionAllowOther?.checked) {
        const otherPlaceholderInput = newQuestionTranslations.querySelector(
          `input[data-lang="${language.lang}"][data-field="other_placeholder"]`
        )
        translationsByLang[language.lang].other_placeholder =
          otherPlaceholderInput?.value.trim() || ''
      }
    }
    const validation = validateQuestionTranslations({
      type,
      languages: activeLanguages,
      valuesByLang: translationsByLang,
    })
    if (!validation.ok) {
      shell.setStatus(validation.message, true)
      return null
    }
    return translationsByLang
  }

  /**
   * Persists all option label fields from the question modal (Key + one column per language).
   */
  const saveOptionTranslationsFromModal = async (questionModalOptions) => {
    if (!questionModalOptions) return
    const optionInputs = questionModalOptions.querySelectorAll('input[data-field="option-translation"]')
    for (const input of optionInputs) {
      const lang = input.dataset.lang
      const translationKey = input.dataset.translationKey
      if (!lang || !translationKey) continue
      await api.upsertTranslation({
        token: state.token,
        translation_key: translationKey,
        lang,
        text: input.value.trim(),
      })
    }
  }

  const resetNewQuestionForm = () => {
    const {
      newQuestionKey,
      newQuestionRequired,
      newQuestionActive,
      newQuestionMin,
      newQuestionMax,
      newQuestionStep,
      newQuestionDefault,
      newQuestionUseForColor,
      newQuestionSingleChoice,
      newQuestionAllowOther,
      newQuestionOtherMax,
      newQuestionRows,
      newQuestionType,
    } = views.questionnaireView
    newQuestionKey.value = ''
    newQuestionRequired.checked = false
    newQuestionActive.checked = true
    newQuestionMin.value = '0'
    newQuestionMax.value = '1'
    newQuestionStep.value = '0.01'
    newQuestionDefault.value = '0.5'
    newQuestionUseForColor.checked = false
    newQuestionSingleChoice.checked = true
    if (newQuestionAllowOther) newQuestionAllowOther.checked = false
    if (newQuestionOtherMax) newQuestionOtherMax.value = '500'
    newQuestionRows.value = '3'
    render.renderNewQuestionTranslations(newQuestionType.value)
  }

  return {
    saveOptionOrder,
    saveSingleQuestion,
    saveOptionTranslationsFromModal,
    ensureOtherOption,
    deleteQuestion,
    reloadAndRender,
    collectNewQuestionTranslations,
    resetNewQuestionForm,
  }
}
