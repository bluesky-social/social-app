import {type CustomEmbedHandler} from '#/features/customEmbeds/types'
import {AtmoRsvpEmbed} from './AtmoRsvpEmbed'
import {isAtmoRsvpEventUrl} from './detect'

export const atmoRsvpHandler: CustomEmbedHandler = {
  id: 'atmoRsvp',
  match: view => isAtmoRsvpEventUrl(view.uri),
  Component: AtmoRsvpEmbed,
}
