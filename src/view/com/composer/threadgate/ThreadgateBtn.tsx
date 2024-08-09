import React from 'react'
import {Keyboard, StyleProp, ViewStyle} from 'react-native'
import Animated, {AnimatedStyle} from 'react-native-reanimated'
import {AppBskyFeedPostgate} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {isNative} from '#/platform/detection'
import {embeddingRules} from '#/state/queries/postgate/util'
import {ThreadgateAllowUISetting} from '#/state/queries/threadgate'
import {useAnalytics} from 'lib/analytics/analytics'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {PostInteractionSettingsDialog} from '#/components/dialogs/PostInteractionSettingsDialog'
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {Earth_Stroke2_Corner0_Rounded as Earth} from '#/components/icons/Globe'
import {Group3_Stroke2_Corner0_Rounded as Group} from '#/components/icons/Group'

export function ThreadgateBtn({
  postgate,
  onChangePostgate,
  threadgateAllowUISettings,
  onChangeThreadgateAllowUISettings,
  style,
}: {
  postgate: AppBskyFeedPostgate.Record
  onChangePostgate: (v: AppBskyFeedPostgate.Record) => void

  threadgateAllowUISettings: ThreadgateAllowUISetting[]
  onChangeThreadgateAllowUISettings: (v: ThreadgateAllowUISetting[]) => void

  style?: StyleProp<AnimatedStyle<ViewStyle>>
}) {
  const {track} = useAnalytics()
  const {_} = useLingui()
  const t = useTheme()
  const control = Dialog.useDialogControl()

  const onPress = () => {
    track('Composer:ThreadgateOpened')
    if (isNative && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }

    control.open()
  }

  const anyoneCanReply =
    threadgateAllowUISettings.length === 1 &&
    threadgateAllowUISettings[0].type === 'everybody'
  const noOneCanReply =
    threadgateAllowUISettings.length === 1 &&
    threadgateAllowUISettings[0].type === 'nobody'
  const anyoneCanQuote =
    !postgate.quotepostRules || postgate.quotepostRules.length === 0
  const noOneCanQuote =
    postgate.quotepostRules?.length === 1 &&
    postgate.quotepostRules[0]?.$type === embeddingRules.disableRule.$type
  const anyoneCanInteract = anyoneCanReply && anyoneCanQuote
  const noOneCanInteract = noOneCanReply && noOneCanQuote
  const label = anyoneCanInteract
    ? _(msg`Anybody can interact`)
    : noOneCanInteract
    ? _(msg`Nobody can interact`)
    : _(msg`Interaction limited`)

  return (
    <>
      <Animated.View style={[a.flex_row, a.p_sm, t.atoms.bg, style]}>
        <Button
          variant="solid"
          color="secondary"
          size="xsmall"
          testID="openReplyGateButton"
          onPress={onPress}
          label={label}
          accessibilityHint={_(
            msg`Opens a dialog to choose who can reply to this thread`,
          )}>
          <ButtonIcon
            icon={
              anyoneCanInteract
                ? Earth
                : noOneCanInteract
                ? CircleBanSign
                : Group
            }
          />
          <ButtonText>{label}</ButtonText>
        </Button>
      </Animated.View>
      <PostInteractionSettingsDialog
        control={control}
        isSaving={false}
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
