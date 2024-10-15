import React from 'react'
import {Keyboard, LayoutAnimation, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ShieldExclamation} from '#/lib/icons'
import {SELF_LABELS, SelfLabel} from '#/lib/moderation'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as ToggleButton from '#/components/forms/ToggleButton'
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

  const removeLabel = () => {
    const final = labels.filter(l => !SELF_LABELS.includes(l))
    onChange(final)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }

  if (!hasMedia && hasLabel) {
    removeLabel()
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
          hasLabel={hasLabel}
          removeLabel={removeLabel}
          onChange={onChange}
        />
      </Dialog.Outer>
    </>
  )
}

function DialogInner({
  labels,
  hasMedia,
  hasLabel,
  removeLabel,
  onChange,
}: {
  labels: string[]
  hasMedia: boolean
  hasLabel: boolean
  removeLabel: () => void
  onChange: (v: SelfLabel[]) => void
}) {
  const {_} = useLingui()
  const control = Dialog.useDialogContext()
  const t = useTheme()

  return (
    <Dialog.ScrollableInner
      label={_(msg`Add a content warning`)}
      style={[{maxWidth: 500}, a.w_full]}>
      <View style={[a.flex_1, a.gap_md]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Add a content warning</Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.leading_snug]}>
            {hasMedia ? (
              <Trans>
                Choose self labels that are applicable for the media you are
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

        <View style={[a.my_md]}>
          {hasMedia ? (
            <View style={[a.gap_sm]}>
              <View style={[t.atoms.border_contrast_high]}>
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
                <ToggleButton.Group
                  label={_(msg`Adult Content labels`)}
                  values={labels}
                  onChange={values => {
                    onChange(values as SelfLabel[])
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    )
                  }}>
                  <ToggleButton.Button name="sexual" label={_(msg`Suggestive`)}>
                    <ToggleButton.ButtonText>
                      <Trans>Suggestive</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                  <ToggleButton.Button name="nudity" label={_(msg`Nudity`)}>
                    <ToggleButton.ButtonText>
                      <Trans>Nudity</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                  <ToggleButton.Button name="porn" label={_(msg`Porn`)}>
                    <ToggleButton.ButtonText>
                      <Trans>Porn</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                </ToggleButton.Group>
              </View>
              <View style={[t.atoms.border_contrast_high]}>
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
                <ToggleButton.Group
                  label={_(msg`Adult Content labels`)}
                  values={labels}
                  onChange={values => {
                    onChange(values as SelfLabel[])
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    )
                  }}>
                  <ToggleButton.Button
                    name="graphic-media"
                    label={_(msg`Graphic Media`)}>
                    <ToggleButton.ButtonText>
                      <Trans>Graphic</Trans>
                    </ToggleButton.ButtonText>
                  </ToggleButton.Button>
                </ToggleButton.Group>
              </View>
              <Text style={[a.mt_sm, t.atoms.text_contrast_medium]}>
                {labels.includes('sexual') ? (
                  <Trans>Pictures meant for adults.</Trans>
                ) : labels.includes('nudity') ? (
                  <Trans>Artistic or non-erotic nudity.</Trans>
                ) : labels.includes('porn') ? (
                  <Trans>Sexual activity or erotic nudity.</Trans>
                ) : labels.includes('graphic-media') ? (
                  <Trans>
                    Media that may be disturbing or inappropriate for some
                    audiences.
                  </Trans>
                ) : (
                  ' '
                )}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={[
          a.gap_md,
          web([a.gap_sm, a.flex_row_reverse, {marginLeft: 'auto'}]),
        ]}>
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
        {hasMedia && hasLabel ? (
          <Button
            label={_(msg`Remove`)}
            variant="ghost"
            color="negative"
            size="large"
            onPress={removeLabel}
            disabled={!hasLabel}>
            <ButtonText>
              <Trans>Remove</Trans>
            </ButtonText>
          </Button>
        ) : null}
      </View>
    </Dialog.ScrollableInner>
  )
}
