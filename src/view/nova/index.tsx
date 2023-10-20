import {View, Text as RNText} from 'react-native'

import {createSystem} from './lib/system'
import {light, dark} from './themes'
import {web} from './lib/utils'

export * from './lib/utils'

const {
  ThemeProvider,
  useTheme,
  useTokens,
  useBreakpoints,
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
  useTokens,
  useBreakpoints,
  useStyle,
  useStyles,
  styled,
}

export const Box = styled(View)
export const Text = styled(RNText, {
  color: 'l8',
  fontSize: 's',
})

/**
 * @see https://necolas.github.io/react-native-web/docs/accessibility/#semantic-html
 * @see https://docs.expo.dev/develop/user-interface/fonts/
 */
export const H1 = styled(RNText, {
  color: 'l8',
  fontSize: 'l',
  gtMobile: {
    fontSize: 'xl',
  },
  ...web({
    role: 'heading',
    'aria-level': 1,
  }),
})
export const H2 = styled(RNText, {
  color: 'l8',
  fontSize: 'm',
  gtMobile: {
    fontSize: 'l',
  },
  ...web({
    role: 'heading',
    'aria-level': 2,
  }),
})
export const H3 = styled(RNText, {
  color: 'l8',
  fontSize: 'm',
  ...web({
    role: 'heading',
    'aria-level': 3,
  }),
})
export const H4 = styled(RNText, {
  color: 'l8',
  fontSize: 's',
  ...web({
    role: 'heading',
    'aria-level': 4,
  }),
})
export const H5 = styled(RNText, {
  color: 'l8',
  fontSize: 'xs',
  ...web({
    role: 'heading',
    'aria-level': 5,
  }),
})
export const H6 = styled(RNText, {
  color: 'l8',
  fontSize: 'xxs',
  ...web({
    role: 'heading',
    'aria-level': 6,
  }),
})
export const P = styled(RNText, {
  color: 'l8',
  fontSize: 's',
  ...web({
    role: 'paragraph',
  }),
})
