import {Keyboard, type StyleProp, type ViewStyle} from 'react-native'
import {type AnimatedStyle} from 'react-native-reanimated'
import {type AppBskyFeedPostgate} from '@atproto/api'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {type ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PostInteractionSettingsControlledDialog} from '#/components/dialogs/PostInteractionSettingsDialog'
import {TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon} from '#/components/icons/Chevron'
import {Earth_Stroke2_Corner0_Rounded as EarthIcon} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as GroupIcon} from '#/components/icons/Group'
import * as Tooltip from '#/components/Tooltip'
import {Text} from '#/components/Typography'
import {useThreadgateNudged} from '#/storage/hooks/threadgate-nudged'

export function ThreadgateBtn({
  postgate,
  onChangePostgate,
  threadgateAllowUISettings,
  onChangeThreadgateAllowUISettings,
}: {
  postgate: AppBskyFeedPostgate.Record
  onChangePostgate: (v: AppBskyFeedPostgate.Record) => void

  threadgateAllowUISettings: ThreadgateAllowUISetting[]
  onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void

  style?: StyleProp<AnimatedStyle<ViewStyle>>
}) {
  const {_} = useLingui()
  const control = Dialog.useDialogControl()
  const [threadgateNudged, setThreadgateNudged] = useThreadgateNudged()

  const onDismissTooltip = (visible: boolean) => {
    console.log('visible', visible)
    if (visible) return
    setThreadgateNudged(true)
  }

  const onPress = () => {
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }

    control.open()
  }

  const anyoneCanReply =
    threadgateAllowUISettings.length === 1 &&
    threadgateAllowUISettings[0].type === 'everybody'
  const anyoneCanQuote =
    !postgate.embeddingRules || postgate.embeddingRules.length === 0
  const anyoneCanInteract = anyoneCanReply && anyoneCanQuote
  const label = anyoneCanInteract
    ? _(msg`Anybody can interact`)
    : _(msg`Interaction limited`)

  console.log({threadgateNudged})

  return (
    <>
      <Tooltip.Outer
        visible={!threadgateNudged}
        onVisibleChange={onDismissTooltip}
        position="top">
        <Tooltip.Target>
          <Button
            color={threadgateNudged ? 'secondary' : 'primary_subtle'}
            size="small"
            testID="openReplyGateButton"
            onPress={onPress}
            label={label}
            accessibilityHint={_(
              msg`Opens a dialog to choose who can reply to this thread`,
            )}>
            <ButtonIcon icon={anyoneCanInteract ? EarthIcon : GroupIcon} />
            <ButtonText numberOfLines={1}>{label}</ButtonText>
            <ButtonIcon icon={TinyChevronIcon} size="2xs" />
          </Button>
        </Tooltip.Target>
        <Tooltip.TextBubble>
          <Text>
            <Trans>Psst! You can edit who can interact with this post.</Trans>
          </Text>
        </Tooltip.TextBubble>
      </Tooltip.Outer>

      <PostInteractionSettingsControlledDialog
        control={control}
        onSave={() => {
          control.close()
        }}
        postgate={postgate}
        onChangePostgate={onChangePostgate}
        threadgateAllowUISettings={threadgateAllowUISettings}
        onChangeThreadgateAllowUISettings={onChangeThreadgateAllowUISettings}
      />
    </>
  )
}
