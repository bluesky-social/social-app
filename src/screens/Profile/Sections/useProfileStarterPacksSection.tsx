import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {useActorStarterPacksQuery} from '#/state/queries/actor-starter-packs'
import {
  EmptyState,
  type EmptyStateButtonProps,
} from '#/view/com/util/EmptyState'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {PlusSmall_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
import {Default as StarterPackCard} from '#/components/StarterPack/StarterPackCard'
import {type ProfileSection} from './types'
import {usePagedCardsSection} from './usePagedCardsSection'

/**
 * The Starter Packs the account has made.
 *
 * The reader's own profile offers to make another below the last, because this
 * tab is where they come to manage the ones they have.
 */
export function useProfileStarterPacksSection({
  did,
  enabled,
  isMe,
  emptyStateMessage,
  emptyStateButton,
  emptyStateIcon,
}: {
  did: string
  enabled: boolean
  isMe: boolean
  emptyStateMessage: string
  emptyStateButton?: EmptyStateButtonProps
  emptyStateIcon?: React.ComponentType | React.ReactElement
}): ProfileSection {
  const {
    data,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
  } = useActorStarterPacksQuery({did, enabled})
  const items = data?.pages.flatMap(page => page.starterPacks)

  const section = usePagedCardsSection({
    items,
    isPending: !data && !isError,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    loadMoreErrorMessage: msg`There was an issue fetching these Starter Packs. Tap here to try again.`,
    renderEmpty: () => (
      <EmptyState
        icon={emptyStateIcon}
        iconSize="3xl"
        message={emptyStateMessage}
        button={emptyStateButton}
      />
    ),
    renderCard: pack => <StarterPackCard starterPack={pack} />,
  })

  return {
    ...section,
    // The tab pages like the others, but its end is an offer rather than a
    // spinner: having some already, making another is the thing to do next.
    ListFooterComponent:
      isMe && items?.length ? <CreateAnother /> : section.ListFooterComponent,
  }
}

function CreateAnother() {
  const {t: l} = useLingui()
  const t = useTheme()
  const navigation = useNavigation<NavigationProp>()

  return (
    <View
      style={[
        a.pr_md,
        a.pt_lg,
        a.gap_lg,
        a.border_t,
        t.atoms.border_contrast_low,
      ]}>
      <Button
        label={l`Create a Starter Pack`}
        variant="solid"
        color="secondary"
        size="small"
        style={a.self_center}
        onPress={() => navigation.navigate('StarterPackWizard', {})}>
        <ButtonText>
          <Trans>Create another</Trans>
        </ButtonText>
        <ButtonIcon icon={Plus} position="right" />
      </Button>
    </View>
  )
}
