import React from 'react'
import {StyleSheet, Text, View, Pressable} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {s, colors, gradients} from 'lib/styles'
import {isDesktopWeb} from 'platform/detection'
import {usePalette} from 'lib/hooks/usePalette'

export const ConfirmLanguagesButton = ({
  onPress,
  extraText,
}: {
  onPress: () => void
  extraText?: string
}) => {
  const pal = usePalette('default')
  return (
    <View style={[styles.btnContainer, pal.borderDark]}>
      <Pressable
        testID="confirmContentLanguagesBtn"
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Confirm content language settings"
        accessibilityHint="">
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.btn]}>
          <Text style={[s.white, s.bold, s.f18]}>Done{extraText}</Text>
        </LinearGradient>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  btnContainer: {
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: isDesktopWeb ? 0 : 40,
    borderTopWidth: isDesktopWeb ? 0 : 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
})
