import {Keyboard, StyleProp, ViewStyle} from 'react-native'
import {AnimatedStyle} from 'react-native-reanimated'
import {AppBskyFeedPostgate} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {native} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PostInteractionSettingsControlledDialog} from '#/components/dialogs/PostInteractionSettingsDialog'
import {Earth_Stroke2_Corner0_Rounded as Earth} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'

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

  return (
    <>
      <Button
        variant="solid"
        color="secondary"
        size="small"
        testID="openReplyGateButton"
        onPress={onPress}
        label={label}
        accessibilityHint={_(
          msg`Opens a dialog to choose who can reply to this thread`,
        )}
        style={[
          native({
            paddingHorizontal: 8,
            paddingVertical: 6,
          }),
        ]}>
        <ButtonIcon icon={anyoneCanInteract ? Earth : Group} />
        <ButtonText numberOfLines={1}>{label}</ButtonText>
      </Button>
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
