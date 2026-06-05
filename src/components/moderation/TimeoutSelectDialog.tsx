import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {type ModerationTimeoutDuration} from '#/state/moderation-timeouts'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Text} from '#/components/Typography'

export function TimeoutSelectDialog({
  control,
  label,
  title,
  description,
  confirmLabel,
  value,
  onChange,
  onConfirm,
  confirmColor,
}: {
  control: Dialog.DialogControlProps
  label: string
  title: string
  description: string
  confirmLabel: string
  value: ModerationTimeoutDuration
  onChange: (duration: ModerationTimeoutDuration) => void
  onConfirm: (duration: ModerationTimeoutDuration) => void | Promise<void>
  confirmColor?: 'primary' | 'negative'
}) {
  const {t: l} = useLingui()
  const t = useTheme()

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner label={label} style={[a.gap_2xl]}>
        <View style={[a.gap_sm, a.pb_sm]}>
          <Text style={[a.text_2xl, a.font_bold]}>{title}</Text>
          <Text
            style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
            {description}
          </Text>
        </View>

        <Toggle.Group
          label={l`Choose a timeout duration`}
          type="radio"
          values={[value]}
          onChange={values =>
            onChange((values.at(0) || 'forever') as ModerationTimeoutDuration)
          }>
          <View style={[a.gap_2xs]}>
            <Option
              label={l`Forever`}
              name="forever"
              title={
                <Text>
                  <Trans>Forever</Trans>
                </Text>
              }
              subtitle={
                <Text>
                  <Trans>Keep this action until you undo it.</Trans>
                </Text>
              }
            />
            <Option
              label={l`24 hours`}
              name="24_hours"
              title={
                <Text>
                  <Trans>24 hours</Trans>
                </Text>
              }
              subtitle={
                <Text>
                  <Trans>Lift it after one day.</Trans>
                </Text>
              }
            />
            <Option
              label={l`7 days`}
              name="7_days"
              title={
                <Text>
                  <Trans>7 days</Trans>
                </Text>
              }
              subtitle={
                <Text>
                  <Trans>Lift it after one week.</Trans>
                </Text>
              }
            />
            <Option
              label={l`30 days`}
              name="30_days"
              title={
                <Text>
                  <Trans>30 days</Trans>
                </Text>
              }
              subtitle={
                <Text>
                  <Trans>Lift it after one month.</Trans>
                </Text>
              }
            />
          </View>
        </Toggle.Group>

        <View style={[a.gap_sm, a.mt_md]}>
          <Button
            label={confirmLabel}
            onPress={() => control.close(() => void onConfirm(value))}
            size="large"
            color={confirmColor ?? 'primary'}>
            <ButtonText>{confirmLabel}</ButtonText>
          </Button>
          <Button
            label={l`Cancel`}
            onPress={() => control.close()}
            size="large"
            color="secondary">
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </View>
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Option({
  label,
  name,
  title,
  subtitle,
}: {
  label: string
  name: ModerationTimeoutDuration
  title: React.ReactNode
  subtitle: React.ReactNode
}) {
  const t = useTheme()
  return (
    <Toggle.Item label={label} name={name}>
      {({selected}) => (
        <Toggle.Panel active={selected}>
          <Toggle.Radio />
          <View style={[a.flex_1, a.gap_2xs]}>
            <Toggle.LabelText style={[a.text_md, a.font_semi_bold]}>
              {title}
            </Toggle.LabelText>
            <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
              {subtitle}
            </Text>
          </View>
        </Toggle.Panel>
      )}
    </Toggle.Item>
  )
}
