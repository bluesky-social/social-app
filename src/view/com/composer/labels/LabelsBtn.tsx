import {Keyboard, View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {
  ADULT_CONTENT_LABELS,
  type AdultSelfLabel,
  OTHER_SELF_LABELS,
  type OtherSelfLabel,
  type SelfLabel,
} from '#/lib/moderation'
import {atoms as a, useTheme, web} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
import {TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon} from '#/components/icons/Chevron'
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
  const {t: l} = useLingui()

  const hasLabel = labels.length > 0

  const updateAdultLabels = (newLabels: AdultSelfLabel[]) => {
    const newLabel = newLabels[newLabels.length - 1]
    const filtered = labels.filter(
      label => !ADULT_CONTENT_LABELS.includes(label as AdultSelfLabel),
    )
    onChange([...new Set([...filtered, newLabel].filter(Boolean))])
  }

  const updateOtherLabels = (newLabels: OtherSelfLabel[]) => {
    const newLabel = newLabels[newLabels.length - 1]
    const filtered = labels.filter(
      label => !OTHER_SELF_LABELS.includes(label as OtherSelfLabel),
    )
    onChange([...new Set([...filtered, newLabel].filter(Boolean))])
  }

  return (
    <>
      <Button
        color="secondary"
        size="small"
        testID="labelsBtn"
        onPress={() => {
          Keyboard.dismiss()
          control.open()
        }}
        label={l`Content warnings`}
        accessibilityHint={l`Opens a dialog to add a content warning to your post`}>
        <ButtonIcon icon={hasLabel ? Check : Shield_Stroke2_Corner0_Rounded} />
        <ButtonText numberOfLines={1} maxFontSizeMultiplier={2}>
          {labels.length > 0 ? (
            <Trans>Labels added</Trans>
          ) : (
            <Trans>Labels</Trans>
          )}
        </ButtonText>
        <ButtonIcon icon={TinyChevronIcon} size="2xs" />
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
  const {t: l} = useLingui()
  const control = Dialog.useDialogContext()
  const t = useTheme()

  return (
    <Dialog.ScrollableInner
      label={l`Add a content warning`}
      style={[web({maxWidth: 400}), a.w_full]}>
      <View style={[a.flex_1, a.gap_lg]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>Add a content warning</Trans>
          </Text>
          <Text
            style={[a.text_md, a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              Please add any content warning labels that are applicable for the
              media you are posting.
            </Trans>
          </Text>
        </View>

        <View style={[a.gap_sm]}>
          <Text style={[a.text_md, a.font_medium]}>
            <Trans>Adult Content</Trans>
          </Text>
          <Toggle.Group
            label={l`Adult Content labels`}
            values={labels}
            onChange={values => {
              updateAdultLabels(values as AdultSelfLabel[])
            }}>
            <Toggle.PanelGroup>
              <Toggle.Item name="sexual" label={l`Suggestive`} hitSlop={0}>
                {({selected}) => (
                  <Toggle.Panel active={selected} adjacent="trailing">
                    <Toggle.Checkbox />
                    <Toggle.PanelText>
                      <Trans>Suggestive</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                )}
              </Toggle.Item>
              <Toggle.Item name="nudity" label={l`Nudity`} hitSlop={0}>
                {({selected}) => (
                  <Toggle.Panel active={selected} adjacent="both">
                    <Toggle.Checkbox />
                    <Toggle.PanelText>
                      <Trans>Nudity</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                )}
              </Toggle.Item>
              <Toggle.Item name="porn" label={l`Porn`} hitSlop={0}>
                {({selected}) => (
                  <Toggle.Panel active={selected} adjacent="leading">
                    <Toggle.Checkbox />
                    <Toggle.PanelText>
                      <Trans>Adult</Trans>
                    </Toggle.PanelText>
                  </Toggle.Panel>
                )}
              </Toggle.Item>
            </Toggle.PanelGroup>
          </Toggle.Group>
          {labels.includes('sexual') ? (
            <LabelDescriptionText>
              <Trans>Pictures meant for adults.</Trans>
            </LabelDescriptionText>
          ) : labels.includes('nudity') ? (
            <LabelDescriptionText>
              <Trans>Artistic or non-erotic nudity.</Trans>
            </LabelDescriptionText>
          ) : labels.includes('porn') ? (
            <LabelDescriptionText>
              <Trans>Sexual activity or erotic nudity.</Trans>
            </LabelDescriptionText>
          ) : null}
        </View>

        <View style={[a.gap_sm]}>
          <Text style={[a.text_md, a.font_medium]}>
            <Trans>Other</Trans>
          </Text>
          <Toggle.Group
            label={l`Adult Content labels`}
            values={labels}
            onChange={values => {
              updateOtherLabels(values as OtherSelfLabel[])
            }}>
            <Toggle.Item
              name="graphic-media"
              label={l`Graphic Media`}
              hitSlop={0}>
              {({selected}) => (
                <Toggle.Panel active={selected}>
                  <Toggle.Checkbox />
                  <Toggle.PanelText>
                    <Trans>Graphic Media</Trans>
                  </Toggle.PanelText>
                </Toggle.Panel>
              )}
            </Toggle.Item>
          </Toggle.Group>
          {labels.includes('graphic-media') ? (
            <LabelDescriptionText>
              <Trans>
                Media that may be disturbing or inappropriate for some
                audiences.
              </Trans>
            </LabelDescriptionText>
          ) : null}
        </View>

        <Button
          label={l`Done`}
          onPress={() => control.close()}
          color="primary"
          size="large"
          testID="confirmBtn">
          <ButtonText>
            <Trans>Done</Trans>
          </ButtonText>
        </Button>
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

function LabelDescriptionText({children}: {children: React.ReactNode}) {
  const t = useTheme()
  return (
    <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
      {children}
    </Text>
  )
}
