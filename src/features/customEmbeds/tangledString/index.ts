import {type CustomEmbedHandler} from '#/features/customEmbeds/types'
import {isTangledStringUrl} from './detect'
import {TangledStringEmbed} from './TangledStringEmbed'

export const tangledStringHandler: CustomEmbedHandler = {
  id: 'tangledString',
  match: view => isTangledStringUrl(view.uri),
  Component: TangledStringEmbed,
}
