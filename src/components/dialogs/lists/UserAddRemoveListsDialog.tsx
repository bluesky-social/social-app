import {useCallback, useMemo, useState} from 'react'
import {useWindowDimensions, View} from 'react-native'
import {type AppBskyGraphDefs, type ModerationOpts} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {useModerationOpts} from '#/state/preferences/moderation-opts'
import {
  getMembership,
  type ListMembersip,
  useDangerousListMembershipsQuery,
  useListMembershipAddMutation,
  useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships'
import {useMyListsQuery} from '#/state/queries/my-lists'
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
import * as Toast from '#/view/com/util/Toast'
import {UserAvatar} from '#/view/com/util/UserAvatar'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {BulletList_Stroke2_Corner0_Rounded as ListIcon} from '#/components/icons/BulletList'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
import type * as bsky from '#/types/bsky'

export function UserAddRemoveListsDialog({
  control,
  profile,
  onChange,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  onChange?: (
    type: 'add' | 'remove',
    list: AppBskyGraphDefs.ListView,
  ) => void | undefined
}) {
  const {height} = useWindowDimensions()
  return (
    <Dialog.Outer
      control={control}
      testID="listAddRemoveUsersDialog"
      nativeOptions={{minHeight: height / 2}}>
      <DialogInner profile={profile} onChange={onChange} />
    </Dialog.Outer>
  )
}

const LOADING = {type: 'loading', _reactKey: '__loading__'} as const
const EMPTY = {type: 'empty', _reactKey: '__empty__'} as const
const ERROR_ITEM = {type: 'error', _reactKey: '__error__'} as const

type ListItem =
  | typeof LOADING
  | typeof EMPTY
  | typeof ERROR_ITEM
  | {
      type: 'section-header'
      title: string
      _reactKey: string
    }
  | {
      type: 'list'
      list: AppBskyGraphDefs.ListView
    }

function DialogInner({
  profile,
  onChange,
}: {
  profile: bsky.profile.AnyProfileView
  onChange?: (
    type: 'add' | 'remove',
    list: AppBskyGraphDefs.ListView,
  ) => void | undefined
}) {
  const t = useTheme()
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const moderationOpts = useModerationOpts()
  const [headerHeight, setHeaderHeight] = useState(50)
  const {data, isPending, isError, error} = useMyListsQuery('all')
  const {data: memberships} = useDangerousListMembershipsQuery()
  const isEmpty = !isPending && !data?.length

  const items = useMemo(() => {
    let _items: ListItem[] = []
    if (isError && isEmpty) {
      _items = _items.concat([ERROR_ITEM])
    }
    if (isPending || !moderationOpts) {
      _items = _items.concat([LOADING])
    } else if (isEmpty) {
      _items = _items.concat([EMPTY])
    } else if (data) {
      const curateLists = data.filter(
        list => list.purpose === 'app.bsky.graph.defs#curatelist',
      )
      const starterPacks = data.filter(
        list => list.purpose === 'app.bsky.graph.defs#referencelist',
      )
      const modLists = data.filter(
        list => list.purpose === 'app.bsky.graph.defs#modlist',
      )
      if (curateLists.length > 0) {
        _items = _items.concat(
          {
            type: 'section-header',
            title: _(msg`User lists`),
            _reactKey: 'curatelist',
          },
          curateLists.map(list => ({type: 'list', list})),
        )
      }
      if (starterPacks.length > 0) {
        _items = _items.concat(
          {
            type: 'section-header',
            title: _(msg`Starter packs`),
            _reactKey: 'referencelist',
          },
          starterPacks.map(list => ({type: 'list', list})),
        )
      }
      if (modLists.length > 0) {
        _items = _items.concat(
          {
            type: 'section-header',
            title: _(msg`Moderation lists`),
            _reactKey: 'modlist',
          },
          modLists.map(list => ({type: 'list', list})),
        )
      }
    }
    return _items
  }, [isError, isEmpty, isPending, moderationOpts, data, _])

  const renderItem = useCallback(
    ({item}: {item: ListItem}) => {
      switch (item.type) {
        case 'empty': {
          return (
            <View
              style={[a.flex_1, a.align_center, a.gap_sm, a.px_xl, a.pt_xl]}>
              <View
                style={[
                  a.align_center,
                  a.justify_center,
                  a.rounded_full,
                  t.atoms.bg_contrast_25,
                  {
                    width: 32,
                    height: 32,
                  },
                ]}>
                <ListIcon size="md" fill={t.atoms.text_contrast_low.color} />
              </View>
              <Text
                style={[
                  a.text_center,
                  a.flex_1,
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                  {
                    maxWidth: 200,
                  },
                ]}>
                <Trans>You have no lists.</Trans>
              </Text>
            </View>
          )
        }
        case 'error':
          return <ErrorMessage message={cleanError(error)} />
        case 'loading':
          return (
            <View style={[a.flex_1, a.align_center, a.py_5xl]}>
              <Loader />
            </View>
          )
        case 'section-header':
          return (
            <View
              style={[
                a.flex_1,
                a.px_lg,
                a.py_xs,
                t.atoms.bg_contrast_25,
                a.border_b,
                t.atoms.border_contrast_low,
              ]}>
              <Text
                style={[a.text_sm, a.font_bold, t.atoms.text_contrast_medium]}>
                {item.title}
              </Text>
            </View>
          )
        case 'list':
          return (
            <ListRow
              list={item.list}
              profile={profile}
              onChange={onChange}
              memberships={memberships}
              moderationOpts={moderationOpts}
            />
          )
      }
      return null
    },
    [t, error, memberships, onChange, profile, moderationOpts],
  )

  const renderCloseButton = useCallback(
    () => (
      <Button
        label={_(msg`Close`)}
        onPress={() => control.close()}
        size="small"
        color="secondary"
        shape="round"
        variant="ghost"
        style={[a.mr_xs]}>
        <ButtonIcon icon={XIcon} size="md" />
      </Button>
    ),
    [control, _],
  )

  return (
    <Dialog.InnerFlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={[web(a.px_0)]}
      webInnerStyle={[web({minHeight: '80vh'})]}
      webInnerContentContainerStyle={[web(a.py_0)]}
      contentContainerStyle={[web(a.pb_xl)]}
      stickyHeaderIndices={[0]}
      scrollIndicatorInsets={{top: headerHeight}}
      ListHeaderComponent={
        <Dialog.Header
          onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}
          renderRight={renderCloseButton}>
          <Dialog.HeaderText style={[a.pl_lg, a.pr_5xl, a.text_left, a.flex_1]}>
            <Trans>
              Add{' '}
              {sanitizeDisplayName(
                profile.displayName || sanitizeHandle(profile.handle),
              )}{' '}
              to lists
            </Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }
    />
  )
}

