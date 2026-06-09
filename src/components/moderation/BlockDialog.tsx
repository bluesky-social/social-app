import {useState} from 'react'
import {View} from 'react-native'
import {
  type ChatBskyConvoDefs,
  ChatBskyConvoLeaveConvo,
  ChatBskyGroupRemoveMembers,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/types'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {
  createListMutualGroupsQueryKey,
  useListMutualGroupsQuery,
} from '#/state/queries/messages/list-mutual-groups'
import {useRemoveFromGroupChat} from '#/state/queries/messages/remove-from-group'
import {useSession} from '#/state/session'
import {atoms as a, native, useTheme, web} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import {parseConvoView} from '#/components/dms/util'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {type AnyProfileView} from '#/types/bsky/profile'

type Item = ChatBskyConvoDefs.ConvoView

type BlockDialogProps = {
  control: DialogControlProps
  profile: Shadow<AnyProfileView>
  onBlock: () => Promise<void>
  currentConvoId?: string
}

export function BlockDialog({
  control,
  profile,
  onBlock,
  currentConvoId,
}: BlockDialogProps) {
  return (
    <Dialog.Outer control={control}>
      <View style={[a.relative]}>
        <Dialog.Handle />
        <BlockDialogInner
          control={control}
          profile={profile}
          onBlock={onBlock}
          currentConvoId={currentConvoId}
        />
        <Dialog.Close />
      </View>
    </Dialog.Outer>
  )
}

function BlockDialogInner({
  control,
  profile,
  onBlock,
  currentConvoId,
}: {
  control: DialogControlProps
  profile: Shadow<AnyProfileView>
  onBlock: () => Promise<void>
  currentConvoId?: string
}) {
  const t = useTheme()
  const {t: l} = useLingui()

  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)

  let {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} =
    useListMutualGroupsQuery({
      subject: profile.did,
      enabled: !profile.viewer?.blocking,
    })
  const items: Item[] = data?.pages.flatMap(page => page.convos) ?? []
  const hasMutualGroupChats = items.length > 0

  const onEndReached = async () => {
    if (isFetchingNextPage || !hasNextPage) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more mutual group chats', {message: err})
    }
  }

  const renderItems = ({item}: {item: Item}) => {
    return (
      <MutualGroupChat
        view={item}
        profileDid={profile.did}
        currentConvoId={currentConvoId}
      />
    )
  }

  const listHeader = (
    <View
      style={[t.atoms.bg]}
      onLayout={evt => setHeaderHeight(evt.nativeEvent.layout.height)}>
      <View
        style={[
          hasMutualGroupChats && native([a.pt_2xl, a.px_2xl]),
          a.pb_lg,
          a.gap_sm,
        ]}>
        <Text style={[a.text_2xl, a.font_bold, t.atoms.text]}>
          {profile.viewer?.blocking ? (
            <Trans>Unblock account?</Trans>
          ) : (
            <Trans>Block account?</Trans>
          )}
        </Text>
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          {profile.viewer?.blocking ? (
            <Trans>
              The account will be able to interact with you after unblocking.
            </Trans>
          ) : profile.associated?.labeler ? (
            <Trans>
              Blocking will not prevent labels from being applied on your
              account, but it will stop this account from replying in your
              threads or interacting with you.
            </Trans>
          ) : (
            <Trans>
              Blocked accounts cannot reply in your threads, mention you, or
              otherwise interact with you.
            </Trans>
          )}
        </Text>
      </View>
      {hasMutualGroupChats ? (
        <View style={[web(a.pt_sm), native(a.px_2xl), a.pb_xs, t.atoms.bg]}>
          <Text
            style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_high]}>
            <Trans>Mutual group chats</Trans>
          </Text>
        </View>
      ) : null}
    </View>
  )

  const footer = (
    <View style={[a.w_full, a.gap_sm, a.justify_end]}>
      <Button
        color={profile.viewer?.blocking ? undefined : 'negative'}
        size="large"
        label={profile.viewer?.blocking ? l`Unblock` : l`Block`}
        onPress={() => control.close(() => void onBlock())}>
        <ButtonText>
          {profile.viewer?.blocking ? (
            <Trans>Unblock</Trans>
          ) : (
            <Trans>Block</Trans>
          )}
        </ButtonText>
      </Button>
      <Button
        color="secondary"
        size="large"
        label={l`Close dialog`}
        onPress={() => control.close()}>
        <ButtonText>
          <Trans>Cancel</Trans>
        </ButtonText>
      </Button>
    </View>
  )

  if (isLoading || !hasMutualGroupChats) {
    return (
      <Dialog.ScrollableInner
        label={profile.viewer?.blocking ? l`Unblock` : l`Block`}
        style={[web([{maxWidth: 420}])]}>
        {listHeader}
        {isLoading ? (
          <View style={[a.pb_2xl, a.align_center, a.justify_center]}>
            <Loader size="xl" />
          </View>
        ) : null}
        {footer}
      </Dialog.ScrollableInner>
    )
  }

  return (
    <Dialog.InnerFlatList
      data={items}
      renderItem={renderItems}
      ListHeaderComponent={listHeader}
      stickyHeaderIndices={[0]}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={[a.py_lg, a.align_center, a.justify_center]}>
            <Loader size="lg" />
          </View>
        ) : null
      }
      footer={
        <Dialog.FlatListFooter
          onLayout={evt => setFooterHeight(evt.nativeEvent.layout.height)}>
          {footer}
        </Dialog.FlatListFooter>
      }
      contentContainerStyle={[a.gap_0, {paddingBottom: footerHeight}]}
      scrollIndicatorInsets={{top: headerHeight, bottom: footerHeight}}
      onEndReached={() => void onEndReached()}
      onEndReachedThreshold={0.5}
      style={[web([{maxWidth: 420}])]}
    />
  )
}

