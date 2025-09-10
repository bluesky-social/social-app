import {useCallback, useEffect, useImperativeHandle, useState} from 'react'
import {findNodeHandle, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {useInitialNumToRender} from '#/lib/hooks/useInitialNumToRender'
import {isIOS, isNative} from '#/platform/detection'
import {
  type FeedDescriptor,
  RQKEY as FEED_RQKEY,
} from '#/state/queries/post-feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {PostFeed} from '#/view/com/posts/PostFeed'
import {
  EmptyState,
  type EmptyStateButtonProps,
} from '#/view/com/util/EmptyState'
import {type ListRef} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {atoms as a, ios, useTheme} from '#/alf'
import {EditBig_Stroke1_Corner0_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Text} from '#/components/Typography'
import {type SectionRef} from './types'

interface FeedSectionProps {
  ref?: React.Ref<SectionRef>
  feed: FeedDescriptor
  headerHeight: number
  isFocused: boolean
  scrollElRef: ListRef
  ignoreFilterFor?: string
  setScrollViewTag: (tag: number | null) => void
  emptyStateMessage?: string
  emptyStateButton?: EmptyStateButtonProps
  emptyStateIcon?: React.ReactElement
}
<<<<<<< HEAD
export function ProfileFeedSection({
=======
export const ProfileFeedSection = React.forwardRef<
  SectionRef,
  FeedSectionProps
>(function FeedSectionImpl(
  {
    feed,
    headerHeight,
    isFocused,
    scrollElRef,
    ignoreFilterFor,
    setScrollViewTag,
    emptyStateMessage,
    emptyStateButton,
    emptyStateIcon,
  },
>>>>>>> e0bade160 (update type error fixes)
  ref,
  feed,
  headerHeight,
  isFocused,
  scrollElRef,
  ignoreFilterFor,
  setScrollViewTag,
}: FeedSectionProps) {
  const {_} = useLingui()
  const queryClient = useQueryClient()
  const [hasNew, setHasNew] = useState(false)
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const shouldUseAdjustedNumToRender = feed.endsWith('posts_and_author_threads')
  const isVideoFeed = isNative && feed.endsWith('posts_with_video')
  const adjustedInitialNumToRender = useInitialNumToRender({
    screenHeightOffset: headerHeight,
  })
  const t = useTheme()

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: isNative,
      offset: -headerHeight,
    })
    truncateAndInvalidate(queryClient, FEED_RQKEY(feed))
    setHasNew(false)
  }, [scrollElRef, headerHeight, queryClient, feed, setHasNew])

  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  const renderPostsEmpty = React.useCallback(() => {
    return (
      <EmptyState
        icon={
          emptyStateIcon || (
            <EditIcon size="3xl" fill={t.atoms.text_contrast_low.color} />
          )
        }
        message={emptyStateMessage || _(msg`No posts yet.`)}
        button={emptyStateButton}
      />
    )
  }, [_, t, emptyStateMessage, emptyStateButton, emptyStateIcon])

  useEffect(() => {
    if (isIOS && isFocused && scrollElRef.current) {
      const nativeTag = findNodeHandle(scrollElRef.current)
      setScrollViewTag(nativeTag)
    }
  }, [isFocused, scrollElRef, setScrollViewTag])

  return (
    <View>
      <PostFeed
        testID="postsFeed"
        enabled={isFocused}
        feed={feed}
        scrollElRef={scrollElRef}
        onHasNew={setHasNew}
        onScrolledDownChange={setIsScrolledDown}
        renderEmptyState={renderPostsEmpty}
        headerOffset={headerHeight}
        progressViewOffset={ios(0)}
        renderEndOfFeed={isVideoFeed ? undefined : ProfileEndOfFeed}
        ignoreFilterFor={ignoreFilterFor}
        initialNumToRender={
          shouldUseAdjustedNumToRender ? adjustedInitialNumToRender : undefined
        }
        isVideoFeed={isVideoFeed}
      />
      {(isScrolledDown || hasNew) && (
        <LoadLatestBtn
          onPress={onScrollToTop}
          label={_(msg`Load new posts`)}
          showIndicator={hasNew}
        />
      )}
    </View>
  )
}

function ProfileEndOfFeed() {
  const t = useTheme()

  return (
    <View
      style={[a.w_full, a.py_5xl, a.border_t, t.atoms.border_contrast_medium]}>
      <Text style={[t.atoms.text_contrast_medium, a.text_center]}>
        <Trans>End of feed</Trans>
      </Text>
    </View>
  )
}
