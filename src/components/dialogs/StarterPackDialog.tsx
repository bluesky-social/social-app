import React from 'react'
import {View} from 'react-native'
import {
  type AppBskyGraphGetStarterPacksWithMembership,
  AppBskyGraphStarterpack,
} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {type NavigationProp} from '#/lib/routes/types'
import {
  RQKEY_WITH_MEMBERSHIP,
  useActorStarterPacksWithMembershipsQuery,
} from '#/state/queries/actor-starter-packs'
import {
  useListMembershipAddMutation,
  useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships'
import {List} from '#/view/com/util/List'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {Text} from '#/components/Typography'
import * as bsky from '#/types/bsky'
import {PlusLarge_Stroke2_Corner0_Rounded} from '../icons/Plus'
import {StarterPack} from '../icons/StarterPack'
import {TimesLarge_Stroke2_Corner0_Rounded} from '../icons/Times'

type StarterPackWithMembership =
  AppBskyGraphGetStarterPacksWithMembership.StarterPackWithMembership

// Simple module-level state for dialog coordination
let dialogCallbacks: {
  onSuccess?: () => void
} = {}

export function notifyDialogSuccess() {
  if (dialogCallbacks.onSuccess) {
    dialogCallbacks.onSuccess()
  }
}

export type StarterPackDialogProps = {
  control: Dialog.DialogControlProps
  accountDid: string
  targetDid: string
  enabled?: boolean
}

export function StarterPackDialog({
  control,
  accountDid: _accountDid,
  targetDid,
  enabled,
}: StarterPackDialogProps) {
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const requireEmailVerification = useRequireEmailVerification()

  React.useEffect(() => {
    dialogCallbacks.onSuccess = () => {
      if (!control.isOpen) {
        control.open()
      }
    }
  }, [control])

  const navToWizard = React.useCallback(() => {
    control.close()
    navigation.navigate('StarterPackWizard', {fromDialog: true})
  }, [navigation, control])

  const wrappedNavToWizard = requireEmailVerification(navToWizard, {
    instructions: [
      <Trans key="nav">
        Before creating a starter pack, you must first verify your email.
      </Trans>,
    ],
  })

  const onClose = React.useCallback(() => {
    // setCurrentView('initial')
    control.close()
  }, [control])

  const t = useTheme()

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.Inner label={_(msg`Add to starter packs`)} style={[a.w_full]}>
        <View>
          <View
            style={[
              {justifyContent: 'space-between', flexDirection: 'row'},
              a.my_lg,
            ]}>
            <Text style={[a.text_lg, a.font_bold]}>
              <Trans>Add to starter packs</Trans>
            </Text>
            <TimesLarge_Stroke2_Corner0_Rounded
              onPress={onClose}
              fill={t.atoms.text_contrast_medium.color}
            />
          </View>

          <StarterPackList
            onStartWizard={wrappedNavToWizard}
            targetDid={targetDid}
            enabled={enabled}
          />
        </View>
      </Dialog.Inner>
    </Dialog.Outer>
  )
}

function Empty({onStartWizard}: {onStartWizard: () => void}) {
  const {_} = useLingui()
  const t = useTheme()

  return (
    <View
      style={[a.align_center, a.gap_2xl, {paddingTop: 64, paddingBottom: 64}]}>
      <View style={[a.gap_xs, a.align_center]}>
        <StarterPack
          width={48}
          fill={t.atoms.border_contrast_medium.borderColor}
        />
        <Text style={[a.text_center]}>
          <Trans>You have no starter packs.</Trans>
        </Text>
      </View>

      <Button
        label={_(msg`Create starter pack`)}
        color="secondary_inverted"
        size="small"
        onPress={onStartWizard}>
        <ButtonText>
          <Trans>Create</Trans>
        </ButtonText>
        <ButtonIcon icon={PlusLarge_Stroke2_Corner0_Rounded} />
      </Button>
    </View>
  )
}

