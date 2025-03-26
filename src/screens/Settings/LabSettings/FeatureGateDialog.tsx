import {useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {type Gate, useGateDescriptions} from '#/lib/statsig/gates'
import {logger} from '#/logger'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Divider} from '#/components/Divider'
import * as Toggle from '#/components/forms/Toggle'
import {
  EmojiSad_Stroke2_Corner0_Rounded as EmojiSad,
  EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmile,
} from '#/components/icons/Emoji'
import {P, Text} from '#/components/Typography'

enum FeedbackToken {
  LoveIt = 'love-it',
  HateIt = 'hate-it',
  Useful = 'useful',
  MakesAppLooksBetter = 'makes-app-look-better',
  MakesThingsEasier = 'makes-things-easier',
  PromisingButNeedsWork = 'promising-but-needs-work',
  RemovesImportantFeatures = 'removes-important-features',
  ConfusedMe = 'confused-me',
  BrokeMyWillToLive = 'broke-my-will-to-live',
}

export function FeatureGateDialog({
  control,
  gate,
}: {
  control: Dialog.DialogOuterProps['control']
  gate: Gate
}) {
  const {_} = useLingui()
  const t = useTheme()

  const descriptions = useGateDescriptions()
  const desc = descriptions[gate]

  if (!desc) {
    return null
  }

  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        accessibilityDescribedBy="dialog-description"
        accessibilityLabelledBy="dialog-title">
        <View style={[a.relative, a.gap_md, a.w_full]}>
          <Text
            nativeID="dialog-title"
            style={[a.text_2xl, a.font_bold, t.atoms.text]}>
            {desc.title}
          </Text>

          <P nativeID="dialog-description">{desc.description}</P>

          <View
            style={[a.rounded_sm, t.atoms.bg_contrast_25, a.px_md, a.py_sm]}>
            <Toggle.Item
              name="quoteposts"
              type="checkbox"
              label={_(msg`Tap to toggle this experiment.`)}
              value={true}
              onChange={_v => {}}
              style={[a.justify_between]}>
              <Text style={[t.atoms.text_contrast_high]}>
                <Trans>Enable on this device</Trans>
              </Text>
              <Toggle.Switch />
            </Toggle.Item>
          </View>

          {desc.help ? (
            <>
              <Divider style={[a.my_lg]} />
              {desc.help.map((line, i) => (
                <P key={`help-${i}`}>{line}</P>
              ))}
            </>
          ) : undefined}

          <Divider style={[a.my_lg]} />

          <Text style={[a.text_xl, a.font_bold, t.atoms.text]}>Feedback</Text>

          <View style={[a.flex_row, a.gap_sm]}>
            <FeedbackButton gate={gate} feedback={FeedbackToken.LoveIt} />
            <FeedbackButton gate={gate} feedback={FeedbackToken.HateIt} />
          </View>

          <View style={[a.flex_col, a.gap_sm]}>
            <FeedbackButton gate={gate} feedback={FeedbackToken.Useful} />
            <FeedbackButton
              gate={gate}
              feedback={FeedbackToken.MakesAppLooksBetter}
            />
            <FeedbackButton
              gate={gate}
              feedback={FeedbackToken.MakesThingsEasier}
            />
            <FeedbackButton
              gate={gate}
              feedback={FeedbackToken.PromisingButNeedsWork}
            />
            <FeedbackButton
              gate={gate}
              feedback={FeedbackToken.RemovesImportantFeatures}
            />
            <FeedbackButton gate={gate} feedback={FeedbackToken.ConfusedMe} />
            <FeedbackButton
              gate={gate}
              feedback={FeedbackToken.BrokeMyWillToLive}
            />
          </View>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

export function FeedbackButton({
  gate,
  feedback,
}: {
  gate: Gate
  feedback: FeedbackToken
}) {
  const {_} = useLingui()
  const [pressed, setPressed] = useState(false)
  const onPress = () => {
    setPressed(!pressed)
    logger.metric('featureGate:feedback', {gate, feedback})
  }
  const label = {
    [FeedbackToken.BrokeMyWillToLive]: _(msg`It broke my will to live`),
    [FeedbackToken.ConfusedMe]: _(msg`It confused me`),
    [FeedbackToken.HateIt]: _(msg`I hate it`),
    [FeedbackToken.LoveIt]: _(msg`I love it`),
    [FeedbackToken.MakesAppLooksBetter]: _(msg`Makes the app look better`),
    [FeedbackToken.MakesThingsEasier]: _(msg`Makes things easier`),
    [FeedbackToken.PromisingButNeedsWork]: _(msg`Promising, but needs work`),
    [FeedbackToken.RemovesImportantFeatures]: _(
      msg`Removes important features`,
    ),
    [FeedbackToken.Useful]: _(msg`Useful`),
  }[feedback]

  return (
    <Button
      variant="solid"
      color={pressed ? 'primary' : 'secondary'}
      size="large"
      onPress={onPress}
      style={[
        (feedback === FeedbackToken.LoveIt ||
          feedback === FeedbackToken.HateIt) &&
          a.flex_1,
      ]}
      label={label}>
      {feedback === FeedbackToken.LoveIt && (
        <ButtonIcon icon={EmojiSmile} position="left" />
      )}
      {feedback === FeedbackToken.HateIt && (
        <ButtonIcon icon={EmojiSad} position="left" />
      )}
      <ButtonText>{label}</ButtonText>
    </Button>
  )
}
