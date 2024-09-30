import React from 'react'
import {ImageStyle, useWindowDimensions, View} from 'react-native'
import {Image} from 'expo-image'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {MAX_ALT_TEXT} from '#/lib/constants'
import {isWeb} from '#/platform/detection'
import {ComposerImage} from '#/state/gallery'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'

type Props = {
  control: Dialog.DialogOuterProps['control']
  image: ComposerImage
  onChange: (next: ComposerImage) => void
}

export const ImageAltTextDialog = (props: Props): React.ReactNode => {
  return (
    <Dialog.Outer
      control={props.control}
      nativeOptions={{sheet: {snapPoints: ['100%']}}}>
      <Dialog.Handle />

      <ImageAltTextInner {...props} />
    </Dialog.Outer>
  )
}

const ImageAltTextInner = ({
  control,
  image,
  onChange,
}: Props): React.ReactNode => {
  const {_} = useLingui()
  const t = useTheme()

  const windim = useWindowDimensions()

  const [altText, setAltText] = React.useState(image.alt)

  const onPressSubmit = React.useCallback(() => {
    control.close()
    onChange({...image, alt: altText.trim()})
  }, [control, image, altText, onChange])

  const imageStyle = React.useMemo<ImageStyle>(() => {
    const maxWidth = isWeb ? 450 : windim.width
    const source = image.transformed ?? image.source

    if (source.height > source.width) {
      return {
        resizeMode: 'contain',
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
      }
    }
    return {
      width: '100%',
      height: (maxWidth / source.width) * source.height,
      borderRadius: 8,
    }
  }, [image, windim])

  return (
    <Dialog.ScrollableInner
      label={_(msg`Add alt text`)}
      keyboardDismissMode="none">
      <View>
        <Text style={[a.text_2xl, a.font_bold, a.leading_tight, a.pb_sm]}>
          <Trans>Add alt text</Trans>
        </Text>

        <View style={[t.atoms.bg_contrast_50, a.rounded_md, a.overflow_hidden]}>
          <Image
            style={imageStyle}
            source={{
              uri: (image.transformed ?? image.source).path,
            }}
            contentFit="contain"
            accessible={true}
            accessibilityIgnoresInvertColors
            enableLiveTextInteraction
          />
        </View>
      </View>

      <View style={[a.mt_md, a.gap_md]}>
        <View>
          <TextField.LabelText>
            <Trans>Descriptive alt text</Trans>
          </TextField.LabelText>
          <TextField.Root>
            <Dialog.Input
              label={_(msg`Alt text`)}
              onChangeText={text => setAltText(text)}
              value={altText}
              multiline
              numberOfLines={3}
              autoFocus
            />
          </TextField.Root>
        </View>
        <Button
          label={_(msg`Save`)}
          disabled={altText.length > MAX_ALT_TEXT || altText === image.alt}
          size="large"
          color="primary"
          variant="solid"
          onPress={onPressSubmit}>
          <ButtonText>
            <Trans>Save</Trans>
          </ButtonText>
        </Button>
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
