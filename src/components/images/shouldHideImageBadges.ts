import {PostEmbedViewContext} from '#/components/Post/Embed/types'

export function shouldHideImageBadges(viewContext?: PostEmbedViewContext) {
  return viewContext === PostEmbedViewContext.FeedEmbedRecordWithMedia
}
