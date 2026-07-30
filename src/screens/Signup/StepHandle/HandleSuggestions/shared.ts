import {type ComAtprotoTempCheckHandleAvailability} from '@atproto/api'
import {type UseSiftReturn} from '@bsky.app/sift'

export type HandleSuggestionsProps = {
  suggestions: ComAtprotoTempCheckHandleAvailability.Suggestion[]
  onSelect: (
    suggestion: ComAtprotoTempCheckHandleAvailability.Suggestion,
  ) => void
  /**
   * Web only: the Sift instance shared with the handle input. It carries the
   * anchor/positioning refs and keyboard bindings for the floating dropdown.
   * Ignored on native, which renders the suggestions inline.
   */
  sift: UseSiftReturn
}
