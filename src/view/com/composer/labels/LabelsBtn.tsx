import {Keyboard, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  ADULT_CONTENT_LABELS,
  AdultSelfLabel,
  OTHER_SELF_LABELS,
  OtherSelfLabel,
  SelfLabel,
} from '#/lib/moderation'
import {isWeb} from '#/platform/detection'
import {atoms as a, native, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Shield_Stroke2_Corner0_Rounded} from '#/components/icons/Shield'
import {Text} from '#/components/Typography'

export function LabelsBtn({
  labels,
  onChange,
}: {
  labels: SelfLabel[]
  onChange: (v: SelfLabel[]) => void
}) {
  const control = Dialog.useDialogControl()
  const {_} = useLingui()

  const hasLabel = labels.length > 0

  const updateAdultLabels = (newLabels: AdultSelfLabel[]) => {
    const newLabel = newLabels[newLabels.length - 1]
    const filtered = labels.filter(l => !ADULT_CONTENT_LABELS.includes(l))
    onChange([
      ...new Set([...filtered, newLabel].filter(Boolean) as SelfLabel[]),
    ])
  }

  const updateOtherLabels = (newLabels: OtherSelfLabel[]) => {
    const newLabel = newLabels[newLabels.length - 1]
    const filtered = labels.filter(l => !OTHER_SELF_LABELS.includes(l))
    onChange([
      ...new Set([...filtered, newLabel].filter(Boolean) as SelfLabel[]),
    ])
  }

  return (
    <>
      <Button
        variant="solid"
        color="secondary"
        size="small"
        testID="labelsBtn"
        onPress={() => {
          Keyboard.dismiss()
          control.open()
        }}
        label={_(msg`Content warnings`)}
        accessibilityHint={_(
          msg`Opens a dialog to add a content warning to your post`,
        )}
        style={[
          native({
            paddingHorizontal: 8,
            paddingVertical: 6,
          }),
        ]}>
        <ButtonIcon icon={hasLabel ? Check : Shield_Stroke2_Corner0_Rounded} />
        <ButtonText numberOfLines={1}>
          {labels.length > 0 ? (
            <Trans>Labels added</Trans>
          ) : (
            <Trans>Labels</Trans>
          )}
        </ButtonText>
      </Button>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <DialogInner
          labels={labels}
          updateAdultLabels={updateAdultLabels}
          updateOtherLabels={updateOtherLabels}
        />
      </Dialog.Outer>
    </>
  )
}

function DialogInner({
  labels,
  updateAdultLabels,
  updateOtherLabels,
}: {
  labels: string[]
  updateAdultLabels: (labels: AdultSelfLabel[]) => void
  updateOtherLabels: (labels: OtherSelfLabel[]) => void
}) {
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const t = useTheme()

  return (
    <Dialog.ScrollableInner
      label={_(msg`Add a content warning`)}
      style={[{maxWidth: 500}, a.w_full]}>
      <View style={[a.flex_1]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Add a content warning</Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            <Trans>
              Please add any content warning labels that are applicable for the
              media you are posting.
            </Trans>
          </Text>
        </View>

        <View style={[a.my_md, a.gap_lg]}>
          <View>
            <View
              style={[a.flex_row, a.align_center, a.justify_between, a.pb_sm]}>
              <Text style={[a.font_bold, a.text_lg]}>
                <Trans>Adult Content</Trans>
              </Text>
            </View>
            <View
              style={[
                a.p_md,
                a.rounded_sm,
                a.border,
                t.atoms.border_contrast_medium,
              ]}>
              <Toggle.Group
                label={_(msg`Adult Content labels`)}
                values={labels}
                onChange={values => {
                  updateAdultLabels(values as AdultSelfLabel[])
                }}>
                <View style={[a.gap_sm]}>
                  <Toggle.Item name="sexual" label={_(msg`Suggestive`)}>
                    <Toggle.Checkbox />
                    <Toggle.LabelText>
                      <Trans>Suggestive</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                  <Toggle.Item name="nudity" label={_(msg`Nudity`)}>
                    <Toggle.Checkbox />
                    <Toggle.LabelText>
                      <Trans>Nudity</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                  <Toggle.Item name="porn" label={_(msg`Porn`)}>
                    <Toggle.Checkbox />
                    <Toggle.LabelText>
                      <Trans>Adult</Trans>
                    </Toggle.LabelText>
                  </Toggle.Item>
                </View>
              </Toggle.Group>
              {labels.includes('sexual') ||
              labels.includes('nudity') ||
              labels.includes('porn') ? (
                <Text style={[a.mt_sm, t.atoms.text_contrast_medium]}>
                  {labels.includes('sexual') ? (
                    <Trans>Pictures meant for adults.</Trans>
                  ) : labels.includes('nudity') ? (
                    <Trans>Artistic or non-erotic nudity.</Trans>
                  ) : labels.includes('porn') ? (
                    <Trans>Sexual activity or erotic nudity.</Trans>
                  ) : (
                    ''
                  )}
                </Text>
              ) : null}
            </View>
          </View>
          <View>
            <View
              style={[a.flex_row, a.align_center, a.justify_between, a.pb_sm]}>
              <Text style={[a.font_bold, a.text_lg]}>
                <Trans>Other</Trans>
              </Text>
            </View>
            <View
              style={[
                a.p_md,
                a.rounded_sm,
                a.border,
                t.atoms.border_contrast_medium,
              ]}>
              <Toggle.Group
                label={_(msg`Adult Content labels`)}
                values={labels}
                onChange={values => {
                  updateOtherLabels(values as OtherSelfLabel[])
                }}>
                <Toggle.Item name="graphic-media" label={_(msg`Graphic Media`)}>
                  <Toggle.Checkbox />
                  <Toggle.LabelText>
                    <Trans>Graphic Media</Trans>
                  </Toggle.LabelText>
                </Toggle.Item>
              </Toggle.Group>
              {labels.includes('graphic-media') ? (
                <Text style={[a.mt_sm, t.atoms.text_contrast_medium]}>
                  <Trans>
                    Media that may be disturbing or inappropriate for some
                    audiences.
                  </Trans>
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <View style={[a.mt_sm, web([a.flex_row, a.ml_auto])]}>
        <Button
          label={_(msg`Done`)}
          onPress={() => control.close()}
          color="primary"
          size={isWeb ? 'small' : 'large'}
          variant="solid"
          testID="confirmBtn">
          <ButtonText>
            <Trans>Done</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}
