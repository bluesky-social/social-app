import {useCallback} from 'react'
import {View} from 'react-native'
import {
  type AppBskyGraphGetStarterPacksWithMembership,
  AppBskyGraphStarterpack,
} from '@atproto/api'
import {msg, Plural, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
import {type NavigationProp} from '#/lib/routes/types'
import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useActorStarterPacksWithMembershipsQuery} from '#/state/queries/actor-starter-packs'
import {
  useListMembershipAddMutation,
  useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships'
import {useProfileQuery} from '#/state/queries/profile'
import {atoms as a, native, platform, useTheme} from '#/alf'
import {AvatarStack} from '#/components/AvatarStack'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import {PlusLarge_Stroke2_Corner0_Rounded as PlusIcon} from '#/components/icons/Plus'
import {StarterPack} from '#/components/icons/StarterPack'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import {IS_WEB} from '#/env'
import * as bsky from '#/types/bsky'

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
  const navigation = useNavigation<NavigationProp>()
  const requireEmailVerification = useRequireEmailVerification()

  const navToWizard = useCallback(() => {
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

  return (
    <View style={[a.gap_2xl, {paddingTop: IS_WEB ? 100 : 64}]}>
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
          <ButtonIcon icon={PlusIcon} />
        </Button>
      </View>
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
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const {data: subject} = useProfileQuery({did: targetDid})

  const {
    data,
    isError,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useActorStarterPacksWithMembershipsQuery({did: targetDid, enabled})

  const membershipItems =
    data?.pages.flatMap(page => page.starterPacksWithMembership) || []

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      // Error handling is optional since this is just pagination
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const renderItem = useCallback(
    ({item}: {item: StarterPackWithMembership}) => (
      <StarterPackItem
        starterPackWithMembership={item}
        targetDid={targetDid}
        subject={subject}
      />
    ),
    [targetDid, subject],
  )

  const onClose = useCallback(() => {
    control.close()
  }, [control])

  const listHeader = (
    <>
      <View
        style={[
          a.justify_between,
          a.align_center,
          a.flex_row,
          a.pb_lg,
          native(a.pt_lg),
        ]}>
        <Text style={[a.text_lg, a.font_semi_bold]}>
          <Trans>Add to starter packs</Trans>
        </Text>
        <Button
          label={_(msg`Close`)}
          onPress={onClose}
          variant="ghost"
          color="secondary"
          size="small"
          shape="round"
          style={{margin: -8}}>
          <ButtonIcon icon={XIcon} />
        </Button>
      </View>
      {membershipItems.length > 0 && (
        <>
          <View
            style={[a.flex_row, a.justify_between, a.align_center, a.py_md]}>
            <Text style={[a.text_md, a.font_semi_bold]}>
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
              <ButtonIcon icon={PlusIcon} />
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
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={<Empty onStartWizard={onStartWizard} />}
      style={platform({
        web: [a.px_2xl, {minHeight: 500}],
        native: [a.px_2xl, a.pt_lg],
      })}
    />
  )
}

function StarterPackItem({
  starterPackWithMembership,
  targetDid,
  subject,
}: {
  starterPackWithMembership: StarterPackWithMembership
  targetDid: string
  subject?: bsky.profile.AnyProfileView
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()

  const starterPack = starterPackWithMembership.starterPack
  const isInPack = !!starterPackWithMembership.listItem

  const {mutate: addMembership, isPending: isPendingAdd} =
    useListMembershipAddMutation({
      subject,
      onSuccess: () => {
        Toast.show(_(msg`Added to starter pack`))
      },
      onError: err => {
        if (!isNetworkError(err)) {
          logger.error('Failed to add to starter pack', {safeMessage: err})
        }
        Toast.show(_(msg`Failed to add to starter pack`), {type: 'error'})
      },
    })

  const {mutate: removeMembership, isPending: isPendingRemove} =
    useListMembershipRemoveMutation({
      onSuccess: () => {
        Toast.show(_(msg`Removed from starter pack`))
      },
      onError: err => {
        if (!isNetworkError(err)) {
          logger.error('Failed to remove from starter pack', {safeMessage: err})
        }
        Toast.show(_(msg`Failed to remove from starter pack`), {type: 'error'})
      },
    })

  const isPending = isPendingAdd || isPendingRemove

  const handleToggleMembership = () => {
    if (!starterPack.list?.uri || isPending) return

    const listUri = starterPack.list.uri
    const starterPackUri = starterPack.uri

    if (!isInPack) {
      addMembership({
        listUri: listUri,
        actorDid: targetDid,
      })
      ax.metric('starterPack:addUser', {starterPack: starterPackUri})
    } else {
      if (!starterPackWithMembership.listItem?.uri) {
        console.error('Cannot remove: missing membership URI')
        return
      }
      removeMembership({
        listUri: listUri,
        actorDid: targetDid,
        membershipUri: starterPackWithMembership.listItem.uri,
      })
      ax.metric('starterPack:removeUser', {starterPack: starterPackUri})
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
        <Text emoji style={[a.text_md, a.font_semi_bold]} numberOfLines={1}>
          {record.name}
        </Text>

        <View style={[a.flex_row, a.align_center, a.mt_xs]}>
          {starterPack.listItemsSample &&
            starterPack.listItemsSample.length > 0 && (
              <>
                <AvatarStack
                  size={24}
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
        color={isInPack ? 'secondary' : 'primary_subtle'}
        size="tiny"
        disabled={isPending}
        onPress={handleToggleMembership}>
        {isPending && <ButtonIcon icon={Loader} />}
        <ButtonText>
          {isInPack ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
        </ButtonText>
      </Button>
    </View>
  )
}
