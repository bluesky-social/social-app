import React, {useCallback} from 'react'
import {StyleSheet, View} from 'react-native'
import {usePalette} from 'lib/hooks/usePalette'
import {gradients, s} from 'lib/styles'
import {Text} from '../util/text/Text'
import {TouchableOpacity} from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import {useStores} from 'state/index'
import {isDesktopWeb} from 'platform/detection'

export const snapPoints = ['70%']

interface Props {
  altText: string
}

export function Component({altText}: Props) {
  const pal = usePalette('default')
  const store = useStores()

  const onPress = useCallback(() => {
    store.shell.closeModal()
  }, [store])

  return (
    <View
      testID="altTextImageModal"
      style={[pal.view, styles.container, s.flex1]}>
      <Text style={[styles.title, pal.text]}>Image description</Text>
      <View style={[styles.text, pal.viewLight]}>
        <Text style={pal.text}>{altText}</Text>
      </View>
      <TouchableOpacity
        testID="altTextImageSaveBtn"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Save"
        accessibilityHint="Save alt text">
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.button]}>
          <Text type="button-lg" style={[s.white, s.bold]}>
            Done
          </Text>
        </LinearGradient>
      </TouchableOpacity>
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
  text: {
    borderRadius: 5,
    marginVertical: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 10,
  },
})
