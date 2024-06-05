import React from 'react'
import {Keyboard, LayoutAnimation, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {ShieldExclamation} from '#/lib/icons'
import {isNative} from '#/platform/detection'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as ToggleButton from '#/components/forms/ToggleButton'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {Text} from '#/components/Typography'

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

  const removeAdultLabel = () => {
    const final = labels.filter(l => !ADULT_CONTENT_LABELS.includes(l))
    onChange(final)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }

  const hasAdultSelection =
    labels.includes('sexual') ||
    labels.includes('nudity') ||
    labels.includes('porn')

  if (!hasMedia && hasAdultSelection) {
    removeAdultLabel()
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
          if (isNative && Keyboard.isVisible()) {
            Keyboard.dismiss()
          }
          control.open()
        }}>
        <ShieldExclamation style={{color: t.palette.primary_500}} size={24} />
        {labels.length > 0 ? (
          <Check size="sm" fill={t.palette.primary_500} />
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

                <Button
                  label={_(msg`Remove`)}
                  variant="ghost"
                  color="primary"
                  size="xsmall"
                  onPress={removeAdultLabel}
                  disabled={!hasAdultSelection}
                  style={{opacity: hasAdultSelection ? 1 : 0}}
                  aria-hidden={!hasAdultSelection}>
                  <ButtonText>
                    <Trans>Remove</Trans>
                  </ButtonText>
                </Button>
              </View>
              {hasMedia ? (
                <>
                  <ToggleButton.Group
                    label={_(msg`Adult Content labels`)}
                    values={labels}
                    onChange={values => {
                      onChange(values)
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut,
                      )
                    }}>
                    <ToggleButton.Button
                      name="sexual"
                      label={_(msg`Suggestive`)}>
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