function MutualGroupChat({
  view,
  profileDid,
  currentConvoId,
}: {
  view: ChatBskyConvoDefs.ConvoView
  profileDid: string
  currentConvoId?: string
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const queryClient = useQueryClient()

  const convo = parseConvoView(view, currentAccount?.did)

  const {mutate: leaveConvo, isPending: isLeavePending} = useLeaveConvo(
    convo?.view.id,
    {
      onSuccess: () => {
        Toast.show(l`Left group chat.`)
        void queryClient.invalidateQueries({
          queryKey: createListMutualGroupsQueryKey({subject: profileDid}),
        })
      },
      onError: error => {
        logger.error('Error leaving group chat', {message: error})
        let errorMessage = l`Could not leave chat.`
        if (isNetworkError(error)) {
          errorMessage = l`A network error occurred. Please check your internet connection.`
        } else if (error instanceof ChatBskyConvoLeaveConvo.InvalidConvoError) {
          errorMessage = l`Chat not found.`
        } else if (
          error instanceof ChatBskyConvoLeaveConvo.OwnerCannotLeaveError
        ) {
          errorMessage = l`Chat owners cannot leave a group chat.`
        }
        Toast.show(errorMessage, {type: 'error'})
      },
    },
  )

  const {mutate: removeMembers, isPending: isRemovePending} =
    useRemoveFromGroupChat(convo?.view.id, {
      onSuccess: () => {
        Toast.show(l`Member removed from group chat.`)
        void queryClient.invalidateQueries({
          queryKey: createListMutualGroupsQueryKey({subject: profileDid}),
        })
      },
      onError: error => {
        logger.error('Error removing group chat member', {message: error})
        let errorMessage = l`Could not remove member.`
        if (isNetworkError(error)) {
          errorMessage = l`A network error occurred. Please check your internet connection.`
        } else if (
          error instanceof ChatBskyGroupRemoveMembers.InvalidConvoError
        ) {
          errorMessage = l`Chat not found.`
        } else if (
          error instanceof ChatBskyGroupRemoveMembers.InsufficientRoleError
        ) {
          errorMessage = l`You must be a chat owner to remove a member.`
        }
        Toast.show(errorMessage, {type: 'error'})
      },
    })

  if (!convo || convo.kind !== 'group') return null

  const owner = convo.primaryMember
  const isViewerOwner = owner?.did != null && owner.did === currentAccount?.did
  const isProfileOwner = owner?.did != null && owner.did === profileDid
  const isCurrentConvo = view.id === currentConvoId

  return (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.gap_sm,
        a.justify_between,
        a.py_sm,
        native(a.px_2xl),
      ]}>
      <View style={[a.flex_row, a.align_center, a.gap_sm]}>
        <AvatarBubbles profiles={convo.members} size={40} />
        <View>
          <Text
            style={[a.text_md, a.font_semi_bold, a.leading_snug, t.atoms.text]}>
            {convo.details.name}
          </Text>
          {isViewerOwner ? (
            <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
              <Trans>You own this chat</Trans>
            </Text>
          ) : isProfileOwner ? (
            <Text style={[a.text_xs, t.atoms.text_contrast_medium]}>
              <Trans>They own this chat</Trans>
            </Text>
          ) : null}
        </View>
      </View>
      {isViewerOwner ? (
        <Button
          color="negative_subtle"
          disabled={isRemovePending}
          label={l`Kick member`}
          size="small"
          onPress={() => removeMembers({members: [profileDid]})}>
          <ButtonText>
            <Trans>Kick member</Trans>
          </ButtonText>
          {isRemovePending ? <ButtonIcon icon={Loader} /> : null}
        </Button>
      ) : isCurrentConvo ? (
        <Text style={[a.text_sm, a.font_medium, t.atoms.text_contrast_medium]}>
          <Trans>Current chat</Trans>
        </Text>
      ) : (
        <Button
          color="secondary"
          disabled={isLeavePending}
          label={l`Leave chat`}
          size="small"
          onPress={() => {
            leaveConvo()
          }}>
          <ButtonText>
            <Trans>Leave chat</Trans>
          </ButtonText>
          {isLeavePending ? <ButtonIcon icon={Loader} /> : null}
        </Button>
      )}
    </View>
  )
}
