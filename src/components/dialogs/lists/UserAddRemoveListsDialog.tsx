import {useCallback} from 'react'
import {View} from 'react-native'
import {type AppBskyActorDefs} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useQueryClient} from '@tanstack/react-query'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {isNetworkError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {
  useListMembershipAddMutation,
  useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships'
import {
  type ListWithMembership,
  removeListMembershipOptimistically,
  updateListMembershipOptimistically,
  useListsWithMembershipQuery,
} from '#/state/queries/lists-with-membership'
import {useSession} from '#/state/session'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, native, platform, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export type UserAddRemoveListsDialogProps = {
  control: Dialog.DialogControlProps
  subjectDid: string
  displayName: string
  handle: string
  onAdd?: (listUri: string) => void
  onRemove?: (listUri: string) => void
}

export function UserAddRemoveListsDialog({
  control,
  subjectDid,
  displayName,
  handle,
  onAdd,
  onRemove,
}: UserAddRemoveListsDialogProps) {
  return (
    <Dialog.Outer control={control} testID="userAddRemoveListsDialog">
      <Dialog.Handle />
      <ListsContent
        subjectDid={subjectDid}
        displayName={displayName}
        handle={handle}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    </Dialog.Outer>
  )
}

function Empty() {
  const t = useTheme()

  return (
    <View
      style={[
        a.gap_2xl,
        platform({web: {paddingTop: 100}, native: {paddingTop: 64}}),
      ]}>
      <View style={[a.gap_xs, a.align_center]}>
        <ListIcon
          size="xl"
          style={{color: t.atoms.border_contrast_medium.borderColor}}
        />
        <Text style={[a.text_center]}>
          <Trans>You have no lists.</Trans>
        </Text>
      </View>
    </View>
  )
}

function ListsContent({
  subjectDid,
  displayName,
  handle,
  onAdd,
  onRemove,
}: Omit<UserAddRemoveListsDialogProps, 'control'>) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()

  const {
    data,
    isError,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useListsWithMembershipQuery({actor: subjectDid})

  const listItems = data?.pages.flatMap(page => page.listsWithMembership) || []

  const onEndReached = useCallback(async () => {
    if (isFetchingNextPage || !hasNextPage || isError) return
    try {
      await fetchNextPage()
    } catch (err) {
      // Error handling is optional since this is just pagination
    }
  }, [isFetchingNextPage, hasNextPage, isError, fetchNextPage])

  const renderItem = useCallback(
    ({item}: {item: ListWithMembership}) => (
      <ListItem
        listWithMembership={item}
        subjectDid={subjectDid}
        displayName={displayName}
        handle={handle}
        onAdd={onAdd}
        onRemove={onRemove}
      />
    ),
    [subjectDid, displayName, handle, onAdd, onRemove],
  )

  const onClose = useCallback(() => {
    control.close()
  }, [control])

  const listHeader = (
    <View
      style={[
        a.justify_between,
        a.align_center,
        a.flex_row,
        a.pb_lg,
        native(a.pt_lg),
      ]}>
      <Text style={[a.text_lg, a.font_semi_bold]}>
        <Trans>Update {sanitizeDisplayName(displayName)} in Lists</Trans>
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
  )

  return (
    <Dialog.InnerFlatList
      data={isLoading ? [{}] : listItems}
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
          ? () => 'lists_dialog_loader'
          : (item: ListWithMembership) => item.list.uri
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={<Empty />}
      style={platform({
        web: [a.px_2xl, {minHeight: 400}],
        native: [a.px_2xl, a.pt_lg],
      })}
    />
  )
}

function ListItem({
  listWithMembership,
  subjectDid,
  displayName,
  handle,
  onAdd,
  onRemove,
}: {
  listWithMembership: ListWithMembership
  subjectDid: string
  displayName: string
  handle: string
  onAdd?: (listUri: string) => void
  onRemove?: (listUri: string) => void
}) {
  const {_} = useLingui()
  const t = useTheme()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()

  const list = listWithMembership.list
  const listItem = listWithMembership.listItem
  const isMember = !!listItem

  const {mutate: addMembership, isPending: isPendingAdd} =
    useListMembershipAddMutation({
      onSuccess: data => {
        Toast.show(_(msg`Added to list`))
        onAdd?.(list.uri)
        updateListMembershipOptimistically({
          queryClient,
          actor: subjectDid,
          listUri: list.uri,
          membershipUri: data.uri,
          subject: {
            did: subjectDid,
            handle,
            displayName,
          } as AppBskyActorDefs.ProfileView,
        })
      },
      onError: err => {
        if (!isNetworkError(err)) {
          logger.error('Failed to add to list', {safeMessage: err})
        }
        Toast.show(_(msg`Failed to add to list`), {type: 'error'})
      },
    })

  const {mutate: removeMembership, isPending: isPendingRemove} =
    useListMembershipRemoveMutation({
      onSuccess: () => {
        Toast.show(_(msg`Removed from list`))
        onRemove?.(list.uri)
        removeListMembershipOptimistically({
          queryClient,
          actor: subjectDid,
          listUri: list.uri,
        })
      },
      onError: err => {
        if (!isNetworkError(err)) {
          logger.error('Failed to remove from list', {safeMessage: err})
        }
        Toast.show(_(msg`Failed to remove from list`), {type: 'error'})
      },
    })

  const isPending = isPendingAdd || isPendingRemove

  const handleToggleMembership = useCallback(() => {
    if (isPending) return

    if (!isMember) {
      addMembership({
        listUri: list.uri,
        actorDid: subjectDid,
      })
    } else {
      if (!listItem?.uri) {
        console.error('Cannot remove: missing membership URI')
        return
      }
      removeMembership({
        listUri: list.uri,
        actorDid: subjectDid,
        membershipUri: listItem.uri,
      })
    }
  }, [
    list.uri,
    subjectDid,
    isMember,
    listItem,
    isPending,
    addMembership,
    removeMembership,
  ])

  return (
    <View
      testID={`toggleBtn-${list.name}`}
      style={[a.flex_row, a.align_center, a.py_md, a.gap_md]}>
      <UserAvatar size={40} avatar={list.avatar} type="list" />
      <View style={[a.flex_1]}>
        <Text
          style={[a.text_md, a.font_semi_bold, a.leading_snug]}
          numberOfLines={1}>
          {sanitizeDisplayName(list.name)}
        </Text>
        <Text
          style={[a.text_sm, a.leading_snug, t.atoms.text_contrast_medium]}
          numberOfLines={1}>
          {list.purpose === 'app.bsky.graph.defs#curatelist' &&
            (list.creator.did === currentAccount?.did ? (
              <Trans>User list by you</Trans>
            ) : (
              <Trans>
                User list by {sanitizeHandle(list.creator.handle, '@')}
              </Trans>
            ))}
          {list.purpose === 'app.bsky.graph.defs#modlist' &&
            (list.creator.did === currentAccount?.did ? (
              <Trans>Moderation list by you</Trans>
            ) : (
              <Trans>
                Moderation list by {sanitizeHandle(list.creator.handle, '@')}
              </Trans>
            ))}
        </Text>
      </View>
      <Button
        testID={`user-${handle}-addBtn`}
        label={isMember ? _(msg`Remove`) : _(msg`Add`)}
        onPress={handleToggleMembership}
        disabled={isPending}
        size="tiny"
        color={isMember ? 'secondary' : 'primary_subtle'}
        variant="solid">
        {isPending && <ButtonIcon icon={Loader} />}
        <ButtonText>
          {isMember ? <Trans>Remove</Trans> : <Trans>Add</Trans>}
        </ButtonText>
      </Button>
    </View>
  )
}
