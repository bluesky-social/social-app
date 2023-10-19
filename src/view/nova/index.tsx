import { View, Text as RNText, Pressable as RNPressable } from 'react-native'

import { createSystem } from './lib/system'
import { light, dark } from './themes'
import { web } from './lib/utils'

export * from './lib/utils'

const {
  ThemeProvider,
  useTheme,
  useStyle,
  useStyles,
  styled,
} = createSystem({
  light,
  dark,
})

export {
  ThemeProvider,
  useTheme,
  useStyle,
  useStyles,
  styled,
}

export const Box = styled(View)
export const Pressable = styled(RNPressable)
export const Text = styled(RNText, {
  color: 'l8',
  fontSize: 's',
})

/**
 * @see https://necolas.github.io/react-native-web/docs/accessibility/#semantic-html
 * @see https://docs.expo.dev/develop/user-interface/fonts/
 */
export const H1 = styled(RNText, {
  role: web('heading'),
  color: 'l8',
  fontSize: 'l',
  gtMobile: {
    fontSize: 'xl',
  },
  ...web({
    'aria-level': 1,
  }),
})
export const P = styled(RNText, {
  role: web('paragraph'),
  color: 'l8',
  fontSize: 's',
})
