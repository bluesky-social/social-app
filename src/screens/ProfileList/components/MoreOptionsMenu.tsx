import {type AppBskyActorDefs, AppBskyGraphDefs, AtUri} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {
  useListBlockMutation,
  useListDeleteMutation,
  useListMuteMutation,
} from '#/state/queries/list'
import {useRemoveFeedMutation} from '#/state/queries/preferences'
import {useSession} from '#/state/session'
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
import {CreateOrEditListDialog} from '#/components/dialogs/lists/CreateOrEditListDialog'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ShareIcon} from '#/components/icons/ArrowOutOfBox'
import {ChainLink_Stroke2_Corner0_Rounded as ChainLink} from '#/components/icons/ChainLink'
import {DotGrid_Stroke2_Corner0_Rounded as DotGridIcon} from '#/components/icons/DotGrid'
import {PencilLine_Stroke2_Corner0_Rounded as PencilLineIcon} from '#/components/icons/Pencil'
import {PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon} from '#/components/icons/Person'
import {Pin_Stroke2_Corner0_Rounded as PinIcon} from '#/components/icons/Pin'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
import * as Menu from '#/components/Menu'
import {
  ReportDialog,
  useReportDialogControl,
} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import {IS_WEB} from '#/env'

export function MoreOptionsMenu({
  list,
  savedFeedConfig,
}: {
  list: AppBskyGraphDefs.ListView
  savedFeedConfig?: AppBskyActorDefs.SavedFeed
}) {
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const editListDialogControl = useDialogControl()
  const deleteListPromptControl = useDialogControl()
  const reportDialogControl = useReportDialogControl()
  const navigation = useNavigation<NavigationProp>()

  const {mutateAsync: removeSavedFeed} = useRemoveFeedMutation()
  const {mutateAsync: deleteList} = useListDeleteMutation()
  const {mutateAsync: muteList} = useListMuteMutation()
  const {mutateAsync: blockList} = useListBlockMutation()

  const isCurateList = list.purpose === AppBskyGraphDefs.CURATELIST
  const isModList = list.purpose === AppBskyGraphDefs.MODLIST
  const isBlocking = !!list.viewer?.blocked
  const isMuting = !!list.viewer?.muted
  const isPinned = Boolean(savedFeedConfig?.pinned)
  const isOwner = currentAccount?.did === list.creator.did

  const onPressShare = () => {
    const {rkey} = new AtUri(list.uri)
    const url = toShareUrl(`/profile/${list.creator.did}/lists/${rkey}`)
    shareUrl(url)
  }

  const onRemoveFromSavedFeeds = async () => {
    if (!savedFeedConfig) return
    try {
      await removeSavedFeed(savedFeedConfig)
      Toast.show(_(msg`Removed from your feeds`))
    } catch (e) {
      Toast.show(_(msg`There was an issue contacting the server`), {
        type: 'error',
      })
      logger.error('Failed to remove pinned list', {message: e})
    }
  }

  const onPressDelete = async () => {
    await deleteList({uri: list.uri})

    if (savedFeedConfig) {
      await removeSavedFeed(savedFeedConfig)
    }

    Toast.show(_(msg({message: 'List deleted', context: 'toast'})))
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }

  const onUnpinModList = async () => {
    try {
      if (!savedFeedConfig) return
      await removeSavedFeed(savedFeedConfig)
      Toast.show(_(msg`Unpinned list`))
    } catch {
      Toast.show(_(msg`Failed to unpin list`), {
        type: 'error',
      })
    }
  }

  const onUnsubscribeMute = async () => {
    try {
      await muteList({uri: list.uri, mute: false})
      Toast.show(_(msg({message: 'List unmuted', context: 'toast'})))
      logger.metric(
        'moderation:unsubscribedFromList',
        {listType: 'mute'},
        {statsig: true},
      )
    } catch {
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    }
  }

  const onUnsubscribeBlock = async () => {
    try {
      await blockList({uri: list.uri, block: false})
      Toast.show(_(msg({message: 'List unblocked', context: 'toast'})))
      logger.metric(
        'moderation:unsubscribedFromList',
        {listType: 'block'},
        {statsig: true},
      )
    } catch {
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    }
  }

  return (
    <>
      <Menu.Root>
        <Menu.Trigger label={_(msg`More options`)}>
          {({props}) => (
            <Button
              label={props.accessibilityLabel}
              testID="moreOptionsBtn"
              size="small"
              color="secondary"
              shape="round"
              {...props}>
              <ButtonIcon icon={DotGridIcon} />
            </Button>
          )}
        </Menu.Trigger>
        <Menu.Outer>
          <Menu.Group>
            <Menu.Item
              label={IS_WEB ? _(msg`Copy link to list`) : _(msg`Share via...`)}
              onPress={onPressShare}>
              <Menu.ItemText>
                {IS_WEB ? (
                  <Trans>Copy link to list</Trans>
                ) : (
                  <Trans>Share via...</Trans>
                )}
              </Menu.ItemText>
              <Menu.ItemIcon
                position="right"
                icon={IS_WEB ? ChainLink : ShareIcon}
              />
            </Menu.Item>
            {savedFeedConfig && (
              <Menu.Item
                label={_(msg`Remove from my feeds`)}
                onPress={onRemoveFromSavedFeeds}>
                <Menu.ItemText>
                  <Trans>Remove from my feeds</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={TrashIcon} />
              </Menu.Item>
            )}
          </Menu.Group>

          <Menu.Divider />

          {isOwner ? (
            <Menu.Group>
              <Menu.Item
                label={_(msg`Edit list details`)}
                onPress={editListDialogControl.open}>
                <Menu.ItemText>
                  <Trans>Edit list details</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={PencilLineIcon} />
              </Menu.Item>
              <Menu.Item
                label={_(msg`Delete list`)}
                onPress={deleteListPromptControl.open}>
                <Menu.ItemText>
                  <Trans>Delete list</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={TrashIcon} />
              </Menu.Item>
            </Menu.Group>
          ) : (
            <Menu.Group>
              <Menu.Item
                label={_(msg`Report list`)}
                onPress={reportDialogControl.open}>
                <Menu.ItemText>
                  <Trans>Report list</Trans>
                </Menu.ItemText>
                <Menu.ItemIcon position="right" icon={WarningIcon} />
              </Menu.Item>
            </Menu.Group>
          )}

          {isModList && isPinned && (
            <>
              <Menu.Divider />
              <Menu.Group>
                <Menu.Item
                  label={_(msg`Unpin moderation list`)}
                  onPress={onUnpinModList}>
                  <Menu.ItemText>
                    <Trans>Unpin moderation list</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={PinIcon} />
                </Menu.Item>
              </Menu.Group>
            </>
          )}

          {isCurateList && (isBlocking || isMuting) && (
            <>
              <Menu.Divider />
              <Menu.Group>
                {isBlocking && (
                  <Menu.Item
                    label={_(msg`Unblock list`)}
                    onPress={onUnsubscribeBlock}>
                    <Menu.ItemText>
                      <Trans>Unblock list</Trans>
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={PersonCheckIcon} />
                  </Menu.Item>
                )}
                {isMuting && (
                  <Menu.Item
                    label={_(msg`Unmute list`)}
                    onPress={onUnsubscribeMute}>
                    <Menu.ItemText>
                      <Trans>Unmute list</Trans>
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={UnmuteIcon} />
                  </Menu.Item>
                )}
              </Menu.Group>
            </>
          )}
        </Menu.Outer>
      </Menu.Root>

      <CreateOrEditListDialog control={editListDialogControl} list={list} />

      <Prompt.Basic
        control={deleteListPromptControl}
        title={_(msg`Delete this list?`)}
        description={_(
          msg`If you delete this list, you won't be able to recover it.`,
        )}
        onConfirm={onPressDelete}
        confirmButtonCta={_(msg`Delete`)}
        confirmButtonColor="negative"
      />

      <ReportDialog
        control={reportDialogControl}
        subject={{
          ...list,
          $type: 'app.bsky.graph.defs#listView',
        }}
      />
    </>
  )
}
