import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'
import {useIsFocused} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {listenSoftReset} from '#/state/events'
import {
  type FeedDescriptor,
  RQKEY as FEED_RQKEY,
} from '#/state/queries/post-feed'
import {PostFeed, type PostFeedRef} from '#/view/com/posts/PostFeed'
import {EmptyState} from '#/view/com/util/EmptyState'
import {type ListRef} from '#/view/com/util/List'
import {LoadLatestBtn} from '#/view/com/util/load-latest/LoadLatestBtn'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon} from '#/components/icons/Hashtag'
import {PersonPlus_Stroke2_Corner0_Rounded as PersonPlusIcon} from '#/components/icons/Person'
import {useAnalytics} from '#/analytics'
import {IS_NATIVE} from '#/env'
import {isFollowingV2Eligible} from '#/features/followingV2/eligibility'

interface SectionRef {
  scrollToTop: () => void
}

interface FeedSectionProps {
  ref?: React.Ref<SectionRef>
  feed: FeedDescriptor
  headerHeight: number
  scrollElRef: ListRef
  isFocused: boolean
  isOwner: boolean
  onPressAddUser: () => void
}

export function FeedSection({
  ref,
  feed,
  scrollElRef,
  headerHeight,
  isFocused,
  isOwner,
  onPressAddUser,
}: FeedSectionProps) {
  const queryClient = useQueryClient()
  const [hasNew, setHasNew] = useState(false)
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const isScreenFocused = useIsFocused()
  const {_} = useLingui()
  const ax = useAnalytics()
  const feedRef = useRef<PostFeedRef>(null)

  const onScrollToTop = useCallback(() => {
    scrollElRef.current?.scrollToOffset({
      animated: IS_NATIVE,
      offset: -headerHeight,
    })
    // With Following v2 the feed scrolls again once the new top has rendered.
    if (isFollowingV2Eligible(ax)) {
      void feedRef.current?.refreshToTop()
    } else {
      queryClient.resetQueries({queryKey: FEED_RQKEY(feed)})
    }
    setHasNew(false)
  }, [scrollElRef, headerHeight, ax, queryClient, feed, setHasNew])
  useImperativeHandle(ref, () => ({
    scrollToTop: onScrollToTop,
  }))

  useEffect(() => {
    if (!isScreenFocused) {
      return
    }
    return listenSoftReset(onScrollToTop)
  }, [onScrollToTop, isScreenFocused])

  const renderPostsEmpty = useCallback(() => {
    return (
      <View style={[a.gap_xl, a.align_center]}>
        <EmptyState
          icon={HashtagWideIcon}
          iconSize="2xl"
          message={_(msg`This feed is empty.`)}
        />
        {isOwner && (
          <Button
            label={_(msg`Start adding people`)}
            onPress={onPressAddUser}
            color="primary"
            size="small">
            <ButtonIcon icon={PersonPlusIcon} />
            <ButtonText>
              <Trans>Start adding people!</Trans>
            </ButtonText>
          </Button>
        )}
      </View>
    )
  }, [_, onPressAddUser, isOwner])

  return (
    <View>
      <PostFeed
        testID="listFeed"
        enabled={isFocused}
        feed={feed}
        pollInterval={60e3}
        disablePoll={hasNew}
        scrollElRef={scrollElRef}
        onHasNew={setHasNew}
        onScrolledDownChange={setIsScrolledDown}
        renderEmptyState={renderPostsEmpty}
        headerOffset={headerHeight}
        ref={feedRef}
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
