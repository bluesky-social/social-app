import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {usePreferencesQuery} from '#/state/queries/preferences'
import {useProfileListsQuery} from '#/state/queries/profile-lists'
import {useSession} from '#/state/session'
import {EmptyState} from '#/view/com/util/EmptyState'
import {atoms as a, useTheme} from '#/alf'
import {BulletList_Stroke1_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import * as ListCard from '#/components/ListCard'
import {type ProfileSection} from './types'
import {usePagedCardsSection} from './usePagedCardsSection'

/**
 * The account's lists: moderation lists on a labeler, ordinary lists elsewhere.
 */
export function useProfileListsSection({
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
  } = useProfileListsQuery(did, {enabled})
  const items = data?.pages.flatMap(page => page.lists)

  return usePagedCardsSection({
    items,
    isPending,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    loadMoreErrorMessage: msg`There was an issue fetching your lists. Tap here to try again.`,
    renderEmpty: () => (
      <EmptyState
        icon={ListIcon}
        message={
          isSelf ? l(msg`You haven't created any lists yet.`) : l(msg`No lists`)
        }
        textStyle={[t.atoms.text_contrast_medium, a.font_medium]}
        button={
          isSelf
            ? {
                label: l(msg`Create a list`),
                text: l(msg`Create a list`),
                onPress: () => navigation.navigate('Lists' as never),
                size: 'small',
                color: 'primary',
              }
            : undefined
        }
      />
    ),
    // Preferences decide how a list's purpose is drawn, so the cards wait for
    // them rather than rendering once and then changing their mind.
    renderCard: list => (preferences ? <ListCard.Default view={list} /> : null),
  })
}
