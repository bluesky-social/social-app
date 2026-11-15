import {useState} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {plural} from '@lingui/core/macro'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {isNetworkError} from '#/lib/strings/errors'
import {matchXrpcError} from '#/lib/xrpc-error'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/types'
import {useLeaveConvo} from '#/state/queries/messages/leave-conversation'
import {
  createListMutualGroupsQueryKey,
  useListMutualGroupsQuery,
} from '#/state/queries/messages/list-mutual-groups'
import {useRemoveFromGroupChat} from '#/state/queries/messages/remove-from-group'
import {useSession} from '#/state/session'
import {atoms as a, platform, useBreakpoints, useTheme, web} from '#/alf'
import {AvatarBubbles} from '#/components/AvatarBubbles'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import {parseConvoView} from '#/components/dms/util'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {chat} from '#/lexicons'
import {type AnyProfileView} from '#/types/bsky/profile'

type Item = chat.bsky.convo.defs.ConvoView

/**
 * How many mutual group chats to show in the block dialog itself. The rest
 * are behind a "See more" button that opens the full list.
 */
const MAX_PREVIEW_GROUP_CHATS = 3

type BlockDialogProps = {
  control: DialogControlProps
  profile: Shadow<AnyProfileView>
  onBlock: () => Promise<void>
  currentConvoId?: string
}

/**
 * Props shared by every mutual group chat row, wherever it's rendered.
 */
type MutualGroupChatRowProps = {
  profileDid: string
  currentConvoId?: string
  onOptimisticallyRemoveConvo: (convoId: string) => void
  onRestoreConvo: (convoId: string) => void
}

export function BlockDialog({
  control,
  profile,
  onBlock,
  currentConvoId,
}: BlockDialogProps) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <BlockDialogInner
        control={control}
        profile={profile}
        onBlock={onBlock}
        currentConvoId={currentConvoId}
      />
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
  const mutualGroupChatsControl = Dialog.useDialogControl()

  /*
   * Optimistically hide convos the viewer has left or removed the profile
   * from, before the query refetches. We don't expect many items here, so a
   * simple filter is fine.
   */
  const [removedConvoIds, setRemovedConvoIds] = useState<Set<string>>(
    () => new Set(),
  )
  const rowProps: MutualGroupChatRowProps = {
    profileDid: profile.did,
    currentConvoId,
    onOptimisticallyRemoveConvo: (convoId: string) => {
      setRemovedConvoIds(prev => {
        const next = new Set(prev)
        next.add(convoId)
        return next
      })
    },
    onRestoreConvo: (convoId: string) => {
      setRemovedConvoIds(prev => {
        const next = new Set(prev)
        next.delete(convoId)
        return next
      })
    },
  }

  const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} =
    useListMutualGroupsQuery({
      subject: profile.did,
      enabled: !profile.viewer?.blocking,
    })
  const items: Item[] = (data?.pages.flatMap(page => page.convos) ?? []).filter(
    item => !removedConvoIds.has(item.id),
  )
  const previewItems = items.slice(0, MAX_PREVIEW_GROUP_CHATS)
  const hiddenCount = items.length - previewItems.length

  const onEndReached = async () => {
    if (isFetchingNextPage || !hasNextPage) return
    try {
      await fetchNextPage()
    } catch (err) {
      logger.error('Failed to load more mutual group chats', {message: err})
    }
  }

  return (
    <>
      <Dialog.ScrollableInner
        label={profile.viewer?.blocking ? l`Unblock` : l`Block`}
        style={web({maxWidth: 420})}>
        <View style={[a.gap_sm]}>
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

        {previewItems.length > 0 && (
          <View style={[a.pt_xl, a.gap_sm]}>
            <Text
              style={[a.text_sm, a.font_semi_bold, t.atoms.text_contrast_high]}>
              <Trans>Mutual group chats</Trans>
            </Text>
            <View
              style={[
                a.border,
                a.rounded_md,
                a.overflow_hidden,
                t.atoms.border_contrast_low,
              ]}>
              {previewItems.map((item, index) => (
                <MutualGroupChat
                  key={item.id}
                  view={item}
                  {...rowProps}
                  style={[
                    a.p_md,
                    index > 0 && [a.border_t, t.atoms.border_contrast_low],
                  ]}
                />
              ))}
              {(hiddenCount > 0 || hasNextPage) && (
                <SeeMoreButton
                  label={
                    hasNextPage
                      ? l`See more`
                      : plural(hiddenCount, {
                          one: 'See # more',
                          other: 'See # more',
                        })
                  }
                  onPress={() => mutualGroupChatsControl.open()}
                />
              )}
            </View>
          </View>
        )}

        <View style={[a.pt_2xl, a.gap_sm]}>
          <Button
            disabled={isLoading}
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
            {isLoading ? <ButtonIcon icon={Loader} /> : null}
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
        <Dialog.Close />
      </Dialog.ScrollableInner>

      <MutualGroupChatsDialog
        control={mutualGroupChatsControl}
        items={items}
        rowProps={rowProps}
        isFetchingNextPage={isFetchingNextPage}
        onEndReached={() => void onEndReached()}
      />
    </>
  )
}

