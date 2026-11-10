import {useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {isNetworkError} from '#/lib/strings/errors'
import {logger} from '#/logger'
import {useProfileShadow} from '#/state/cache/profile-shadow'
import {useGetPost} from '#/state/queries/post'
import {
  useProfileBlockMutationQueue,
  useProfileMuteMutationQueue,
} from '#/state/queries/profile'
import {useRequireAuth, useSession} from '#/state/session'
import {EventStopper} from '#/view/com/util/EventStopper'
import {type ActivityAssociatedPost} from '#/screens/Atmosphere/activityPost'
import {
  type ActivityActor,
  type ActivityGroup,
  type ActivityItem,
} from '#/screens/Atmosphere/types'
import {useDialogControl} from '#/components/Dialog'
import {CodeBrackets_Stroke2_Corner0_Rounded as CodeIcon} from '#/components/icons/Code'
import {DotGrid3x1_Stroke2_Corner0_Rounded as EllipsisIcon} from '#/components/icons/DotGrid'
import {Flag_Stroke2_Corner0_Rounded as FlagIcon} from '#/components/icons/Flag'
import {Mute_Stroke2_Corner0_Rounded as MuteIcon} from '#/components/icons/Mute'
import {
  PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon,
  PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon} from '#/components/icons/Speaker'
import {Loader} from '#/components/Loader'
import * as Menu from '#/components/Menu'
import {BlockDialog} from '#/components/moderation/BlockDialog'
import {useGlobalReportDialogControl} from '#/components/moderation/ReportDialog'
import {
  PostControlButton,
  PostControlButtonIcon,
} from '#/components/PostControls/PostControlButton'
import * as Toast from '#/components/Toast'
import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {ActivityRawResponseDialog} from './ActivityRawResponseDialog'

export function ActivityMenu({
  actor,
  post,
  rawResponse,
}: {
  actor: ActivityActor
  post?: ActivityAssociatedPost
  rawResponse: ActivityItem | ActivityGroup
}) {
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const requireAuth = useRequireAuth()
  const profile = useProfileShadow(actor)
  const [queueMute, queueUnmute] = useProfileMuteMutationQueue(profile)
  const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)
  const blockDialogControl = useDialogControl()
  const rawResponseDialogControl = useDialogControl()
  const reportDialogControl = useGlobalReportDialogControl()
  const getPost = useGetPost()
  const [isReporting, setIsReporting] = useState(false)
  const isSelf = currentAccount?.did === actor.did
  const canMute =
    !isSelf && !profile.viewer?.blocking && !profile.viewer?.mutedByList
  const canBlock = !isSelf && !profile.viewer?.blockingByList
  const canReport = post
    ? !currentAccount || !post.uri.startsWith(`at://${currentAccount.did}/`)
    : !isSelf

  async function onMute() {
    try {
      if (profile.viewer?.muted) {
        await queueUnmute()
        Toast.show(l({message: 'Account unmuted', context: 'toast'}))
      } else {
        await queueMute()
        Toast.show(l({message: 'Account muted', context: 'toast'}))
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        if (!isNetworkError(err)) {
          logger.error('Failed to mute activity account', {safeMessage: err})
        }
        Toast.show(l`Something went wrong. Please try again.`, {type: 'error'})
      }
    }
  }

  async function onBlock() {
    try {
      if (profile.viewer?.blocking) {
        await queueUnblock()
        Toast.show(l({message: 'Account unblocked', context: 'toast'}))
      } else {
        await queueBlock()
        Toast.show(l({message: 'Account blocked', context: 'toast'}))
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        if (!isNetworkError(err)) {
          logger.error('Failed to block activity account', {safeMessage: err})
        }
        Toast.show(l`Something went wrong. Please try again.`, {type: 'error'})
      }
    }
  }

  async function onReport() {
    if (isReporting) return
    if (!post) {
      reportDialogControl.open({
        subject: {...actor, $type: 'app.bsky.actor.defs#profileViewBasic'},
      })
      return
    }

    setIsReporting(true)
    try {
      const view =
        post.view?.uri === post.uri && post.view.cid === post.cid
          ? post.view
          : await getPost({uri: post.uri})
      if (
        view.uri !== post.uri ||
        view.cid !== post.cid ||
        !bsky.matches(app.bsky.feed.post, view.record)
      ) {
        Toast.show(l`Could not load this post. Please try again.`, {
          type: 'error',
        })
        return
      }
      if (view.author.did === currentAccount?.did) return
      reportDialogControl.open({
        subject: {...view, $type: 'app.bsky.feed.defs#postView'},
      })
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        if (!isNetworkError(err)) {
          logger.error('Failed to load activity post for reporting', {
            safeMessage: err,
          })
        }
        Toast.show(l`Could not load this post. Please try again.`, {
          type: 'error',
        })
      }
    } finally {
      setIsReporting(false)
    }
  }

  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root>
        <Menu.Trigger label={isReporting ? l`Loading post…` : l`More options`}>
          {({props}) => (
            <PostControlButton
              {...props}
              label={props.accessibilityLabel}
              testID="atmosphereActivityMenu"
              disabled={isReporting}>
              <PostControlButtonIcon
                icon={isReporting ? Loader : EllipsisIcon}
              />
            </PostControlButton>
          )}
        </Menu.Trigger>
        <Menu.Outer showCancel style={{minWidth: 180}}>
          <Menu.Group>
            {canMute && (
              <Menu.Item
                label={
                  profile.viewer?.muted ? l`Unmute account` : l`Mute account`
                }
                onPress={() => requireAuth(() => void onMute())}>
                <Menu.ItemText>
                  {profile.viewer?.muted ? l`Unmute account` : l`Mute account`}
                </Menu.ItemText>
                <Menu.ItemIcon
                  icon={profile.viewer?.muted ? UnmuteIcon : MuteIcon}
                />
              </Menu.Item>
            )}
            {canBlock && (
              <Menu.Item
                label={
                  profile.viewer?.blocking
                    ? l`Unblock account`
                    : l`Block account`
                }
                onPress={() => requireAuth(() => blockDialogControl.open())}>
                <Menu.ItemText>
                  {profile.viewer?.blocking
                    ? l`Unblock account`
                    : l`Block account`}
                </Menu.ItemText>
                <Menu.ItemIcon
                  icon={
                    profile.viewer?.blocking ? PersonCheckIcon : PersonXIcon
                  }
                />
              </Menu.Item>
            )}
            {canReport && (
              <Menu.Item
                label={post ? l`Report post` : l`Report account`}
                disabled={isReporting}
                destructive
                onPress={() => requireAuth(() => void onReport())}>
                <Menu.ItemText>
                  {post ? l`Report post` : l`Report account`}
                </Menu.ItemText>
                <Menu.ItemIcon icon={FlagIcon} />
              </Menu.Item>
            )}
            <Menu.Item
              label="View raw response"
              onPress={() => rawResponseDialogControl.open()}>
              <Menu.ItemText>View raw response</Menu.ItemText>
              <Menu.ItemIcon icon={CodeIcon} />
            </Menu.Item>
          </Menu.Group>
        </Menu.Outer>
      </Menu.Root>
      <BlockDialog
        control={blockDialogControl}
        profile={profile}
        onBlock={onBlock}
      />
      <ActivityRawResponseDialog
        control={rawResponseDialogControl}
        response={rawResponse}
      />
    </EventStopper>
  )
}
