import React, {useCallback} from 'react'
import {observer} from 'mobx-react-lite'
import {StyleSheet, View, TouchableOpacity} from 'react-native'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {ToggleButton} from '../util/forms/ToggleButton'
import LinearGradient from 'react-native-linear-gradient'
import {colors, gradients, s} from 'lib/styles'
import {useStores} from 'state/index'

export const snapPoints = ['90%']

export const Component = observer(() => {
  const pal = usePalette('default')
  const store = useStores()
  const {shell} = store

  const onToggleKeyboardPreferences = useCallback(() => {
    shell.setKeyboardShortcuts(!shell.keyboardShortcuts)
  }, [shell])

  const onPress = useCallback(() => {
    store.shell.closeModal()
  }, [store.shell])

  const shortcutStyles = {
    opacity: shell.keyboardShortcuts ? 1 : 0.5,
  }

  return (
    <View testID="preferencesModal" style={[pal.view, styles.container]}>
      <View>
        <Text style={[pal.text, styles.title]}>Preferences</Text>
        <Text type="md" style={[pal.text, styles.description]}>
          Configure device preferences.
        </Text>
      </View>
      <View style={[styles.preferenceGroup, pal.borderDark]}>
        <View style={styles.preference}>
          <Text style={pal.text}>Keyboard shortcuts</Text>
          <ToggleButton
            type="default-light"
            label=""
            onPress={onToggleKeyboardPreferences}
            isSelected={shell.keyboardShortcuts}
            style={styles.toggleButton}
          />
        </View>

        <View style={[styles.shortcutContainer, shortcutStyles]}>
          <Text type="sm" style={pal.textLight}>
            Compose post
          </Text>
          <Text
            type="sm"
            style={[styles.shortcut, pal.textLight, pal.borderDark]}>
            n
          </Text>
        </View>
      </View>
      <TouchableOpacity
        testID="closePreferencesModalButton"
        style={s.mt10}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Close"
        accessibilityHint="Closes preferences modal">
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.btn]}>
          <Text style={[s.white, s.bold, s.f18]}>Close</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
  },
  container: {
    flexDirection: 'column',
    flex: 1,
    gap: 24,
    paddingVertical: 12,
  },
  preferenceGroup: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    flexDirection: 'column',
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  toggleButton: {
    // TODO: detach spacing styles from primitives
    paddingHorizontal: 0,
  },
  shortcutContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  shortcut: {
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
})
