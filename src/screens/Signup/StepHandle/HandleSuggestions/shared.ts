import {type UseSiftReturn} from '@bsky.app/sift'

import {type com} from '#/lexicons'

export type HandleSuggestionsProps = {
  suggestions: com.atproto.temp.checkHandleAvailability.Suggestion[]
  onSelect: (
    suggestion: com.atproto.temp.checkHandleAvailability.Suggestion,
  ) => void
  /**
   * Web only: the Sift instance shared with the handle input. It carries the
   * anchor/positioning refs and keyboard bindings for the floating dropdown.
   * Ignored on native, which renders the suggestions inline.
   */
  sift: UseSiftReturn
}
