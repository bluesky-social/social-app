import React from 'react'
import {View} from 'react-native'
import {
  type AppBskyGraphGetStarterPacksWithMembership,
  AppBskyGraphStarterpack,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {type NavigationProp} from '#/lib/routes/types'
import {isWeb} from '#/platform/detection'
import {
  invalidateActorStarterPacksWithMembershipQuery,
  useActorStarterPacksWithMembershipsQuery,
} from '#/state/queries/actor-starter-packs'
import {
  useListMembershipAddMutation,
  useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'
import {AvatarStack} from '../AvatarStack'
import {PlusLarge_Stroke2_Corner0_Rounded} from '../icons/Plus'
import {StarterPack} from '../icons/StarterPack'
import {TimesLarge_Stroke2_Corner0_Rounded} from '../icons/Times'

type StarterPackWithMembership =
  AppBskyGraphGetStarterPacksWithMembership.StarterPackWithMembership

export type StarterPackDialogProps = {
  control: Dialog.DialogControlProps
  targetDid: string
  enabled?: boolean
}

export function StarterPackDialog({
  control,
  targetDid,
  enabled,
}: StarterPackDialogProps) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const requireEmailVerification = useRequireEmailVerification()

  const navToWizard = React.useCallback(() => {
    control.close()
    navigation.navigate('StarterPackWizard', {
      fromDialog: true,
      targetDid: targetDid,
      onSuccess: () => {
        setTimeout(() => {
          if (!control.isOpen) {
            control.open()
          }
        }, 0)
      },
    })
  }, [navigation, control, targetDid])

  const wrappedNavToWizard = requireEmailVerification(navToWizard, {
    instructions: [
      <Trans key="nav">
        Before creating a starter pack, you must first verify your email.
      </Trans>,
    ],
  })

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <StarterPackList
        control={control}
        onStartWizard={wrappedNavToWizard}
        targetDid={targetDid}
        enabled={enabled}
      />
    </Dialog.Outer>
  )
}

function Empty({onStartWizard}: {onStartWizard: () => void}) {
  const {_} = useLingui()
  const t = useTheme()

  isWeb
  return (
    <View style={[a.gap_2xl, {paddingTop: isWeb ? 100 : 64}]}>
      <View style={[a.gap_xs, a.align_center]}>
        <StarterPack
          width={48}
          fill={t.atoms.border_contrast_medium.borderColor}
        />
        <Text style={[a.text_center]}>
          <Trans>You have no starter packs.</Trans>
        </Text>
      </View>

      <View style={[a.align_center]}>
        <Button
          label={_(msg`Create starter pack`)}
          color="secondary_inverted"
          size="small"
          onPress={onStartWizard}>
          <ButtonText>
            <Trans comment="Text on button to create a new starter pack">
              Create
            </Trans>
          </ButtonText>
          <ButtonIcon icon={PlusLarge_Stroke2_Corner0_Rounded} />
        </Button>
      </View>
    </View>
  )
}