function SeeMoreButton({label, onPress}: {label: string; onPress: () => void}) {
  const t = useTheme()
  return (
    <Button
      label={label}
      onPress={onPress}
      style={[a.w_full, a.border_t, t.atoms.border_contrast_low]}>
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.align_center,
            a.p_md,
            (hovered || pressed) && t.atoms.bg_contrast_25,
          ]}>
          <Text
            style={[a.text_md, a.font_medium, {color: t.palette.primary_500}]}>
            {label}
          </Text>
        </View>
      )}
    </Button>
  )
}

/**
 * Every mutual group chat, opened from the block dialog when there are more
 * than fit in its preview.
 */
function MutualGroupChatsDialog({
  control,
  ...props
}: {
  control: DialogControlProps
  items: Item[]
  rowProps: MutualGroupChatRowProps
  isFetchingNextPage: boolean
  onEndReached: () => void
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{fullHeight: true}}>
      <Dialog.Handle />
      <MutualGroupChatsList {...props} />
    </Dialog.Outer>
  )
}

function MutualGroupChatsList({
  items,
  rowProps,
  isFetchingNextPage,
  onEndReached,
}: {
  items: Item[]
  rowProps: MutualGroupChatRowProps
  isFetchingNextPage: boolean
  onEndReached: () => void
}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtMobile} = useBreakpoints()
  const {close} = Dialog.useDialogContext()

  const listHeader = (
    <View
      style={[
        a.flex_row,
        a.align_center,
        a.justify_between,
        a.pb_lg,
        t.atoms.bg,
        gtMobile ? a.pt_2xl : a.pt_xl,
      ]}>
      <Text style={[a.text_lg, a.font_semi_bold]}>
        <Trans>Mutual group chats</Trans>
      </Text>
      <Button
        label={l`Close`}
        onPress={() => close()}
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
      data={items}
      renderItem={({item, index}: {item: Item; index: number}) => (
        <MutualGroupChat
          view={item}
          {...rowProps}
          style={[
            a.py_md,
            index > 0 && [a.border_t, t.atoms.border_contrast_low],
          ]}
        />
      )}
      keyExtractor={(item: Item) => item.id}
      ListHeaderComponent={listHeader}
      stickyHeaderIndices={web([0])}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={[a.py_lg, a.align_center, a.justify_center]}>
            <Loader size="lg" />
          </View>
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      webInnerContentContainerStyle={[a.py_0]}
      webInnerStyle={[a.py_0, {maxWidth: 500, minWidth: 200}]}
      style={platform({
        web: [a.px_2xl, a.pb_md],
        native: [a.px_2xl, a.pt_lg],
      })}
    />
  )
}

function MutualGroupChat({
  view,
  profileDid,
  currentConvoId,
  onOptimisticallyRemoveConvo,
  onRestoreConvo,
  style,
}: MutualGroupChatRowProps & {
  view: chat.bsky.convo.defs.ConvoView
  style?: StyleProp<ViewStyle>
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
        onRestoreConvo(view.id)
        logger.error('Error leaving group chat', {message: error})
        let errorMessage = l`Could not leave chat.`
        if (isNetworkError(error)) {
          errorMessage = l`A network error occurred. Please check your internet connection.`
        } else {
          switch (matchXrpcError(error, chat.bsky.convo.leaveConvo)) {
            case 'InvalidConvo':
              errorMessage = l`Chat not found.`
              break
            case 'OwnerCannotLeave':
              errorMessage = l`Chat owners cannot leave a group chat.`
              break
          }
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
        onRestoreConvo(view.id)
        logger.error('Error removing group chat member', {message: error})
        let errorMessage = l`Could not remove member.`
        if (isNetworkError(error)) {
          errorMessage = l`A network error occurred. Please check your internet connection.`
        } else {
          switch (matchXrpcError(error, chat.bsky.group.removeMembers)) {
            case 'InvalidConvo':
              errorMessage = l`Chat not found.`
              break
            case 'InsufficientRole':
              errorMessage = l`You must be a chat owner to remove a member.`
              break
          }
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
      style={[a.flex_row, a.align_center, a.gap_sm, a.justify_between, style]}>
      <View style={[a.flex_1, a.flex_row, a.align_center, a.gap_sm]}>
        <AvatarBubbles profiles={convo.members} size={40} />
        <View style={[a.flex_1]}>
          <Text style={[a.text_md, a.font_semi_bold]} emoji numberOfLines={1}>
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
          label={l`Remove member`}
          size="small"
          onPress={() => {
            onOptimisticallyRemoveConvo(view.id)
            removeMembers({members: [profileDid]})
          }}>
          <ButtonText>
            <Trans>Remove member</Trans>
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
            onOptimisticallyRemoveConvo(view.id)
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
