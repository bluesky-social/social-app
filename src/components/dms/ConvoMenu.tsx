import {memo, useCallback} from 'react'
import {Keyboard, View} from 'react-native'
import {type ModerationCause} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'
import {useQueryClient} from '@tanstack/react-query'

import {type NavigationProp} from '#/lib/routes/types'
import {type Shadow} from '#/state/cache/types'
import {
  useConvoQuery,
  useMarkAsReadMutation,
} from '#/state/queries/messages/conversation'
import {useMuteConvo} from '#/state/queries/messages/mute-conversation'
import {
  unstableCacheProfileView,
  useProfileBlockMutationQueue,
} from '#/state/queries/profile'
import {useSession} from '#/state/session'
import {type ViewStyleProp} from '#/alf'
import {atoms as a} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {AfterReportConversationDialog} from '#/components/dms/AfterReportConversationDialog'
import {AfterReportDialog} from '#/components/dms/AfterReportDialog'
import {BlockedByListDialog} from '#/components/dms/BlockedByListDialog'
import {LeaveConvoPrompt} from '#/components/dms/LeaveConvoPrompt'
import {
  type ConvoWithDetails,
  getConvoReportSubject,
} from '#/components/dms/util'
import {ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon} from '#/components/icons/ArrowBoxLeft'
import {Bubble_Stroke2_Corner2_Rounded as BubbleIcon} from '#/components/icons/Bubble'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontalIcon} from '#/components/icons/DotGrid'
import {Flag_Stroke2_Corner0_Rounded as Flag} from '#/components/icons/Flag'
import {Mute_Stroke2_Corner0_Rounded as Mute} from '#/components/icons/Mute'
import {
  Person_Stroke2_Corner0_Rounded as Person,
  PersonCheck_Stroke2_Corner0_Rounded as PersonCheck,
  PersonX_Stroke2_Corner0_Rounded as PersonX,
} from '#/components/icons/Person'
import {SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute} from '#/components/icons/Speaker'
import * as Menu from '#/components/Menu'
import {ReportDialog} from '#/components/moderation/ReportDialog'
import * as Prompt from '#/components/Prompt'
import * as Toast from '#/components/Toast'
import type * as bsky from '#/types/bsky'

let ConvoMenu = ({
  convo,
  profile,
  control,
  currentScreen,
  showMarkAsRead,
  hideTrigger,
  blockInfo,
  style,
}: {
  convo: ConvoWithDetails
  profile: Shadow<bsky.profile.AnyProfileView>
  control?: Menu.MenuControlProps
  currentScreen: 'list' | 'conversation'
  showMarkAsRead?: boolean
  hideTrigger?: boolean
  blockInfo: {
    listBlocks: ModerationCause[]
    userBlock?: ModerationCause
  }
  style?: ViewStyleProp['style']
}): React.ReactNode => {
  const {t: l} = useLingui()
  const queryClient = useQueryClient()
  const {currentAccount} = useSession()

  const leaveConvoControl = Prompt.usePromptControl()
  const reportControl = Prompt.usePromptControl()
  const blockedByListControl = Prompt.usePromptControl()
  const afterReportControl = Prompt.usePromptControl()

  const {listBlocks} = blockInfo

  const reportSubject = getConvoReportSubject(convo, currentAccount?.did)

  return (
    <>
      <Menu.Root control={control}>
        {!hideTrigger && (
          <View style={[style]}>
            <Menu.Trigger label={l`Chat settings`}>
              {({props}) => (
                <Button
                  label={props.accessibilityLabel}
                  {...props}
                  onPress={() => {
                    Keyboard.dismiss()
                    props.onPress()
                  }}
                  size="small"
                  color="secondary"
                  shape="round"
                  variant="ghost"
                  style={[a.bg_transparent]}>
                  <ButtonIcon icon={DotsHorizontalIcon} size="md" />
                </Button>
              )}
            </Menu.Trigger>
          </View>
        )}

        <Menu.Outer>
          <MenuContent
            profile={profile}
            showMarkAsRead={showMarkAsRead}
            blockInfo={blockInfo}
            convo={convo}
            canReport={!!reportSubject}
            leaveConvoControl={leaveConvoControl}
            reportControl={reportControl}
            blockedByListControl={blockedByListControl}
          />
        </Menu.Outer>
      </Menu.Root>
      <LeaveConvoPrompt
        control={leaveConvoControl}
        convoId={convo.view.id}
        currentScreen={currentScreen}
      />
      {reportSubject && (
        <ReportDialog
          subject={reportSubject}
          control={reportControl}
          onAfterSubmit={() => {
            unstableCacheProfileView(queryClient, profile)
            afterReportControl.open()
          }}
        />
      )}
      {convo.kind === 'group' ? (
        <AfterReportConversationDialog
          control={afterReportControl}
          currentScreen={currentScreen}
          params={{
            convoId: convo.view.id,
            did: profile.did,
          }}
        />
      ) : (
        <AfterReportDialog
          control={afterReportControl}
          currentScreen={currentScreen}
          params={{
            convoId: convo.view.id,
            did: profile.did,
          }}
        />
      )}
      <BlockedByListDialog
        control={blockedByListControl}
        listBlocks={listBlocks}
      />
    </>
  )
}
ConvoMenu = memo(ConvoMenu)