function keyExtractor(item: ListItem) {
  return item.type === 'list' ? item.list.uri : item._reactKey
}

function ListRow({
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
    list: AppBskyGraphDefs.ListView,
  ) => void | undefined
  moderationOpts?: ModerationOpts
}) {
  const t = useTheme()
  const {_} = useLingui()
  const membership = useMemo(
    () => getMembership(memberships, list.uri, profile.did),
    [memberships, list.uri, profile.did],
  )
  const {mutate: listMembershipAdd, isPending: isAddingPending} =
    useListMembershipAddMutation({
      onSuccess: () => {
        Toast.show(_(msg`Added to list`))
        onChange?.('add', list)
      },
      onError: e => Toast.show(cleanError(e), 'xmark'),
    })
  const {mutate: listMembershipRemove, isPending: isRemovingPending} =
    useListMembershipRemoveMutation({
      onSuccess: () => {
        Toast.show(_(msg`Removed from list`))
        onChange?.('remove', list)
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
    <View
      style={[
        a.flex_1,
        a.py_md,
        a.px_lg,
        a.border_b,
        t.atoms.border_contrast_low,
      ]}>
      <ProfileCard.Header>
        <UserAvatar size={40} avatar={list.avatar} type="list" />
        <View style={[a.mb_2xs, a.flex_1]}>
          <Text
            emoji
            style={[a.text_md, a.font_bold, a.leading_snug, a.self_start]}
            numberOfLines={1}>
            {sanitizeDisplayName(list.name)}
          </Text>
          <Text
            emoji
            style={[a.leading_snug, t.atoms.text_contrast_medium]}
            numberOfLines={1}>
            {list.purpose === 'app.bsky.graph.defs#curatelist' && (
              <Trans>User list</Trans>
            )}
            {list.purpose === 'app.bsky.graph.defs#modlist' && (
              <Trans>Moderation list</Trans>
            )}
          </Text>
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
