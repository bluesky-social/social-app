import React, {useMemo, useCallback, useState} from 'react'
import {
  ImageStyle,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import {Image} from 'expo-image'
import {usePalette} from 'lib/hooks/usePalette'
import {gradients, s} from 'lib/styles'
import {enforceLen} from 'lib/strings/helpers'
import {MAX_ALT_TEXT} from 'lib/constants'
import {useTheme} from 'lib/ThemeContext'
import {Text} from '../util/text/Text'
import LinearGradient from 'react-native-linear-gradient'
import {isAndroid, isWeb} from 'platform/detection'
import {ImageModel} from 'state/models/media/image'
import {useLingui} from '@lingui/react'
import {Trans, msg} from '@lingui/macro'
import {useModalControls} from '#/state/modals'

export const snapPoints = ['fullscreen']

interface Props {
  image: ImageModel
}

export function Component({image}: Props) {
  const pal = usePalette('default')
  const theme = useTheme()
  const {_} = useLingui()
  const [altText, setAltText] = useState(image.altText)
  const windim = useWindowDimensions()
  const {closeModal} = useModalControls()

  const imageStyles = useMemo<ImageStyle>(() => {
    const maxWidth = isWeb ? 450 : windim.width
    if (image.height > image.width) {
      return {
        resizeMode: 'contain',
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
      }
    }
    return {
      width: '100%',
      height: (maxWidth / image.width) * image.height,
      borderRadius: 8,
    }
  }, [image, windim])

  const onPressSave = useCallback(() => {
    image.setAltText(altText)
    closeModal()
  }, [closeModal, image, altText])

  const onPressCancel = () => {
    closeModal()
  }

  return (
    <KeyboardAvoidingView
      behavior={isAndroid ? 'height' : 'padding'}
      style={[pal.view, styles.container]}>
      <ScrollView
        testID="altTextImageModal"
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="always"
        nativeID="imageAltText">
        <View style={styles.scrollInner}>
          <View style={[pal.viewLight, styles.imageContainer]}>
            <Image
              testID="selectedPhotoImage"
              style={imageStyles}
              source={{
                uri: image.cropped?.path ?? image.path,
              }}
              contentFit="contain"
              accessible={true}
              accessibilityIgnoresInvertColors
            />
          </View>
          <TextInput
            testID="altTextImageInput"
            style={[styles.textArea, pal.border, pal.text]}
            keyboardAppearance={theme.colorScheme}
            multiline
            placeholder="Add alt text"
            placeholderTextColor={pal.colors.textLight}
            value={altText}
            onChangeText={text => setAltText(enforceLen(text, MAX_ALT_TEXT))}
            accessibilityLabel={_(msg`Image alt text`)}
            accessibilityHint=""
            accessibilityLabelledBy="imageAltText"
            autoFocus
          />
          <View style={styles.buttonControls}>
            <TouchableOpacity
              testID="altTextImageSaveBtn"
              onPress={onPressSave}
              accessibilityLabel={_(msg`Save alt text`)}
              accessibilityHint={`Saves alt text, which reads: ${altText}`}
              accessibilityRole="button">
              <LinearGradient
                colors={[gradients.blueLight.start, gradients.blueLight.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.button]}>
                <Text type="button-lg" style={[s.white, s.bold]}>
                  <Trans>Save</Trans>
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              testID="altTextImageCancelBtn"
              onPress={onPressCancel}
              accessibilityRole="button"
              accessibilityLabel={_(msg`Cancel add image alt text`)}
              accessibilityHint=""
              onAccessibilityEscape={onPressCancel}>
              <View style={[styles.button]}>
                <Text type="button-lg" style={[pal.textLight]}>
                  <Trans>Cancel</Trans>
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
    paddingVertical: isWeb ? 0 : 18,
  },
  scrollContainer: {
    flex: 1,
    height: '100%',
    paddingHorizontal: isWeb ? 0 : 12,
  },
  scrollInner: {
    gap: 12,
  },
  imageContainer: {
    borderRadius: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 6,
    paddingTop: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 10,
  },
  buttonControls: {
    gap: 8,
  },
})