function MenuContent({
  convo: initialConvo,
  profile,
  canReport,
  showMarkAsRead,
  blockInfo,
  leaveConvoControl,
  reportControl,
  blockedByListControl,
}: {
  convo: ConvoWithDetails
  profile: Shadow<bsky.profile.AnyProfileView>
  canReport: boolean
  showMarkAsRead?: boolean
  blockInfo: {
    listBlocks: ModerationCause[]
    userBlock?: ModerationCause
  }
  leaveConvoControl: Prompt.PromptControlProps
  reportControl: Prompt.PromptControlProps
  blockedByListControl: Prompt.PromptControlProps
}) {
  const navigation = useNavigation<NavigationProp>()
  const {t: l} = useLingui()
  const {mutate: markAsRead} = useMarkAsReadMutation()

  const {listBlocks, userBlock} = blockInfo
  const isBlocking = userBlock || !!listBlocks.length
  const isDeletedAccount = profile.handle === 'missing.invalid'
  const isGroupConvo = initialConvo.kind === 'group'

  const convoId = initialConvo.view.id
  const {data: convo} = useConvoQuery({convoId})

  const onNavigateToProfile = useCallback(() => {
    navigation.navigate('Profile', {name: profile.did})
  }, [navigation, profile.did])

  const {mutate: muteConvo} = useMuteConvo(convoId, {
    onSuccess: data => {
      if (data.convo.muted) {
        Toast.show(l({message: 'Chat muted', context: 'toast'}))
      } else {
        Toast.show(l({message: 'Chat unmuted', context: 'toast'}))
      }
    },
    onError: () => {
      Toast.show(l`Could not mute chat`, {
        type: 'error',
      })
    },
  })

  const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile)

  const toggleBlock = useCallback(() => {
    if (listBlocks.length) {
      blockedByListControl.open()
      return
    }

    if (userBlock) {
      void queueUnblock()
    } else {
      void queueBlock()
    }
  }, [userBlock, listBlocks, blockedByListControl, queueBlock, queueUnblock])

  return isDeletedAccount ? (
    <Menu.Item
      destructive
      label={l`Leave conversation`}
      onPress={leaveConvoControl.open}>
      <Menu.ItemIcon icon={ArrowBoxLeftIcon} />
      <Menu.ItemText>
        <Trans>Leave conversation</Trans>
      </Menu.ItemText>
    </Menu.Item>
  ) : (
    <>
      <Menu.Group>
        {showMarkAsRead && (
          <Menu.Item
            label={l`Mark as read`}
            onPress={() => markAsRead({convoId})}>
            <Menu.ItemIcon icon={BubbleIcon} />
            <Menu.ItemText>
              <Trans>Mark as read</Trans>
            </Menu.ItemText>
          </Menu.Item>
        )}
        {isGroupConvo ? null : (
          <Menu.Item
            label={l`Go to user's profile`}
            onPress={onNavigateToProfile}>
            <Menu.ItemIcon icon={Person} />
            <Menu.ItemText>
              <Trans>Go to profile</Trans>
            </Menu.ItemText>
          </Menu.Item>
        )}
        <Menu.Item
          label={l`Mute conversation`}
          onPress={() => muteConvo({mute: !convo?.muted})}>
          <Menu.ItemIcon icon={convo?.muted ? Unmute : Mute} />
          <Menu.ItemText>
            {convo?.muted ? (
              <Trans>Unmute conversation</Trans>
            ) : (
              <Trans>Mute conversation</Trans>
            )}
          </Menu.ItemText>
        </Menu.Item>
      </Menu.Group>
      <Menu.Divider />
      <Menu.Group>
        {isGroupConvo ? null : (
          <Menu.Item
            destructive
            label={isBlocking ? l`Unblock account` : l`Block account`}
            onPress={toggleBlock}>
            <Menu.ItemIcon icon={isBlocking ? PersonCheck : PersonX} />
            <Menu.ItemText>
              {isBlocking ? l`Unblock account` : l`Block account`}
            </Menu.ItemText>
          </Menu.Item>
        )}
        {canReport && (
          <Menu.Item
            destructive
            label={l`Report conversation`}
            onPress={reportControl.open}>
            <Menu.ItemIcon icon={Flag} />
            <Menu.ItemText>
              <Trans>Report conversation</Trans>
            </Menu.ItemText>
          </Menu.Item>
        )}
      </Menu.Group>
      <Menu.Divider />
      <Menu.Group>
        <Menu.Item
          destructive
          label={l`Leave conversation`}
          onPress={leaveConvoControl.open}>
          <Menu.ItemIcon icon={ArrowBoxLeftIcon} />
          <Menu.ItemText>
            <Trans>Leave conversation</Trans>
          </Menu.ItemText>
        </Menu.Item>
      </Menu.Group>
    </>
  )
}

export {ConvoMenu}
