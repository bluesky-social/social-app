import React, {useCallback, useMemo, useState} from 'react'
import {
  ImageStyle,
  ScrollView as RNScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import {Image} from 'expo-image'
import {LinearGradient} from 'expo-linear-gradient'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModalControls} from '#/state/modals'
import {MAX_ALT_TEXT} from 'lib/constants'
import {useIsKeyboardVisible} from 'lib/hooks/useIsKeyboardVisible'
import {usePalette} from 'lib/hooks/usePalette'
import {enforceLen} from 'lib/strings/helpers'
import {gradients, s} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {isAndroid, isWeb} from 'platform/detection'
import {ImageModel} from 'state/models/media/image'
import {Text} from '../util/text/Text'
import {ScrollView, TextInput} from './util'

export const snapPoints = ['100%']

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
  const inputRef = React.useRef<RNTextInput>(null)
  const scrollViewRef = React.useRef<RNScrollView>(null)
  const keyboardShown = useIsKeyboardVisible()

  // Autofocus hack when we open the modal. We have to wait for the animation to complete first
  React.useEffect(() => {
    if (isAndroid) return
    setTimeout(() => {
      inputRef.current?.focus()
    }, 500)
  }, [])

  // We'd rather be at the bottom here so that we can easily dismiss the modal instead of having to scroll
  // (especially on android, it acts weird)
  React.useEffect(() => {
    if (keyboardShown[0]) {
      scrollViewRef.current?.scrollToEnd()
    }
  }, [keyboardShown])

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

  const onUpdate = useCallback(
    (v: string) => {
      v = enforceLen(v, MAX_ALT_TEXT)
      setAltText(v)
      image.setAltText(v)
    },
    [setAltText, image],
  )

  const onPressSave = useCallback(() => {
    image.setAltText(altText)
    closeModal()
  }, [closeModal, image, altText])

  return (
    <ScrollView
      testID="altTextImageModal"
      style={[pal.view, styles.scrollContainer]}
      keyboardShouldPersistTaps="always"
      ref={scrollViewRef}
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
            enableLiveTextInteraction
          />
        </View>
        <TextInput
          testID="altTextImageInput"
          style={[styles.textArea, pal.border, pal.text]}
          keyboardAppearance={theme.colorScheme}
          multiline
          placeholder={_(msg`Add alt text`)}
          placeholderTextColor={pal.colors.textLight}
          value={altText}
          onChangeText={onUpdate}
          accessibilityLabel={_(msg`Image alt text`)}
          accessibilityHint=""
          accessibilityLabelledBy="imageAltText"
          // @ts-ignore This is fine, type is weird on the BottomSheetTextInput
          ref={inputRef}
        />
        <View style={styles.buttonControls}>
          <TouchableOpacity
            testID="altTextImageSaveBtn"
            onPress={onPressSave}
            accessibilityLabel={_(msg`Save alt text`)}
            accessibilityHint=""
            accessibilityRole="button">
            <LinearGradient
              colors={[gradients.blueLight.start, gradients.blueLight.end]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={[styles.button]}>
              <Text type="button-lg" style={[s.white, s.bold]}>
                <Trans>Done</Trans>
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    height: '100%',
    paddingHorizontal: isWeb ? 0 : 12,
    paddingVertical: isWeb ? 0 : 24,
  },
  scrollInner: {
    gap: 12,
    paddingTop: isWeb ? 0 : 12,
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
    paddingBottom: isWeb ? 0 : 50,
  },
})
