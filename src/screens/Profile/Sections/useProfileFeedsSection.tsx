import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {usePreferencesQuery} from '#/state/queries/preferences'
import {useProfileFeedgensQuery} from '#/state/queries/profile-feedgens'
import {useSession} from '#/state/session'
import {EmptyState} from '#/view/com/util/EmptyState'
import {atoms as a, useTheme} from '#/alf'
import * as FeedCard from '#/components/FeedCard'
import {HashtagWide_Stroke1_Corner0_Rounded as HashtagWideIcon} from '#/components/icons/Hashtag'
import {type ProfileSection} from './types'
import {usePagedCardsSection} from './usePagedCardsSection'

/**
 * The custom feeds the account has published.
 */
export function useProfileFeedsSection({
  did,
  enabled,
}: {
  did: string
  enabled: boolean
}): ProfileSection {
  const {t: l} = useLingui()
  const t = useTheme()
  const navigation = useNavigation()
  const {currentAccount} = useSession()
  const isSelf = currentAccount?.did === did
  const {data: preferences} = usePreferencesQuery()

  const {
    data,
    isPending,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useProfileFeedgensQuery(did, {enabled})
  const items = data?.pages.flatMap(page => page.feeds)

  return usePagedCardsSection({
    items,
    isPending,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    loadMoreErrorMessage: msg`There was an issue fetching your feeds. Tap here to try again.`,
    renderEmpty: () => (
      <EmptyState
        style={a.w_full}
        icon={HashtagWideIcon}
        message={
          isSelf
            ? l(msg`You haven't made any custom feeds yet.`)
            : l(msg`No custom feeds yet`)
        }
        textStyle={[t.atoms.text_contrast_medium, a.font_medium]}
        button={
          isSelf
            ? {
                label: l(msg`Browse custom feeds`),
                text: l(msg`Browse custom feeds`),
                onPress: () => navigation.navigate('Feeds' as never),
                size: 'small',
                color: 'secondary',
              }
            : undefined
        }
      />
    ),
    // A feed card is drawn from the reader's own saved-feed preferences, so it
    // waits for them instead of rendering and then changing.
    renderCard: feed => (preferences ? <FeedCard.Default view={feed} /> : null),
  })
}
