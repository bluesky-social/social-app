import {type UseSiftReturn} from '@bsky.app/sift'

/**
 * A handle suggestion from `com.atproto.temp.checkHandleAvailability`. The
 * unspecced temp lexicon isn't generated into `#/lexicons`, so we describe the
 * shape locally (mirrors `#/state/queries/handle-availability`).
 */
export type HandleSuggestion = {
  $type?: 'com.atproto.temp.checkHandleAvailability#suggestion'
  handle: string
  /**
   * Method used to build this suggestion. Should be considered opaque to
   * clients. Can be used for metrics.
   */
  method: string
}

export type HandleSuggestionsProps = {
  suggestions: HandleSuggestion[]
  onSelect: (suggestion: HandleSuggestion) => void
  /**
   * Web only: the Sift instance shared with the handle input. It carries the
   * anchor/positioning refs and keyboard bindings for the floating dropdown.
   * Ignored on native, which renders the suggestions inline.
   */
  sift: UseSiftReturn
}
