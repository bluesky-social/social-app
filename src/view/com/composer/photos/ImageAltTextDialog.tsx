import {useRef, useState} from 'react'
import {type ImageStyle, View} from 'react-native'
import {Image} from 'expo-image'
import {Plural, Trans, useLingui} from '@lingui/react/macro'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {enforceLen} from '#/lib/strings/helpers'
import {type ComposerImage} from '#/state/gallery'
import {AltTextCounterWrapper} from '#/view/com/composer/AltTextCounterWrapper'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {type DialogControlProps} from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {Sparkle_Stroke2_Corner0_Rounded as SparkleIcon} from '#/components/icons/Sparkle'
import {TimesLarge_Stroke2_Corner0_Rounded as TimesIcon} from '#/components/icons/Times'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'

type Props = {
  control: Dialog.DialogOuterProps['control']
  image: ComposerImage
  /** Whether alt text is being generated for the image. */
  isGenerating?: boolean
  onChange: (next: ComposerImage) => void
  sourceViewTag?: number
}

export const ImageAltTextDialog = ({
  control,
  image,
  isGenerating = false,
  onChange,
  sourceViewTag,
}: Props): React.ReactNode => {
  /*
   * The text being edited lives in ImageAltTextInner, not here. The sheet's
   * portal forwards its children from an effect, so state held above it reaches
   * the controlled input a commit late and makes typing jumpy. This only tracks
   * the latest edit so it can be saved on close, however the dialog is closed.
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
      <Dialog.Handle />
      <ImageAltTextInner
        control={control}
        image={image}
        isGenerating={isGenerating}
        onChangeText={text => {
          editedAltText.current = text
        }}
      />
    </Dialog.Outer>
  )
}

const ImageAltTextInner = ({
  onChangeText,
  control,
  image,
  isGenerating,
}: {
  onChangeText: (text: string) => void
  control: DialogControlProps
  image: Props['image']
  isGenerating: boolean
}): React.ReactNode => {
  const [altText, setAltText] = useState(image.alt)
  const {t: l, i18n} = useLingui()
  const t = useTheme()

  /*
   * A suggestion can arrive while the dialog is open. Show it, unless the user
   * has already started typing.
   */
  const [prevAlt, setPrevAlt] = useState(image.alt)
  if (image.alt !== prevAlt) {
    setPrevAlt(image.alt)
    if (altText === prevAlt) setAltText(image.alt)
  }
  const isSuggestion = altText.length > 0 && altText === image.generatedAlt
  const showGenerating = isGenerating && (!altText || isSuggestion)

  const onChangeAltText = (text: string) => {
    setAltText(text)
    onChangeText(text)
  }

  const source = image.transformed ?? image.source
  const imageStyle: ImageStyle = {
    width: '100%',
    aspectRatio: Math.max(1, source.width / source.height),
    borderRadius: 8,
  }

  return (
    <Dialog.ScrollableInner label={l`Add alt text`}>
      <Dialog.Close />

      <View>
        {/* vertical space is too precious - gets scrolled out of the way anyway */}
        {IS_WEB && (
          <Text
            style={[a.text_2xl, a.font_semi_bold, a.leading_tight, a.pb_sm]}>
            <Trans>Add alt text</Trans>
          </Text>
        )}

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

      <View style={[a.mt_md, a.gap_md]}>
        <View style={[a.gap_sm]}>
          <View style={[a.relative, {width: '100%'}]}>
            <TextField.LabelText>
              <Trans>Descriptive alt text</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <Dialog.Input
                label={l`Alt text`}
                onChangeText={onChangeAltText}
                value={altText}
                multiline
                autoFocus
                scrollEnabled={false}
              />
            </TextField.Root>
          </View>

          {showGenerating ? (
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <Loader size="sm" />
              <Text style={[a.text_sm, t.atoms.text_contrast_medium]}>
                <Trans>Generating alt text…</Trans>
              </Text>
            </View>
          ) : isSuggestion ? (
            <View style={[a.flex_row, a.align_center, a.gap_sm]}>
              <SparkleIcon size="sm" fill={t.palette.primary_500} />
              <Text
                style={[
                  a.flex_1,
                  a.text_sm,
                  a.leading_snug,
                  t.atoms.text_contrast_medium,
                ]}>
                <Trans>
                  Generated. Check that it’s accurate before posting.
                </Trans>
              </Text>
              <Button
                label={l`Clear generated alt text`}
                size="tiny"
                color="secondary"
                onPress={() => onChangeAltText('')}>
                <ButtonIcon icon={TimesIcon} />
                <ButtonText>
                  <Trans>Clear</Trans>
                </ButtonText>
              </Button>
            </View>
          ) : null}

          {altText.length > MAX_ALT_TEXT && (
            <View style={[a.pb_sm, a.flex_row, a.gap_xs]}>
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

        <AltTextCounterWrapper altText={altText}>
          <Button
            label={l`Save`}
            disabled={altText === image.alt}
            size="large"
            color="primary"
            variant="solid"
            onPress={() => {
              control.close()
            }}
            style={[a.flex_grow]}>
            <ButtonText>
              <Trans>Save</Trans>
            </ButtonText>
          </Button>
        </AltTextCounterWrapper>
      </View>
    </Dialog.ScrollableInner>
  )
}
