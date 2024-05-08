import {AppBskyFeedDefs} from '@atproto/api'

export const CONTENT_LABELS = ['porn', 'sexual', 'nudity', 'graphic-media']

export function labelsToInfo(
  labels?: AppBskyFeedDefs.PostView['labels'],
): string | undefined {
  const label = labels?.find(label => CONTENT_LABELS.includes(label.val))

  switch (label?.val) {
    case 'porn':
    case 'sexual':
      return 'Adult Content'
    case 'nudity':
      return 'Non-sexual Nudity'
    case 'graphic-media':
      return 'Graphic Media'
    default:
      return undefined
  }
}