function StarterPackList({
  control,
  onStartWizard,
  targetDid,
  enabled,
}: {
  control: Dialog.DialogControlProps
  onStartWizard: () => void
  targetDid: string
  enabled?: boolean
}) {
  const {_} = useLingui()
  const t = useTheme()

  const {
    data,
    refetch,
    isError,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useActorStarterPacksWithMembershipsQuery({did: targetDid, enabled})

  const membershipItems =
    data?.pages.flatMap(page => page.starterPacksWithMembership) || []

  const _onRefresh = React.useCallback(async () => {
    try {
      await refetch()
    } catch (err) {
      // Error handling is optional since this is just a refresh
    }
  }, [refetch])

  const _onEndReached = React.useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      // Error handling is optional since this is just pagination
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const renderItem = React.useCallback(
    ({item}: {item: StarterPackWithMembership}) => (
      <StarterPackItem starterPackWithMembership={item} targetDid={targetDid} />
    ),
    [targetDid],
  )

  const onClose = React.useCallback(() => {
    control.close()
  }, [control])

  const XIcon = React.useMemo(() => {
    return (
      <TimesLarge_Stroke2_Corner0_Rounded
        fill={t.atoms.text_contrast_medium.color}
      />
    )
  }, [t])

  const listHeader = (
    <>
      <View
        style={[
          {justifyContent: 'space-between', flexDirection: 'row'},
          isWeb ? a.mb_2xl : a.my_lg,
          a.align_center,
        ]}>
        <Text style={[a.text_lg, a.font_bold]}>
          <Trans>Add to starter packs</Trans>
        </Text>
        <Button label={_(msg`Close`)} onPress={onClose}>
          <ButtonIcon icon={() => XIcon} />
        </Button>
      </View>
      {membershipItems.length > 0 && (
        <>
          <View
            style={[a.flex_row, a.justify_between, a.align_center, a.py_md]}>
            <Text style={[a.text_md, a.font_bold]}>
              <Trans>New starter pack</Trans>
            </Text>
            <Button
              label={_(msg`Create starter pack`)}
              color="secondary_inverted"
              size="small"
              onPress={onStartWizard}>
              <ButtonText>
                <Trans comment="Text on button to create a new starter pack">
                  Create
                </Trans>
              </ButtonText>
              <ButtonIcon icon={PlusLarge_Stroke2_Corner0_Rounded} />
            </Button>
          </View>
          <Divider />
        </>
      )}
    </>
  )

  return (
    <Dialog.InnerFlatList
      data={isLoading ? [{}] : membershipItems}
      renderItem={
        isLoading
          ? () => (
              <View style={[a.align_center, a.py_2xl]}>
                <Loader size="xl" />
              </View>
            )
          : renderItem
      }
      keyExtractor={
        isLoading
          ? () => 'starter_pack_dialog_loader'
          : (item: StarterPackWithMembership) => item.starterPack.uri
      }
      refreshing={false}
      onRefresh={_onRefresh}
      onEndReached={_onEndReached}
      onEndReachedThreshold={0.1}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={<Empty onStartWizard={onStartWizard} />}
      style={isWeb ? [a.px_md, {minHeight: 500}] : [a.px_2xl, a.pt_lg]}
    />
  )
}

function StarterPackItem({
  starterPackWithMembership,
  targetDid,
}: {
  starterPackWithMembership: StarterPackWithMembership
  targetDid: string
}) {
  const {_} = useLingui()
  const t = useTheme()
  const queryClient = useQueryClient()

  const starterPack = starterPackWithMembership.starterPack
  const isInPack = !!starterPackWithMembership.listItem

  const [isPendingRefresh, setIsPendingRefresh] = React.useState(false)

  const {mutate: addMembership} = useListMembershipAddMutation({
    onSuccess: () => {
      Toast.show(_(msg`Added to starter pack`))
      // Use a timeout to wait for the appview to update, matching the pattern
      // in list-memberships.ts
      setTimeout(() => {
        invalidateActorStarterPacksWithMembershipQuery({
          queryClient,
          did: targetDid,
        })
        setIsPendingRefresh(false)
      }, 1e3)
    },
    onError: () => {
      Toast.show(_(msg`Failed to add to starter pack`), 'xmark')
      setIsPendingRefresh(false)
    },
  })

  const {mutate: removeMembership} = useListMembershipRemoveMutation({
    onSuccess: () => {
      Toast.show(_(msg`Removed from starter pack`))
      // Use a timeout to wait for the appview to update, matching the pattern
      // in list-memberships.ts
      setTimeout(() => {
        invalidateActorStarterPacksWithMembershipQuery({
          queryClient,
          did: targetDid,
        })
        setIsPendingRefresh(false)
      }, 1e3)
    },
    onError: () => {
      Toast.show(_(msg`Failed to remove from starter pack`), 'xmark')
      setIsPendingRefresh(false)
    },
  })

  const handleToggleMembership = () => {
    if (!starterPack.list?.uri || isPendingRefresh) return

    const listUri = starterPack.list.uri

    setIsPendingRefresh(true)

    if (!isInPack) {
      addMembership({
        listUri: listUri,
        actorDid: targetDid,
      })
    } else {
      if (!starterPackWithMembership.listItem?.uri) {
        console.error('Cannot remove: missing membership URI')
        setIsPendingRefresh(false)
        return
      }
      removeMembership({
        listUri: listUri,
        actorDid: targetDid,
        membershipUri: starterPackWithMembership.listItem.uri,
      })
    }
  }

  const {record} = starterPack

  if (
    !bsky.dangerousIsType<AppBskyGraphStarterpack.Record>(
      record,
      AppBskyGraphStarterpack.isRecord,
    )
  ) {
    return null
  }

  return (
    <View style={[a.flex_row, a.justify_between, a.align_center, a.py_md]}>
      <View>
        <Text emoji style={[a.text_md, a.font_bold]} numberOfLines={1}>
          {record.name}
        </Text>

        <View style={[a.flex_row, a.align_center, a.mt_xs]}>
          {starterPack.listItemsSample &&
            starterPack.listItemsSample.length > 0 && (
              <>
                <AvatarStack
                  size={32}
                  profiles={starterPack.listItemsSample
                    ?.slice(0, 4)
                    .map(p => p.subject)}
                />

                {starterPack.list?.listItemCount &&
                  starterPack.list.listItemCount > 4 && (
                    <Text
                      style={[
                        a.text_sm,
                        t.atoms.text_contrast_medium,
                        a.ml_xs,
                      ]}>
                      <Trans>
                        <Plural
                          value={starterPack.list.listItemCount - 4}
                          other="+# more"
                        />
                      </Trans>
                    </Text>
                  )}
              </>
            )}
        </View>
      </View>

      <Button
        label={isInPack ? _(msg`Remove`) : _(msg`Add`)}
        color={isInPack ? 'secondary' : 'primary'}
        size="tiny"
        disabled={isPendingRefresh}
        onPress={handleToggleMembership}>
        <ButtonText>
          {isInPack ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
        </ButtonText>
      </Button>
    </View>
  )
}
