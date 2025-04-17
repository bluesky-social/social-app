import {useCallback, useMemo} from 'react'
import {View} from 'react-native'
import {type AppBskyGraphDefs, type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from '#/lib/strings/errors'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  getMembership,
  type ListMembersip,
  useDangerousListMembershipsQuery,
  useListMembershipAddMutation,
  useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships'
import * as Toast from '#/view/com/util/Toast'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {
  type ProfileItem,
  SearchablePeopleList,
} from '#/components/dialogs/SearchablePeopleList'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import type * as bsky from '#/types/bsky'

export function ListAddRemoveUsersDialog({
  control,
  list,
  onChange,
}: {
  control: Dialog.DialogControlProps
  list: AppBskyGraphDefs.ListView
  onChange?: (
    type: 'add' | 'remove',
    profile: bsky.profile.AnyProfileView,
  ) => void | undefined
}) {
  return (
    <Dialog.Outer control={control} testID="listAddRemoveUsersDialog">
      <Dialog.Handle />
      <DialogInner list={list} onChange={onChange} />
    </Dialog.Outer>
  )
}

function DialogInner({
  list,
  onChange,
}: {
  list: AppBskyGraphDefs.ListView
  onChange?: (
    type: 'add' | 'remove',
    profile: bsky.profile.AnyProfileView,
  ) => void | undefined
}) {
  const {_} = useLingui()
  const moderationOpts = useModerationOpts()
  const {data: memberships} = useDangerousListMembershipsQuery()

  const renderProfileCard = useCallback(
    (item: ProfileItem) => {
      return (
        <UserResult
          profile={item.profile}
          onChange={onChange}
          memberships={memberships}
          list={list}
          moderationOpts={moderationOpts}
        />
      )
    },
    [onChange, memberships, list, moderationOpts],
  )

  return (
    <SearchablePeopleList
      title={_(msg`Add people to list`)}
      renderProfileCard={renderProfileCard}
    />
  )
}

function UserResult({
  profile,
  list,
  memberships,
  onChange,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  list: AppBskyGraphDefs.ListView
  memberships: ListMembersip[] | undefined
  onChange?: (
    type: 'add' | 'remove',
    profile: bsky.profile.AnyProfileView,
  ) => void | undefined
  moderationOpts?: ModerationOpts
}) {
  const {_} = useLingui()
  const membership = useMemo(
    () => getMembership(memberships, list.uri, profile.did),
    [memberships, list.uri, profile.did],
  )
  const {mutate: listMembershipAdd, isPending: isAddingPending} =
    useListMembershipAddMutation({
      onSuccess: () => {
        Toast.show(_(msg`Added to list`))
        onChange?.('add', profile)
      },
      onError: e => Toast.show(cleanError(e), 'xmark'),
    })
  const {mutate: listMembershipRemove, isPending: isRemovingPending} =
    useListMembershipRemoveMutation({
      onSuccess: () => {
        Toast.show(_(msg`Removed from list`))
        onChange?.('remove', profile)
      },
      onError: e => Toast.show(cleanError(e), 'xmark'),
    })
  const isMutating = isAddingPending || isRemovingPending

  const onToggleMembership = useCallback(() => {
    if (typeof membership === 'undefined') {
      return
    }
    if (membership === false) {
      listMembershipAdd({
        listUri: list.uri,
        actorDid: profile.did,
      })
    } else {
      listMembershipRemove({
        listUri: list.uri,
        actorDid: profile.did,
        membershipUri: membership,
      })
    }
  }, [list, profile, membership, listMembershipAdd, listMembershipRemove])

  if (!moderationOpts) return null

  return (
    <View style={[a.flex_1, a.py_sm, a.px_lg]}>
      <ProfileCard.Header>
        <ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} />
        <View style={[a.flex_1]}>
          <ProfileCard.Name profile={profile} moderationOpts={moderationOpts} />
          <ProfileCard.Handle profile={profile} />
        </View>
        {membership !== undefined && (
          <Button
            label={
              membership === false
                ? _(msg`Add user to list`)
                : _(msg`Remove user from list`)
            }
            onPress={onToggleMembership}
            disabled={isMutating}
            size="small"
            variant="solid"
            color="secondary">
            {isMutating ? (
              <ButtonIcon icon={Loader} />
            ) : (
              <ButtonText>
                {membership === false ? (
                  <Trans>Add</Trans>
                ) : (
                  <Trans>Remove</Trans>
                )}
              </ButtonText>
            )}
          </Button>
        )}
      </ProfileCard.Header>
    </View>
  )
}
