import RootSiblings from 'react-native-root-siblings'
import React from 'react'
import {Animated, StyleSheet, View} from 'react-native'
import {Props as FontAwesomeProps} from '@fortawesome/react-native-fontawesome'
import {Text} from './text/Text'
import {colors} from 'lib/styles'
import {useTheme} from 'lib/ThemeContext'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {IS_TEST} from '#/env'

const TIMEOUT = 4e3

export function show(
  message: string,
  _icon: FontAwesomeProps['icon'] = 'check',
) {
  if (IS_TEST) return
  const item = new RootSiblings(<Toast message={message} />)
  setTimeout(() => {
    item.destroy()
  }, TIMEOUT)
}

function Toast({message}: {message: string}) {
  const theme = useTheme()
  const pal = usePalette('default')
  const interp = useAnimatedValue(0)

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(interp, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(3700),
      Animated.timing(interp, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start()
  })

  const opacityStyle = {opacity: interp}
  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          pal.view,
          pal.border,
          styles.toast,
          theme.colorScheme === 'dark' && styles.toastDark,
          opacityStyle,
        ]}>
        <Text type="lg-medium" style={pal.text}>
          {message}
        </Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 4},
    marginHorizontal: 6,
  },
  toastDark: {
    backgroundColor: colors.gray6,
    shadowOpacity: 0.5,
  },
})
