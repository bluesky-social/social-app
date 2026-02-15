/**
 * Per-post translation state store. Uses the EventEmitter + Map pattern
 * (same as post-shadow.ts) so only components subscribed to a specific
 * post URI re-render when its translation state changes.
 */
import {useEffect, useState} from 'react'
import EventEmitter from 'eventemitter3'

export type TranslationState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'success'; translatedText: string; sourceLanguage: string}

const IDLE: TranslationState = {status: 'idle'}

const emitter = new EventEmitter()
const translations = new Map<string, TranslationState>()

export function setTranslationState(postUri: string, state: TranslationState) {
  translations.set(postUri, state)
  emitter.emit(postUri)
}

export function clearTranslation(postUri: string) {
  translations.delete(postUri)
  emitter.emit(postUri)
}

export function useTranslationState(postUri: string): TranslationState {
  const [state, setState] = useState<TranslationState>(
    () => translations.get(postUri) ?? IDLE,
  )

  useEffect(() => {
    function onUpdate() {
      setState(translations.get(postUri) ?? IDLE)
    }
    emitter.addListener(postUri, onUpdate)
    return () => {
      emitter.removeListener(postUri, onUpdate)
    }
  }, [postUri])

  return state
}
