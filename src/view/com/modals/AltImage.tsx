import React, {useCallback, useState} from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {TextInput} from './util'
import {gradients, s} from 'lib/styles'
import {enforceLen} from 'lib/strings/helpers'
import {MAX_ALT_TEXT} from 'lib/constants'
import {useTheme} from 'lib/ThemeContext'
import {Text} from '../util/text/Text'
import {TouchableOpacity} from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'
import {isDesktopWeb} from 'platform/detection'

export const snapPoints = ['80%']

interface Props {
  prevAltText: string
  onAltTextSet: (altText?: string | undefined) => void
}

export function Component({prevAltText, onAltTextSet}: Props) {
  const pal = usePalette('default')
  const store = useStores()
  const theme = useTheme()
  const [altText, setAltText] = useState(prevAltText)

  const onPressSave = useCallback(() => {
    onAltTextSet(altText)
    store.shell.closeModal()
  }, [store, altText, onAltTextSet])

  const onPressCancel = () => {
    store.shell.closeModal()
  }

  return (
    <View
      testID="altTextImageModal"
      style={[pal.view, styles.container, s.flex1]}>
      <Text style={[styles.title, pal.text]}>Add alt text</Text>
      <TextInput
        testID="altTextImageInput"
        style={[styles.textArea, pal.border, pal.text]}
        keyboardAppearance={theme.colorScheme}
        multiline
        value={altText}
        onChangeText={text => setAltText(enforceLen(text, MAX_ALT_TEXT))}
      />
      <View style={styles.buttonControls}>
        <TouchableOpacity testID="altTextImageSaveBtn" onPress={onPressSave}>
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
          onPress={onPressCancel}>
          <View style={[styles.button]}>
            <Text type="button-lg" style={[pal.textLight]}>
              Cancel
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingVertical: isDesktopWeb ? 0 : 18,
    paddingHorizontal: isDesktopWeb ? 0 : 12,
    height: '100%',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
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
