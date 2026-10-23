import {useState} from 'react'
import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {type FeedDescriptor, RQKEY} from '#/state/queries/post-feed'
import {truncateAndInvalidate} from '#/state/queries/util'
import {usePostFeedModel} from '#/view/com/posts/usePostFeedModel'
import {
  EmptyState,
  type EmptyStateButtonProps,
} from '#/view/com/util/EmptyState'
import {atoms as a, useTheme} from '#/alf'
import {EditBig_Stroke1_Corner0_Rounded as EditIcon} from '#/components/icons/EditBig'
import {Text} from '#/components/Typography'
import {type ProfileSection} from './types'

/**
 * A tab that shows one of the account's feeds: its posts, replies, media,
 * videos or likes.
 *
 * The feed brings its rows and paging; this adds what a profile tab has that a
 * feed on its own does not: an empty state that offers to write a post, and an
 * end-of-feed line that says the list really is finished.
 */
export function useProfileFeedSection({
  feed,
  enabled,
  ignoreFilterFor,
  emptyStateMessage,
  emptyStateButton,
  emptyStateIcon,
  isVideoFeed = false,
}: {
  feed: FeedDescriptor
  enabled: boolean
  ignoreFilterFor?: string
  emptyStateMessage: string
  emptyStateButton?: EmptyStateButtonProps
  emptyStateIcon?: React.ComponentType | React.ReactElement
  isVideoFeed?: boolean
}): ProfileSection {
  const {t: l} = useLingui()
  const queryClient = useQueryClient()
  const [hasNew, setHasNew] = useState(false)

  const renderEmptyState = () => (
    <View style={[a.flex_1, a.justify_center, a.align_center]}>
      <EmptyState
        style={a.w_full}
        icon={emptyStateIcon || EditIcon}
        iconSize="3xl"
        message={emptyStateMessage || l(msg`No posts yet`)}
        button={emptyStateButton}
      />
    </View>
  )

  const model = usePostFeedModel({
    feed,
    enabled,
    ignoreFilterFor,
    onHasNew: setHasNew,
    renderEmptyState,
    // A grid of videos is its own explanation; an end-of-feed line under it
    // would sit in the middle of a row of tiles.
    renderEndOfFeed: isVideoFeed ? undefined : ProfileEndOfFeed,
    isVideoFeed,
  })

  return {
    data: model.rows,
    keyExtractor: model.keyExtractor,
    renderItem: model.renderItem,
    ListFooterComponent: model.ListFooterComponent,
    onItemSeen: model.onItemSeen,
    onScrolledDownChange: model.onScrolledDownChange,
    onRefresh: model.onRefresh,
    refreshing: model.refreshing,
    onEndReached: model.onEndReached,
    /*
     * Asking for the newest posts is also asking to see them: the list goes back
     * to the top (see the screen) and the query is cleared so the next page is
     * fetched fresh rather than replayed from the cache.
     */
    onReset: () => {
      void truncateAndInvalidate(queryClient, RQKEY(feed))
      setHasNew(false)
    },
    hasNew,
    isEmpty: model.isEmpty,
  }
}

function ProfileEndOfFeed() {
  const t = useTheme()

  return (
    <View style={[a.w_full, a.py_5xl, a.border_t, t.atoms.border_contrast_low]}>
      <Text style={[t.atoms.text_contrast_medium, a.text_center]}>
        <Trans>End of feed</Trans>
      </Text>
    </View>
  )
}
