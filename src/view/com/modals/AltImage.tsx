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
import {useStores} from 'state/index'
import {isDesktopWeb, isAndroid} from 'platform/detection'
import {ImageModel} from 'state/models/media/image'

export const snapPoints = ['fullscreen']

interface Props {
  image: ImageModel
}

export function Component({image}: Props) {
  const pal = usePalette('default')
  const store = useStores()
  const theme = useTheme()
  const [altText, setAltText] = useState(image.altText)
  const windim = useWindowDimensions()

  const imageStyles = useMemo<ImageStyle>(() => {
    const maxWidth = isDesktopWeb ? 450 : windim.width
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
    store.shell.closeModal()
  }, [store, image, altText])

  const onPressCancel = () => {
    store.shell.closeModal()
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
            accessibilityLabel="Image alt text"
            accessibilityHint=""
            accessibilityLabelledBy="imageAltText"
            autoFocus
          />
          <View style={styles.buttonControls}>
            <TouchableOpacity
              testID="altTextImageSaveBtn"
              onPress={onPressSave}
              accessibilityLabel="Save alt text"
              accessibilityHint={`Saves alt text, which reads: ${altText}`}
              accessibilityRole="button">
              <LinearGradient
                colors={[gradients.blueLight.start, gradients.blueLight.end]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[styles.button]}>
                <Text type="button-lg" style={[s.white, s.bold]}>
                  Save
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              testID="altTextImageCancelBtn"
              onPress={onPressCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel add image alt text"
              accessibilityHint=""
              onAccessibilityEscape={onPressCancel}>
              <View style={[styles.button]}>
                <Text type="button-lg" style={[pal.textLight]}>
                  Cancel
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
    paddingVertical: isDesktopWeb ? 0 : 18,
  },
  scrollContainer: {
    flex: 1,
    height: '100%',
    paddingHorizontal: isDesktopWeb ? 0 : 12,
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
