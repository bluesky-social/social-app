import React from 'react'
import {Keyboard, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ShieldExclamation} from '#/lib/icons'
import {
  ADULT_CONTENT_LABELS,
  AdultSelfLabel,
  OTHER_SELF_LABELS,
  OtherSelfLabel,
  SelfLabel,
} from '#/lib/moderation'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Text} from '#/components/Typography'
export function LabelsBtn({
  labels,
  hasMedia,
  onChange,
}: {
  labels: SelfLabel[]
  hasMedia: boolean
  onChange: (v: SelfLabel[]) => void
}) {
  const control = Dialog.useDialogControl()
  const t = useTheme()
  const {_} = useLingui()

  const hasLabel = labels.length > 0

  const updateAdultLabels = (newLabels: AdultSelfLabel[]) => {
    const newLabel = newLabels[newLabels.length - 1]
    const filtered = labels.filter(l => !ADULT_CONTENT_LABELS.includes(l))
    onChange([...filtered, newLabel].filter(Boolean) as SelfLabel[])
  }

  const updateOtherLabels = (newLabels: OtherSelfLabel[]) => {
    const newLabel = newLabels[newLabels.length - 1]
    const filtered = labels.filter(l => !OTHER_SELF_LABELS.includes(l))
    onChange([...filtered, newLabel].filter(Boolean) as SelfLabel[])
  }

  if (!hasMedia && hasLabel) {
    onChange([])
  }

  return (
    <>
      <Button
        testID="labelsBtn"
        style={!hasMedia && {opacity: 0.4}}
        label={_(msg`Content warnings`)}
        accessibilityHint={_(
          msg`Opens a dialog to add a content warning to your post`,
        )}
        onPress={() => {
          Keyboard.dismiss()
          control.open()
        }}>
        <ShieldExclamation style={{color: t.palette.primary_500}} size={24} />
        {labels.length > 0 ? (
          <Check size="sm" fill={t.palette.primary_500} />
        ) : null}
      </Button>

      <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
        <Dialog.Handle />
        <DialogInner
          labels={labels}
          hasMedia={hasMedia}
          updateAdultLabels={updateAdultLabels}
          updateOtherLabels={updateOtherLabels}
        />
      </Dialog.Outer>
    </>
  )
}

function DialogInner({
  labels,
  hasMedia,
  updateAdultLabels,
  updateOtherLabels,
}: {
  labels: string[]
  hasMedia: boolean
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
            {hasMedia ? (
              <Trans>
                Choose self-labels that are applicable for the media you are
                posting. If none are selected, this post is suitable for all
                audiences.
              </Trans>
            ) : (
              <Trans>
                There are no self-labels that can be applied to this post.
              </Trans>
            )}
          </Text>
        </View>

        <View style={[a.my_md, a.gap_lg]}>
          {hasMedia ? (
            <>
              <View>
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    a.pb_sm,
                  ]}>
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
                        <Toggle.Radio />
                        <Toggle.LabelText>
                          <Trans>Suggestive</Trans>
                        </Toggle.LabelText>
                      </Toggle.Item>
                      <Toggle.Item name="nudity" label={_(msg`Nudity`)}>
                        <Toggle.Radio />
                        <Toggle.LabelText>
                          <Trans>Nudity</Trans>
                        </Toggle.LabelText>
                      </Toggle.Item>
                      <Toggle.Item name="porn" label={_(msg`Porn`)}>
                        <Toggle.Radio />
                        <Toggle.LabelText>
                          <Trans>Porn</Trans>
                        </Toggle.LabelText>
                      </Toggle.Item>
                    </View>
                  </Toggle.Group>
                  <Text style={[a.mt_sm, t.atoms.text_contrast_medium]}>
                    {labels.includes('sexual') ? (
                      <Trans>Pictures meant for adults.</Trans>
                    ) : labels.includes('nudity') ? (
                      <Trans>Artistic or non-erotic nudity.</Trans>
                    ) : labels.includes('porn') ? (
                      <Trans>Sexual activity or erotic nudity.</Trans>
                    ) : (
                      <Trans>Does not contain adult content.</Trans>
                    )}
                  </Text>
                </View>
              </View>
              <View>
                <View
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.justify_between,
                    a.pb_sm,
                  ]}>
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
                    <Toggle.Item
                      name="graphic-media"
                      label={_(msg`Graphic Media`)}>
                      <Toggle.Checkbox />
                      <Toggle.LabelText>
                        <Trans>Graphic Media</Trans>
                      </Toggle.LabelText>
                    </Toggle.Item>
                  </Toggle.Group>
                  <Text style={[a.mt_sm, t.atoms.text_contrast_medium]}>
                    {labels.includes('graphic-media') ? (
                      <Trans>
                        Media that may be disturbing or inappropriate for some
                        audiences.
                      </Trans>
                    ) : (
                      <Trans>
                        Does not contain graphic or disturbing content.
                      </Trans>
                    )}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <View style={[a.mt_sm]}>
        <Button
          label={_(msg`Done`)}
          onPress={() => control.close()}
          color="primary"
          size="large"
          variant="solid">
          <ButtonText>
            <Trans>Done</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.ScrollableInner>
  )
}