function StarterPackList({
  onStartWizard,
  targetDid,
  enabled,
}: {
  onStartWizard: () => void
  targetDid: string
  enabled?: boolean
}) {
  const {_} = useLingui()

  const {
    data,
    refetch,
    isError,
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

  const ListHeaderComponent = React.useCallback(
    () => (
      <>
        <View style={[a.flex_row, a.justify_between, a.align_center, a.py_md]}>
          <Text style={[a.text_md, a.font_bold]}>
            <Trans>New starter pack</Trans>
          </Text>
          <Button
            label={_(msg`Create starter pack`)}
            color="secondary_inverted"
            size="small"
            onPress={onStartWizard}>
            <ButtonText>
              <Trans>Create</Trans>
            </ButtonText>
            <ButtonIcon icon={PlusLarge_Stroke2_Corner0_Rounded} />
          </Button>
        </View>
        <Divider />
      </>
    ),
    [_, onStartWizard],
  )

  return (
    <List
      data={membershipItems}
      renderItem={renderItem}
      keyExtractor={(item: StarterPackWithMembership, index: number) =>
        item.starterPack.uri || index.toString()
      }
      refreshing={false}
      onRefresh={_onRefresh}
      onEndReached={_onEndReached}
      onEndReachedThreshold={0.1}
      ListHeaderComponent={
        membershipItems.length > 0 ? ListHeaderComponent : null
      }
      ListEmptyComponent={<Empty onStartWizard={onStartWizard} />}
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
  const [isUpdating, setIsUpdating] = React.useState(false)

  const starterPack = starterPackWithMembership.starterPack
  const isInPack = !!starterPackWithMembership.listItem
  console.log('StarterPackItem render. 111', {
    starterPackWithMembership: starterPackWithMembership.listItem?.subject,
  })

  console.log('StarterPackItem render', {
    starterPackWithMembership,
  })

  const {mutateAsync: addMembership} = useListMembershipAddMutation({
    onSuccess: () => {
      Toast.show(_(msg`Added to starter pack`))
    },
    onError: () => {
      Toast.show(_(msg`Failed to add to starter pack`), 'xmark')
    },
  })

  const {mutateAsync: removeMembership} = useListMembershipRemoveMutation({
    onSuccess: () => {
      Toast.show(_(msg`Removed from starter pack`))
    },
    onError: () => {
      Toast.show(_(msg`Failed to remove from starter pack`), 'xmark')
    },
  })

  const handleToggleMembership = async () => {
    if (!starterPack.list?.uri || isUpdating) return

    const listUri = starterPack.list.uri
    setIsUpdating(true)

    try {
      if (!isInPack) {
        await addMembership({
          listUri: listUri,
          actorDid: targetDid,
        })
      } else {
        if (!starterPackWithMembership.listItem?.uri) {
          console.error('Cannot remove: missing membership URI')
          return
        }
        await removeMembership({
          listUri: listUri,
          actorDid: targetDid,
          membershipUri: starterPackWithMembership.listItem.uri,
        })
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: RQKEY_WITH_MEMBERSHIP(targetDid),
        }),
      ])
    } catch (error) {
      console.error('Failed to toggle membership:', error)
    } finally {
      setIsUpdating(false)
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
                {starterPack.listItemsSample?.slice(0, 4).map((p, index) => (
                  <UserAvatar
                    key={p.subject.did}
                    avatar={p.subject.avatar}
                    size={32}
                    type={'user'}
                    style={[
                      {
                        zIndex: 1 - index,
                        marginLeft: index > 0 ? -2 : 0,
                        borderWidth: 0.5,
                        borderColor: t.atoms.bg.backgroundColor,
                      },
                    ]}
                  />
                ))}

                {starterPack.list?.listItemCount &&
                  starterPack.list.listItemCount > 4 && (
                    <Text
                      style={[
                        a.text_sm,
                        t.atoms.text_contrast_medium,
                        a.ml_xs,
                      ]}>
                      {`+${starterPack.list.listItemCount - 4} more`}
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
        disabled={isUpdating}
        onPress={handleToggleMembership}>
        <ButtonText>
          {isInPack ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
        </ButtonText>
      </Button>
    </View>
  )
}
