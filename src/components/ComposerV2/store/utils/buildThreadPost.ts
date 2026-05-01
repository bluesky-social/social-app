import {type ThreadPost} from '#/components/ComposerV2/store/types'
import {computePostMediaSelectionsRemaining} from '#/components/ComposerV2/store/utils/computePostMediaSelectionsRemaining'

export function buildThreadPost(): ThreadPost {
  return {
    text: '',
    langs: [],
    labels: [],
    media: [],
    embed: undefined,
    quote: undefined,
    ...computePostMediaSelectionsRemaining([], undefined),
  }
}
