import React from 'react'
import {Keyboard, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ShieldExclamation} from '#/lib/icons'
import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Text} from '#/components/Typography'
import {SelectableBtn} from '../../util/forms/SelectableBtn'

const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn']

export function LabelsBtn({
  labels,
  hasMedia,
  onChange,
}: {
  labels: string[]
  hasMedia: boolean
  onChange: (v: string[]) => void
}) {
  const control = Dialog.useDialogControl()
  const t = useTheme()
  const {_} = useLingui()

  const toggleAdultLabel = (label: string) => {
    const hadLabel = labels.includes(label)
    const stripped = labels.filter(l => !ADULT_CONTENT_LABELS.includes(l))
    const final = !hadLabel ? stripped.concat([label]) : stripped
    onChange(final)
  }

  const removeAdultLabel = () => {
    const final = labels.filter(l => !ADULT_CONTENT_LABELS.includes(l))
    onChange(final)
  }

  const hasAdultSelection =
    labels.includes('sexual') ||
    labels.includes('nudity') ||
    labels.includes('porn')

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
          if (isNative && Keyboard.isVisible()) {
            Keyboard.dismiss()
          }
          control.open()
        }}>
        <ShieldExclamation style={{color: t.palette.primary_500}} size={24} />
        {labels.length > 0 ? (
          <Check size="md" fill={t.palette.primary_500} />
        ) : null}
      </Button>

      <Dialog.Outer control={control}>
        <Dialog.Handle />
        <Dialog.ScrollableInner
          label={_(msg`Add a content warning`)}
          style={[{maxWidth: 500}, a.w_full]}>
          <View style={[a.flex_1, a.gap_md]}>
            <Text style={[a.text_2xl, a.font_bold]}>
              <Trans>Add a content warning</Trans>
            </Text>

            <View
              style={[
                a.border,
                a.p_md,
                t.atoms.border_contrast_high,
                a.rounded_md,
              ]}>
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
                {hasAdultSelection ? (
                  <Button
                    label={_(msg`Remove`)}
                    variant="ghost"
                    onPress={removeAdultLabel}>
                    <ButtonText>
                      <Trans>Remove</Trans>
                    </ButtonText>
                  </Button>
                ) : null}
              </View>
              {hasMedia ? (
                <>
                  <View style={a.flex_row}>
                    <SelectableBtn
                      testID="sexualLabelBtn"
                      selected={labels.includes('sexual')}
                      left
                      label={_(msg`Suggestive`)}
                      onSelect={() => toggleAdultLabel('sexual')}
                      accessibilityHint=""
                      style={a.flex_1}
                    />
                    <SelectableBtn
                      testID="nudityLabelBtn"
                      selected={labels.includes('nudity')}
                      label={_(msg`Nudity`)}
                      onSelect={() => toggleAdultLabel('nudity')}
                      accessibilityHint=""
                      style={a.flex_1}
                    />
                    <SelectableBtn
                      testID="pornLabelBtn"
                      selected={labels.includes('porn')}
                      label={_(msg`Porn`)}
                      right
                      onSelect={() => toggleAdultLabel('porn')}
                      accessibilityHint=""
                      style={a.flex_1}
                    />
                  </View>

                  <Text style={[a.mt_sm, t.atoms.text_contrast_medium]}>
                    {labels.includes('sexual') ? (
                      <Trans>Pictures meant for adults.</Trans>
                    ) : labels.includes('nudity') ? (
                      <Trans>Artistic or non-erotic nudity.</Trans>
                    ) : labels.includes('porn') ? (
                      <Trans>Sexual activity or erotic nudity.</Trans>
                    ) : (
                      <Trans>
                        If none are selected, suitable for all ages.
                      </Trans>
                    )}
                  </Text>
                </>
              ) : (
                <View>
                  <Text style={t.atoms.text_contrast_medium}>
                    <Trans>
                      <Text style={[a.font_bold, t.atoms.text_contrast_medium]}>
                        Not Applicable.
                      </Text>{' '}
                      This warning is only available for posts with media
                      attached.
                    </Trans>
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Button
            label={_(msg`Done`)}
            onPress={() => control.close()}
            onAccessibilityEscape={control.close}
            color="primary"
            size="medium"
            variant="solid"
            style={a.mt_xl}>
            <ButtonText>
              <Trans>Done</Trans>
            </ButtonText>
          </Button>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
