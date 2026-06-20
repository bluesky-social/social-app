import {PostEmbedViewContext} from '#/components/Post/Embed/types'
import {shouldHideImageBadges} from './shouldHideImageBadges'

describe('shouldHideImageBadges', () => {
  it('only hides badges in the compact feed record media context', () => {
    expect(
      shouldHideImageBadges(PostEmbedViewContext.FeedEmbedRecordWithMedia),
    ).toBe(true)

    expect(shouldHideImageBadges()).toBe(false)
    expect(shouldHideImageBadges(PostEmbedViewContext.Feed)).toBe(false)
    expect(shouldHideImageBadges(PostEmbedViewContext.ThreadHighlighted)).toBe(
      false,
    )
    expect(shouldHideImageBadges(PostEmbedViewContext.ChatMessage)).toBe(false)
  })
})
