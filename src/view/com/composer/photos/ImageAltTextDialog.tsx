import {useRef, useState} from 'react'
import {type ImageStyle, useWindowDimensions, View} from 'react-native'
import {Image} from 'expo-image'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {enforceLen} from '#/lib/strings/helpers'
import {type ComposerImage} from '#/state/gallery'
import {CharProgress} from '#/view/com/composer/char-progress/CharProgress'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Text} from '#/components/Typography'
import {IS_LIQUID_GLASS, IS_WEB} from '#/env'

type Props = {
  control: Dialog.DialogOuterProps['control']
  image: ComposerImage
  onChange: (next: ComposerImage) => void
  sourceViewTag?: number
}

export const ImageAltTextDialog = ({
  control,
  image,
  onChange,
  sourceViewTag,
}: Props): React.ReactNode => {
  /*
   * The text being edited lives in ImageAltTextInner, not here. The sheet's
   * portal forwards its children from an effect, so state held above it reaches
   * the controlled input a commit late and makes typing jumpy. This only tracks
   * the latest edit so it can be saved on close, however the dialog is closed.
   * Cancel clears it, which leaves the alt text as it was.
   */
  const editedAltText = useRef<string | null>(null)

  return (
    <Dialog.Outer
      control={control}
      onClose={() => {
        if (editedAltText.current === null) return
        onChange({
          ...image,
          alt: enforceLen(editedAltText.current, MAX_ALT_TEXT, true),
        })
        editedAltText.current = null
      }}
      nativeOptions={{fullHeight: true, sourceViewTag}}>
      <ImageAltTextInner
        control={control}
        image={image}
        onChangeText={text => {
          editedAltText.current = text
        }}
        onCancel={() => {
          editedAltText.current = null
          control.close()
        }}
      />
    </Dialog.Outer>
  )
}

const ImageAltTextInner = ({
  onChangeText,
  onCancel,
  control,
  image,
}: {
  onChangeText: (text: string) => void
  onCancel: () => void
  control: DialogControlProps
  image: Props['image']
}): React.ReactNode => {
  const [altText, setAltText] = useState(image.alt)
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  const {height: screenHeight} = useWindowDimensions()
  const isUnchanged = altText === image.alt

  const source = image.transformed ?? image.source
  const imageStyle: ImageStyle = {
    width: '100%',
    /*
     * Portrait images get a square box (the image is letterboxed inside it by
     * contentFit), landscape images get their natural aspect ratio.
     */
    aspectRatio: Math.max(1, source.width / source.height),
    /*
     * On native the image is a reference for the writer, not a preview: cap
     * it so as much of it as possible shows in the space left under the field
     * once the keyboard is up.
     */
    maxHeight: IS_WEB ? undefined : screenHeight * 0.3,
    borderRadius: 8,
  }

  const cancelButton = () => (
    <Button
      label={l`Cancel`}
      onPress={onCancel}
      size="small"
      color="primary"
      variant="ghost"
      style={[a.rounded_full]}
      testID="altTextCancelBtn">
      <ButtonText style={[a.text_md]}>
        <Trans>Cancel</Trans>
      </ButtonText>
    </Button>
  )

  const saveButton = () => (
    <Button
      label={l`Save`}
      onPress={() => control.close()}
      disabled={isUnchanged}
      size="small"
      color="primary"
      variant="ghost"
      style={[a.rounded_full]}
      testID="altTextSaveBtn">
      <ButtonText style={[a.text_md, isUnchanged && t.atoms.text_contrast_low]}>
        <Trans>Save</Trans>
      </ButtonText>
    </Button>
  )

  return (
    <Dialog.ScrollableInner
      label={l`Add alt text`}
      style={[a.overflow_hidden]}
      contentContainerStyle={[a.px_0, a.pt_0]}
      header={
        <Dialog.Header renderLeft={cancelButton} renderRight={saveButton}>
          <Dialog.HeaderText>
            <Trans>Add alt text</Trans>
          </Dialog.HeaderText>
        </Dialog.Header>
      }>
      <View style={[a.pt_lg, a.gap_md, IS_LIQUID_GLASS ? a.px_2xl : a.px_xl]}>
        {/*
         * The field comes first so it is always fully visible above the
         * keyboard. The image sits below it and scrolls into view as needed.
         */}
        <View style={[a.gap_sm]}>
          <View>
            <View style={[a.flex_row, a.justify_between, a.align_center]}>
              <TextField.LabelText>
                <Trans>Descriptive alt text</Trans>
              </TextField.LabelText>
              <CharProgress
                /*
                 * The inner count Text uses flexGrow, which Yoga sizes to
                 * nothing inside an auto-width container. The composer footer
                 * gives it a fixed width for the same reason.
                 */
                style={[a.mb_sm, {minWidth: 65}]}
                textStyle={[a.text_sm, t.atoms.text_contrast_medium]}
                size={20}
                count={altText.length}
                max={MAX_ALT_TEXT}
              />
            </View>
            <TextField.Root>
              <Dialog.Input
                label={l`Alt text`}
                onChangeText={text => {
                  setAltText(text)
                  onChangeText(text)
                }}
                value={altText}
                style={{minHeight: 120}}
                multiline
                autoFocus
                scrollEnabled={false}
              />
            </TextField.Root>
          </View>

          {altText.length > MAX_ALT_TEXT && (
            <View style={[a.flex_row, a.gap_xs]}>
              <CircleInfo fill={t.palette.negative_500} />
              <Text
                style={[
                  a.italic,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Alt text will be truncated.{' '}
                  <Plural
                    value={MAX_ALT_TEXT}
                    other={`Limit: ${i18n.number(MAX_ALT_TEXT)} characters.`}
                  />
                </Trans>
              </Text>
            </View>
          )}
        </View>

        <View style={[t.atoms.bg_contrast_50, a.rounded_sm, a.overflow_hidden]}>
          <Image
            style={imageStyle}
            source={{uri: (image.transformed ?? image.source).path}}
            contentFit="contain"
            accessible={true}
            accessibilityIgnoresInvertColors
            enableLiveTextInteraction
            autoplay={false}
          />
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
