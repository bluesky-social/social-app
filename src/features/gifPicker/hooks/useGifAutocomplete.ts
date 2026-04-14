import {useRef, useState} from 'react'

import {useKlipyAutocompleteQuery} from '#/state/queries/klipy'
import {useThrottledValue} from '#/components/hooks/useThrottledValue'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'

export type GifAutocompleteState = {
  /** The suggestion strings to display */
  suggestions: string[]
  /** Whether the suggestion list should be visible */
  isVisible: boolean
  /** Index of the keyboard-highlighted suggestion (web only), -1 = none */
  activeIndex: number
  /** Call when the user selects a suggestion */
  selectSuggestion: (suggestion: string) => void
  /** Call when the raw search text changes (from the input's onChangeText) */
  handleTextChange: (text: string) => void
  /** Call with the key event from the search input (web only) */
  handleKeyDown: (key: string) => boolean
  /** Call to dismiss suggestions (e.g. escape key) */
  dismiss: () => void
}

export function useGifAutocomplete({
  onSelectSuggestion,
}: {
  onSelectSuggestion: (text: string) => void
}): GifAutocompleteState {
  const ax = useAnalytics()
  const useKlipy = ax.features.enabled(ax.features.KlipyGifProviderEnable)

  const [rawText, setRawText] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const justSelectedRef = useRef(false)

  const autocompleteQuery = useThrottledValue(rawText, 200)
  const {data: suggestions} = useKlipyAutocompleteQuery(autocompleteQuery, {
    enabled: useKlipy && !justSelectedRef.current,
  })

  const [activeIndex, setActiveIndex] = useState(-1)

  const isVisible =
    rawText.length > 0 &&
    !dismissed &&
    !justSelectedRef.current &&
    (suggestions?.length ?? 0) > 0

  const handleTextChange = (text: string) => {
    setRawText(text)
    if (justSelectedRef.current) {
      justSelectedRef.current = false
    }
    setDismissed(false)
    setActiveIndex(-1)
  }

  const selectSuggestion = (suggestion: string) => {
    justSelectedRef.current = true
    setRawText(suggestion)
    setActiveIndex(-1)
    onSelectSuggestion(suggestion)
  }

  const dismiss = () => {
    setDismissed(true)
    setActiveIndex(-1)
  }

  const handleKeyDown = (key: string): boolean => {
    if (!IS_WEB || !isVisible || !suggestions?.length) return false

    switch (key) {
      case 'ArrowDown': {
        setActiveIndex(i => (i + 1) % suggestions.length)
        return true
      }
      case 'ArrowUp': {
        setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1))
        return true
      }
      case 'Enter': {
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectSuggestion(suggestions[activeIndex])
          return true
        }
        return false
      }
      case 'Escape': {
        dismiss()
        return true
      }
      default:
        return false
    }
  }

  return {
    suggestions: suggestions ?? [],
    isVisible,
    activeIndex,
    selectSuggestion,
    handleTextChange,
    handleKeyDown,
    dismiss,
  }
}
